import { describe, expect, test } from "bun:test";
import { createApp } from "../src/server/app.ts";
import { loadLanguages } from "../src/server/languages.ts";

const catalog = await loadLanguages("content");
const app = createApp({ catalog });
const css = await Bun.file("public/styles.css").text();

/**
 * Contrast is the one thing about appearance that can be checked without
 * looking at the page.
 *
 * The rest of this file's sibling checks that light mode overrides every dark
 * variable, which catches a *missing* override. It cannot catch an override that
 * is present and unreadable -- muted grey on a light card, say, at 3:1. That is
 * the class of bug you find by eye, and nobody had eyes on it.
 *
 * So: every pair below is a foreground and background that actually occur
 * together in the stylesheet, with the selector that proves it. The "every text
 * colour is covered" test at the bottom is what keeps the table honest -- add a
 * colour to the CSS and this file fails until someone says where it sits.
 */

/** Variable names declared inside a given at-rule block. */
function block(selector: string): string {
  const start = css.indexOf(selector);
  expect(start).toBeGreaterThan(-1);
  const open = css.indexOf("{", start);
  return css.slice(open, css.indexOf("\n}", open));
}

function parseVars(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[m[1]!] = m[2]!.trim();
  return out;
}

const themes = {
  dark: parseVars(block(":root {")),
  light: parseVars(block(':root[data-theme="light"] {')),
};

/** Hex or rgb(), as three 0-255 channels. Alpha is ignored: every colour used
 *  behind text in this stylesheet is either opaque or a tint of a background. */
