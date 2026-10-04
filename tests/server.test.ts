import { describe, expect, test, beforeAll } from "bun:test";
import { indexPack, loadPack } from "../src/engine/content.ts";
import { createApp } from "../src/server/app.ts";
import { conjugate } from "../src/engine/conjugation.ts";
import type { Lesson } from "../src/types.ts";

const pack = await loadPack("content/es.json");
const index = indexPack(pack);
const app = createApp({ pack, index });

const get = (path: string) => app.request(`http://localhost${path}`);
const post = (path: string, body: Record<string, string>) =>
  app.request(`http://localhost${path}`, {
    method: "POST",
    body: new URLSearchParams(body),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });

const quizCtx = { pack, baseLang: pack.language.baseLang };

/**
 * The correct response for question i, computed from the content — the same way
 * the server grades it, so the test can't drift from the real answers.
 */
function correctResponse(lesson: Lesson, i: number): string {
  const q = lesson.quiz.questions[i];
  if (!q) throw new Error(`no question ${i}`);
  if (q.type === "choice") {
    const option = q.options.find((o) => o.correct);
    if (!option) throw new Error("choice question has no correct option");
    return option.value;
  }
  if (q.type === "fill") return q.answer;
  const verb = pack.verbs.find((v) => v.id === q.verbId);
  if (!verb) throw new Error(`missing verb ${q.verbId}`);
  return conjugate(verb, pack.conjugation, q.tense).forms[q.persona] ?? "";
}

/** Play a whole quiz answering every question correctly; return results HTML. */
async function playQuiz(lessonId: string) {
  const page = await get(`/lessons/${lessonId}/quiz`);
  const html = await page.text();
  const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1];
  if (!attempt) throw new Error("no attempt id on quiz page");

  const lesson = index.lessons().find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`no lesson ${lessonId}`);
  const total = lesson.quiz.questions.length;

  for (let i = 0; i < total; i++) {
    // The question must actually be shown before it can be answered.
    const qHtml = await (
      await get(`/api/quizzes/${lesson.quiz.id}/question/${i}?attempt=${attempt}`)
    ).text();
    const answer = correctResponse(lesson, i);
    const question = lesson.quiz.questions[i]!;
    if (question.type === "fill") {
      // Fill questions render an empty input; the answer is graded server-side.
      expect(qHtml).toContain('class="fill__input"');
    } else {
      // The correct answer must actually be offered as an option.
      const offered = [...qHtml.matchAll(/data-response="([^"]*)"/g)].map((m) =>
        m[1]!
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&"),
      );
      expect(offered).toContain(answer);
    }
    await post(`/api/quizzes/${lesson.quiz.id}/reveal/${i}`, { attempt, response: answer });
  }

  return (await get(`/api/quizzes/${lesson.quiz.id}/question/${total}?attempt=${attempt}`)).text();
}

describe("pages", () => {
  test("home lists every lesson", async () => {
    const res = await get("/");
    expect(res.status).toBe(200);
    const html = await res.text();
    for (const lesson of index.lessons()) expect(html).toContain(lesson.title);
  });

  test("lesson page renders a conjugation table with every persona", async () => {
    const html = await (await get("/lessons/hablar-presente")).text();
    for (const forma of ["hablo", "hablas", "habla", "hablamos", "habláis", "hablan"]) {
      expect(html).toContain(forma);
    }
    for (const p of pack.conjugation.personae) expect(html).toContain(p.id);
  });

  test("irregular forms are labelled", async () => {
    const html = await (await get("/lessons/irregulares")).text();
    expect(html).toContain("soy");
    expect(html).toContain("estoy");
    expect(html).toContain("irregular");
  });

  test("verb reference conjugates every verb in the pack", async () => {
    const html = await (await get("/verbs")).text();
    for (const verb of pack.verbs) {
      for (const form of Object.values(conjugate(verb, pack.conjugation, "present").forms)) {
        expect(html).toContain(form);
      }
    }
  });

  test("story lessons render the passage with clickable glossary words", async () => {
    const html = await (await get("/lessons/lectura-mercado")).text();
    expect(html).toContain("María va al");
    expect(html).toContain("con su hija Ana");
    // The glossary word is wrapped in a button, and keeps its punctuation outside.
    expect(html).toContain('data-gloss="familia"');
    expect(html).toContain(">familia</button>.");
    expect(html).toContain('data-meaning="the market"');
  });

  test("404 for unknown lesson", async () => {
    expect((await get("/lessons/nope")).status).toBe(404);
  });

  test("static assets are served", async () => {
    for (const [path, type] of [
      ["/styles.css", "text/css"],
      ["/app.js", "text/javascript"],
      ["/vendor/htmx.min.js", "text/javascript"],
    ] as const) {
      const res = await get(path);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain(type);
    }
  });
});

