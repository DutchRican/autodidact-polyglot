/**
 * Quiz attempts as a signed, self-contained token.
 *
 * The attempt used to live in a `Map` on the server: the quiz page minted an id,
 * every answer was recorded against it, and the results were read back at the
 * end. That works in one long-lived process and nowhere else. On Vercel each
 * request can reach a different instance -- or a cold one -- so the answer
 * POST arrived at a process that had never seen the attempt, `record` threw
 * 400, and htmx silently refused to swap the response (`[45]..` is
 * `swap:false`). The learner saw a click that highlighted and did nothing.
 *
 * So the attempt is now the state: marks travel with the browser and come back
 * signed. Any instance can read it, so nothing depends on which one answers.
 *
 * Token shape: `base64url(payload).base64url(HMAC-SHA256(payload))`, where the
 * payload is `{"quizId": ..., "marks": [bool, ...]}`.
 *
 * Signing is what keeps the score honest. The signature covers the marks, so a
 * browser cannot invent one it did not earn. The key must therefore be stable
 * across instances, which is what `QUIZ_SECRET` is for.
 */

/** Marks accumulated so far, plus the quiz they belong to. */
export interface Attempt {
  quizId: string;
  marks: boolean[];
}

const encoder = new TextEncoder();

function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

async function sign(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(body))));
}

/**
 * Compare in constant time, so a wrong signature cannot be narrowed down one
 * character at a time by timing the response.
 */
function matches(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // timingSafeEqual throws on a length mismatch, and the length is not a secret.
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

/**
 * Only ever a fallback for local development, where a hardcoded key is
 * harmless: it just has to be stable, so `bun --hot` reloads and fresh attempts
 * keep working. Production refuses to start without `QUIZ_SECRET` -- a key that
 * changes on every cold start would reintroduce the exact bug this file exists
 * to remove.
 */
const DEV_SECRET = "autodidact-polyglot:development-only:not-a-real-secret";

export function resolveSecret(env: Record<string, string | undefined> = process.env): string {
  const configured = env["QUIZ_SECRET"]?.trim();
  if (configured && configured.length >= 16) return configured;

  if (env["NODE_ENV"] === "production") {
    throw new Error(
      "QUIZ_SECRET must be set to at least 16 characters. Without a key that is " +
        "the same on every instance, quiz attempts cannot be verified across them.",
    );
  }
  console.warn(
    "[quiz] QUIZ_SECRET is unset; falling back to a development key. Set it before deploying.",
  );
  return DEV_SECRET;
}

export class AttemptCodec {
  constructor(private readonly secret: string) {}

  /** A fresh, empty attempt for a quiz. */
  async start(quizId: string): Promise<string> {
    return this.encode({ quizId, marks: [] });
  }

  async encode(attempt: Attempt): Promise<string> {
    const body = base64url(encoder.encode(JSON.stringify(attempt)));
    return `${body}.${await sign(body, this.secret)}`;
  }

  /**
   * Read an attempt back, or null if the token is missing, malformed, signed
   * with a different key, or carries the wrong quiz. Callers decide what a null
   * means; nothing here throws.
   */
  async decode(token: string, quizId?: string): Promise<Attempt | null> {
    const cut = token.lastIndexOf(".");
    if (cut <= 0) return null;

    const body = token.slice(0, cut);
    if (!matches(await sign(body, this.secret), token.slice(cut + 1))) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== "object") return null;

    const { quizId: id, marks } = parsed as { quizId?: unknown; marks?: unknown };
    if (typeof id !== "string") return null;
    if (!Array.isArray(marks) || marks.some((x) => typeof x !== "boolean")) return null;
    if (quizId !== undefined && id !== quizId) return null;

    return { quizId: id, marks: marks as boolean[] };
  }

  /**
   * The score for a finished attempt. `marks` is padded or trimmed to `total`,
   * so a token from a quiz that has since changed length still scores.
   */
  finish(attempt: Attempt | null, total: number): {
    correct: number;
    total: number;
    ratio: number;
    marks: boolean[];
  } {
    const marks = Array.from({ length: total }, (_, i) => attempt?.marks[i] ?? false);
    const correct = marks.filter(Boolean).length;
    return { correct, total, ratio: total ? correct / total : 0, marks };
  }
}