function channels(value: string): [number, number, number] | null {
  const v = value.trim();
  const hex6 = /^#([0-9a-f]{6})$/i.exec(v);
  if (hex6) {
    const n = parseInt(hex6[1]!, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const hex3 = /^#([0-9a-f]{3})$/i.exec(v);
  if (hex3) {
    const h = hex3[1]!;
    return [0, 1, 2].map((i) => parseInt(h[i]! + h[i]!, 16)) as [number, number, number];
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(v);
  if (rgb) {
    const parts = rgb[1]!.split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      return [parts[0]!, parts[1]!, parts[2]!];
    }
  }
  return null;
}

/** WCAG relative luminance. */
function luminance([r, g, b]: [number, number, number]): number {
  const lin = [r, g, b].map((raw) => {
    const c = raw / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

function contrast(fg: string, bg: string): number {
  const a = luminance(channels(fg)!);
  const b = luminance(channels(bg)!);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * WCAG AA is 4.5:1 for body text and 3:1 for large text (18.66px bold or 24px).
 * Everything here is small body text except the accent, which is used for
 * headings and chips at 14px+ bold, and still clears 4.5 -- so one threshold.
 */
const AA = 4.5;

/**
 * Each pair names the selector that makes it real, so a future reader can check
 * the claim instead of trusting it.
 */
const PAIRS: Array<[fg: string, bg: string, where: string]> = [
  ["--text", "--bg", "body text on the page background"],
  ["--text", "--bg-soft", ".option and .ctable, which sit on bg-soft"],
  ["--text", "--card", "text inside every card"],
  ["--text", "--card-hi", ".q__chip, .gloss-pop, .comparison__head inherit text"],
  ["--muted", "--bg", "secondary text on the page"],
  ["--muted", "--bg-soft", "the lesson__meta inside .option"],
  ["--muted", "--card", "lesson__sub, chapter blurb, progress labels"],
  ["--muted", "--card-hi", ".lesson__gen and .chapter__level chips"],
  ["--ok", "--card", ".lesson__score.is-pass and .chapter-card__score.is-pass"],
  ["--ok", "--bg", ".chapter-card.is-done .chapter-card__num"],
  ["--no", "--card", ".fb--no .fb__verdict and .landing__problems h2"],
  ["--accent", "--bg", "headings and the current-chapter ring"],
  ["--accent", "--card", "the accent inside a card"],
  ["--accent-2", "--bg", "links and hover borders"],
  ["--accent-2", "--card", "hover borders on cards"],
  ["--on-accent", "--accent", ".btn--primary label on the accent fill"],
];

describe("contrast", () => {
  for (const [theme, vars] of Object.entries(themes)) {
    test(`${theme}: every foreground/background pair clears WCAG AA`, () => {
      const failures: string[] = [];
      for (const [fg, bg, where] of PAIRS) {
        const f = channels(vars[fg] ?? "");
        const b = channels(vars[bg] ?? "");
        if (!f || !b) {
          failures.push(`${fg} on ${bg}: could not parse ${vars[fg]} / ${vars[bg]}`);
          continue;
        }
        const ratio = contrast(vars[fg]!, vars[bg]!);
        if (ratio < AA) {
          failures.push(
            `${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${AA} — ${where}`,
          );
        }
      }
      expect(failures).toEqual([]);
    });
  }

  test("every colour used as text is covered by a pair above", () => {
    // Guards the table from going stale. A new `color: var(--x)` has to be
    // added here with the selector that justifies where it sits, because
    // "where does this colour appear" is the question that has no static answer.
    const allowedAsForeground = new Set(PAIRS.map(([fg]) => fg));
    const inCss = [...css.matchAll(/(?:^|[;{\s])color:\s*var\((--[\w-]+)\)/g)].map((m) => m[1]!);
    const uncovered = [...new Set(inCss)].filter((name) => !allowedAsForeground.has(name));
    expect(uncovered).toEqual([]);
  });

  test("the accent fill and its label are not the same colour", () => {
    // A specific past hazard: --on-accent is only ever text on --accent, so it
    // is absent from the pairs above as a foreground on any other background.
    for (const [theme, vars] of Object.entries(themes)) {
      expect(vars["--on-accent"], theme).toBeDefined();
      expect(contrast(vars["--on-accent"]!, vars["--accent"]!), theme).toBeGreaterThanOrEqual(AA);
    }
  });
});

describe("layout affordances that a stylesheet can prove", () => {
  /** Class names the views emit, checked against the rules that style them. */
  const definedClasses = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]!));

  const pages = [
    "/",
    "/course/es",
    "/course/es/verbs",
    "/course/es/chapters/chapter-1",
    "/course/es/chapters/chapter-7",
    "/course/es/lessons/saludos",
    "/course/es/lessons/ch5-ser",
    "/course/es/lessons/ch6-lectura-mercado",
    "/course/es/lessons/saludos/quiz",
    // The 404 body, so page--error is exercised rather than assumed.
    "/course/fr",
  ];

  /**
   * Classes the views emit that deliberately have no rule of their own, and why.
   *
   * Asserted as exact set equality in both directions: a new unstyled class
   * fails until someone explains it, and an entry that gains a rule later also
   * fails, because the explanation has gone stale. That is the whole point --
   * a renamed class on one side only is invisible until you look at the page.
   */
  const UNSTYLED_BY_DESIGN: Record<string, string> = {
    "page--landing": "body-level layout hook; sized by .page, no modifier rules yet",
    "page--course": "as above",
    "page--lesson": "as above",
    "page--error": "as above",
    "nav__flag": "the flag emoji, styled by .nav__brand",
    "theme-toggle__label": "script target; the toggle itself is styled",
    "cards--words": "no-op: wordCards takes a kind, and numbers and colours need overrides where words do not",
    lang: "grid item inside .langs, which resets list-style; the card is .lang__link",
    "ctable__persona": "styled through .ctable th",
    "comparison__cell--verb": "styled through .comparison__head .comparison__cell and .comparison__verb",
  };

  test("every unstyled class is explained, and no explanation is stale", async () => {
    const seen = new Set<string>();
    for (const path of pages) {
      const html = await (await app.request(`http://localhost${path}`)).text();
      for (const m of html.matchAll(/class="([^"]+)"/g)) {
        for (const c of m[1]!.split(/\s+/)) {
          if (c && !definedClasses.has(c)) seen.add(c);
        }
      }
    }
    expect([...seen].sort()).toEqual(Object.keys(UNSTYLED_BY_DESIGN).sort());
  });

  test("planned lesson rows cannot be mistaken for links", () => {
    // The outline rows are spans, so the hover lift and the pointer cursor that
    // .lesson__link brings would be a lie. Both are undone for them.
    const rule = /\.lesson--planned \.lesson__link \{[^}]*\}/.exec(css)?.[0] ?? "";
    expect(rule).toContain("cursor: default");
    expect(rule).toContain("dashed");
    const hover = /\.lesson--planned \.lesson__link:hover \{[^}]*\}/.exec(css)?.[0] ?? "";
    expect(hover).toContain("transform: none");
  });

  test("a locked preview card still looks locked", () => {
    // The plan link is real and clickable, so the locked treatment has to stay
    // on the card or it reads as playable.
    expect(css).toMatch(/\.chapter-card\.is-locked \.chapter-card__link:hover \{/);
    expect(css).toMatch(/\.chapter-card\.is-locked \{/);
  });
});