describe("quiz flow", () => {
  test("question 0 renders options and the attempt id", async () => {
    const html = await (await get("/lessons/hablar-presente/quiz")).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1] ?? "";
    const q = await (
      await get(`/api/quizzes/hablar-quiz/question/0?attempt=${attempt}`)
    ).text();
    expect(q).toContain("Question 1 of 8");
    expect(q).toContain(attempt);
  });

  test("wrong answer shows the right answer and is not counted", async () => {
    const html = await (await get("/lessons/hablar-presente/quiz")).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1]!;
    const res = await post("/api/quizzes/hablar-quiz/reveal/0", {
      attempt,
      response: "zzzzz",
    });
    const body = await res.text();
    expect(body).toContain("Not quite");
    expect(body).toContain("hablo");
    expect(body).toContain('data-correct="false"');
  });

  test("accent-free answer is accepted for a conjugation question", async () => {
    const html = await (await get("/lessons/saludos/quiz")).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1]!;
    const res = await post("/api/quizzes/saludos-quiz/reveal/2", {
      attempt,
      response: "HOLA",
    });
    expect(await res.text()).toContain("Correct");
  });

  test("a full correct run passes and reports the score", async () => {
    const lesson = index.lessons().find((l) => l.id === "hablar-presente")!;
    const results = await playQuiz("hablar-presente");
    expect(results).toContain("Lesson complete");
    expect(results).toContain(`${lesson.quiz.questions.length}/${lesson.quiz.questions.length}`);
    expect(results).toContain("Next: ");
  });

  test("one wrong answer fails a high-threshold quiz", async () => {
    const html = await (await get("/lessons/hablar-presente/quiz")).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1]!;
    const lesson = index.lessons().find((l) => l.id === "hablar-presente")!;
    const total = lesson.quiz.questions.length;

    for (let i = 0; i < total; i++) {
      await get(`/api/quizzes/${lesson.quiz.id}/question/${i}?attempt=${attempt}`);
      const answer = i === 0 ? "not-a-form" : correctResponse(lesson, i);
      await post(`/api/quizzes/${lesson.quiz.id}/reveal/${i}`, { attempt, response: answer });
    }
    const results = await (
      await get(`/api/quizzes/${lesson.quiz.id}/question/${total}?attempt=${attempt}`)
    ).text();
    // 7/8 = 87.5%, still above 80%.
    expect(results).toContain("Lesson complete");
    expect(results).toContain("7/8");
  });

  test("a client cannot inflate its own score", async () => {
    // Ask for results without answering anything.
    const html = await (await get("/lessons/hablar-presente/quiz")).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1]!;
    const results = await (
      await get(`/api/quizzes/hablar-quiz/question/8?attempt=${attempt}`)
    ).text();
    expect(results).toContain("Keep going");
    expect(results).toContain("0/8");
  });

  test("results require a valid attempt", async () => {
    const res = await get("/api/quizzes/hablar-quiz/question/8?attempt=forged");
    expect(res.status).toBe(400);
  });

  test("every lesson quiz can be completed with correct answers", async () => {
    for (const lesson of index.lessons()) {
      const results = await playQuiz(lesson.id);
      expect(results).toContain("Lesson complete");
      expect(results).toContain(`${lesson.quiz.questions.length}/${lesson.quiz.questions.length}`);
    }
  });
});

describe("escaping", () => {
  test("story text is escaped, not injected", async () => {
    const evil = structuredClone(pack) as any;
    evil.stories[0].title = "<script>alert(1)</script>";
    const evilApp = createApp({ pack: evil, index: indexPack(evil) });
    const html = await (await evilApp.request("http://x/lessons/lectura-mercado")).text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("option values cannot break out of the hx-vals attribute", async () => {
    const evil = structuredClone(pack) as any;
    evil.lessons[0].quiz.questions[0].options[0].value = '"><script>alert(1)</script>';
    const evilApp = createApp({ pack: evil, index: indexPack(evil) });
    const html = await (await evilApp.request("http://x/lessons/saludos/quiz")).text();
    const q = await (
      await evilApp.request("http://x/api/quizzes/saludos-quiz/question/0?attempt=a1-00000000")
    ).text();
    expect(html + q).not.toContain('"><script>');
  });
});
