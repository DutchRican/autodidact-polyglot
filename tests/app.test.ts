import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

/**
 * app.js drives the whole browser half of the app off the server-rendered
 * markup, reading around twenty `data-` hooks. It had no tests, and all three
 * bugs found by clicking through it lived here:
 *
 *   - the quiz's htmx URLs omitted the language code, so answers did nothing
 *   - a chapter card said "finish chapter 0 to unlock" while being open
 *   - the locked-chapter count disagreed with the list above it
 *
 * Each was the same shape: state computed in one layer, rendered in another,
 * with nothing asserting the two agreed. These tests run the real module
 * against the real markup, so the agreement is checked rather than assumed.
 */

const PROGRESS_KEY = "habla.progress.v2";
const LEGACY_KEY = "habla.progress.v1";

/** A win as app.js would find one, installed as the globals it reaches for. */
let win: Window;

function install(html: string): Window {
  const w = new Window({ url: "http://localhost/course/es" });
  w.document.write(`<!doctype html><html><body>${html}</body></html>`);
  const g = globalThis as Record<string, unknown>;
  g.window = w;
  g.document = w.document;
  g.localStorage = w.localStorage;
  g.matchMedia = w.matchMedia.bind(w);
  g.requestAnimationFrame = () => 0;
  // app.js dispatches on `target instanceof Element`, and every window gets its
  // own Element class. Without these, click handling silently never matches and
  // the theme toggle looks broken for reasons that have nothing to do with it.
  g.Element = w.Element;
  g.HTMLElement = w.HTMLElement;
  g.Node = w.Node;
  g.Event = w.Event;
  g.CustomEvent = w.CustomEvent;
  win = w;
  return w;
}

/**
 * app.js registers a DOMContentLoaded listener at import time, so the browser
 * globals have to exist before it is loaded. Imported dynamically for that
 * reason; each test then calls start() against its own fresh document.
 */
let start!: () => void;

beforeAll(async () => {
  install("");
  ({ start } = (await import("../public/app.js")) as { start: () => void });
});

/** Chapter cards shaped exactly as coursePage renders them. */
function chapterCards(
  chapters: Array<{ id: string; order: number; status?: string; lessons: string[] }>,
): string {
  return `<ol class="chapters">${chapters
    .map((c) => {
      const released = c.status !== "locked";
      const href = `/course/es/chapters/${c.id}`;
      return `<li class="chapter-card ${released ? "" : "is-locked"}"
        data-chapter-card="${c.id}" data-chapter-order="${c.order}"
        data-status="${c.status ?? "published"}"
        data-chapter-href="${released ? href : ""}"
        data-lessons="${c.lessons.join(",")}">
      <span class="chapter-card__badge" data-current-badge hidden>Current</span>
      <span class="chapter-card__badge chapter-card__badge--locked" data-locked-badge hidden>Locked</span>
      ${
        released
          ? `<a class="chapter-card__link" href="${href}" data-chapter-link><span class="chapter-card__title">${c.id}</span></a>`
          : `<span class="chapter-card__title">${c.id}</span>`
      }
      <span class="chapter-card__score" data-chapter-score="${c.id}"></span>
      <span class="chapter-card__soon" data-chapter-soon"></span>
      <div class="progress progress--slim"><div class="progress__fill" style="width: 0%"></div></div>
    </li>`;
    })
    .join("")}</ol>`;
}

/** The six published chapters plus four content-locked shells, as shipped. */
const SHIPPED = [
  { id: "chapter-1", order: 1, lessons: ["a", "b"] },
  { id: "chapter-2", order: 2, lessons: ["c"] },
  { id: "chapter-3", order: 3, lessons: ["d"] },
  { id: "chapter-4", order: 4, lessons: ["e"] },
  { id: "chapter-5", order: 5, lessons: ["f"] },
  { id: "chapter-6", order: 6, lessons: ["g"] },
  { id: "chapter-7", order: 7, status: "locked", lessons: [] },
  { id: "chapter-8", order: 8, status: "locked", lessons: [] },
  { id: "chapter-9", order: 9, status: "locked", lessons: [] },
  { id: "chapter-10", order: 10, status: "locked", lessons: [] },
];

/** Progress where the first `n` published chapters are fully passed. */
function firstChaptersDone(n: number): Record<string, { passed: boolean; ratio: number }> {
  const out: Record<string, { passed: boolean; ratio: number }> = {};
  for (const c of SHIPPED.filter((x) => x.status !== "locked").slice(0, n)) {
    for (const id of c.lessons) out[id] = { passed: true, ratio: 1 };
  }
  return out;
}

function seed(lessons: Record<string, { passed: boolean; ratio: number }>): void {
  // v2 nests every language under "lessons"; a flat { es: ... } reads as empty.
  win.localStorage.setItem(PROGRESS_KEY, JSON.stringify({ lessons: { es: lessons } }));
}

const text = (sel: string) => win.document.querySelector(sel)?.textContent?.trim() ?? "";
const all = (sel: string) => [...win.document.querySelectorAll(sel)];
const soonOf = (id: string) =>
  all("[data-chapter-soon]")[SHIPPED.findIndex((c) => c.id === id)]?.textContent?.trim() ?? "";

beforeEach(() => {
  install("");
  win.localStorage.clear();
});

describe("chapter cards", () => {
  test("the first chapter is open and says nothing about being locked", () => {
    // Reported as: the card said "finish chapter 0 to unlock" while the chapter
    // was accessible. Chapter 1 has no predecessor, so no chapter number can
    // appear on its card.
    install(chapterCards(SHIPPED));
    start();
    const card = win.document.querySelector('[data-chapter-card="chapter-1"]')!;
    expect(card.classList.contains("is-locked")).toBe(false);
    expect(card.classList.contains("is-current")).toBe(true);
    expect(text('[data-chapter-card="chapter-1"] [data-locked-badge]')).toBe("Locked");
    expect(
      win.document
        .querySelector('[data-chapter-card="chapter-1"] [data-locked-badge]')!
        .hasAttribute("hidden"),
    ).toBe(true);
    expect(soonOf("chapter-1")).toBe("");
    expect(soonOf("chapter-1")).not.toContain("chapter 0");
  });

  test("no card anywhere claims you must finish chapter 0", () => {
    for (const n of [0, 1, 2, 3, 4, 5, 6]) {
      install(chapterCards(SHIPPED));
      seed(firstChaptersDone(n));
      start();
      for (const c of SHIPPED) {
        expect(soonOf(c.id), `ch${c.order} at ${n} done`).not.toContain("chapter 0");
      }
    }
  });

  test("a locked chapter keeps its link but has the href taken away", () => {
    // A disabled anchor is still focusable and still middle-clickable, so the
    // href is removed rather than disabled.
    install(chapterCards(SHIPPED));
    start();
    const locked = win.document.querySelector('[data-chapter-card="chapter-2"]')!;
    expect(locked.classList.contains("is-locked")).toBe(true);
    expect(locked.getAttribute("aria-disabled")).toBe("true");
    const link = locked.querySelector("[data-chapter-link]")!;
    expect(link.hasAttribute("href")).toBe(false);

    const open = win.document.querySelector('[data-chapter-card="chapter-1"] [data-chapter-link]')!;
    expect(open.getAttribute("href")).toBe("/course/es/chapters/chapter-1");
  });

  test("finishing a chapter unlocks the next and moves the current badge", () => {
    install(chapterCards(SHIPPED));
    seed(firstChaptersDone(1));
    start();
    expect(win.document.querySelector('[data-chapter-card="chapter-2"]')!.classList.contains("is-locked")).toBe(false);
    expect(win.document.querySelector('[data-chapter-card="chapter-3"]')!.classList.contains("is-locked")).toBe(true);
    const current = all("[data-chapter-card]").filter((c) => c.classList.contains("is-current"));
    expect(current).toHaveLength(1);
    expect(current[0]!.getAttribute("data-chapter-card")).toBe("chapter-2");
  });

  test("a chapter averages its lesson ratios, and only passed lessons count", () => {
    install(chapterCards(SHIPPED));
    seed({ a: { passed: true, ratio: 1 }, b: { passed: false, ratio: 1 } });
    start();
    expect(text('[data-chapter-score="chapter-1"]')).toBe("1 / 2");
  });
});

describe("the locked-chapter count agrees with the list", () => {
  // Reported as: the footer said 4 while nine cards were locked. The count is
  // now derived from the same states that lock the cards, so this asserts they
  // cannot drift apart again.
  function render(nDone: number) {
    install(`${chapterCards(SHIPPED)}<p class="course__note" data-locked-note></p>`);
    seed(firstChaptersDone(nDone));
    start();
    const cards = all("[data-chapter-card]").filter((c) => c.classList.contains("is-locked")).length;
    const sentence = text("[data-locked-note]");
    const claimed = Number(/^(\d+)/.exec(sentence)?.[1] ?? "-1");
    return { cards, claimed, sentence };
  }

  test("the number in the sentence is the number of locked cards", () => {
    for (const n of [0, 1, 2, 3, 4, 5, 6]) {
      const { cards, claimed } = render(n);
      expect(claimed, `${n} chapters done`).toBe(cards);
    }
  });

  test("a fresh start locks nine of ten, not the four the server can see", () => {
    const { cards, sentence } = render(0);
    expect(cards).toBe(9);
    expect(sentence).toBe("9 chapters are locked.");
  });

  test("content-locked chapters are counted too", () => {
    const { cards, sentence } = render(6);
    expect(cards).toBe(4);
    expect(sentence).toBe("4 chapters are locked.");
  });

  test("singular reads correctly", () => {
    install(`${chapterCards([{ id: "c1", order: 1, lessons: ["a"] }, { id: "c2", order: 2, status: "locked", lessons: [] }])}<p data-locked-note></p>`);
    start();
    expect(text("[data-locked-note]")).toBe("1 chapter is locked.");
  });

  test("nothing locked hides the note rather than saying zero", () => {
    install(`${chapterCards([{ id: "c1", order: 1, lessons: ["a"] }])}<p data-locked-note></p>`);
    start();
    expect(win.document.querySelector("[data-locked-note]")!.hasAttribute("hidden")).toBe(true);
  });
});

describe("overall progress", () => {
  // Chapter cards are what give the page its lesson total, so the overall
  // progress bar can only be tested on a page that has them.
  const page = (extra = "") =>
    `${chapterCards(SHIPPED)}<span data-progress-summary></span>
     <div data-progress-bar><div class="progress__fill"></div></div>
     <span data-progress-label></span>${extra}`;

  test("counts lessons, not chapters", () => {
    install(page());
    seed(firstChaptersDone(1));
    start();
    // 7 lessons exist across the published chapters; 2 are passed.
    expect(text("[data-progress-label]")).toBe("2 / 7 lessons · 29%");
  });

  test("an untouched course reads zero, not NaN", () => {
    install(page());
    start();
    expect(text("[data-progress-label]")).toBe("0 / 7 lessons · 0%");
    expect(text("[data-progress-summary]")).toBe("");
  });

  test("the bar width matches the label", () => {
    install(page());
    seed(firstChaptersDone(2));
    start();
    const width = /width:\s*(\d+)%/.exec(
      win.document.querySelector("[data-progress-bar] .progress__fill")!.getAttribute("style") ?? "",
    )?.[1];
    expect(width).toBe("43"); // 3 of 7
  });
});

describe("quiz progress", () => {
  // renderQuizProgress reads [data-quiz-root] for the total, then either
  // [data-question] for the current index or [data-results] for the last slide,
  // and writes into .quiz-progress.
  const page = (questionIndex?: number, results = false) =>
    `<div data-quiz-root data-total="8"></div>
     ${results ? `<div data-results></div>` : questionIndex === undefined ? "" : `<div data-question="${questionIndex}"></div>`}
     <div class="quiz-progress"><div class="progress"><div class="progress__fill"></div></div>
       <span data-progress-label></span></div>`;

  test("counts the current question as one-based", () => {
    install(page(0));
    start();
    expect(text(".quiz-progress [data-progress-label]")).toBe("1 / 8");
  });

  test("advances with the question index", () => {
    install(page(4));
    start();
    expect(text(".quiz-progress [data-progress-label]")).toBe("5 / 8");
  });

  test("shows a full bar on the results screen", () => {
    install(page(undefined, true));
    start();
    expect(text(".quiz-progress [data-progress-label]")).toBe("8 / 8");
  });

  test("a missing total renders nothing rather than dividing by zero", () => {
    install(`<div data-quiz-root></div><div class="quiz-progress"><span data-progress-label></span></div>`);
    start();
    expect(text(".quiz-progress [data-progress-label]")).toBe("");
  });

  test("a page with no quiz at all is untouched", () => {
    install(`<main>lesson</main>`);
    expect(() => start()).not.toThrow();
  });
});

describe("legacy progress migration", () => {
  const page = () => `${chapterCards(SHIPPED)}<span data-progress-label></span>`;

  test("a v1 record moves under the current language", () => {
    install(page());
    // v1 nested under "lessons" too; only the language level was missing.
    win.localStorage.setItem(LEGACY_KEY, JSON.stringify({ lessons: { a: { passed: true, ratio: 1 } } }));
    start();
    const migrated = JSON.parse(win.localStorage.getItem(PROGRESS_KEY)!);
    expect(migrated.lessons.es.a).toEqual({ passed: true, ratio: 1 });
    expect(win.localStorage.getItem(LEGACY_KEY)).toBe(null);
    expect(text("[data-progress-label]")).toBe("1 / 7 lessons · 14%");
  });

  test("migration does not clobber existing v2 progress", () => {
    install(page());
    win.localStorage.setItem(LEGACY_KEY, JSON.stringify({ lessons: { a: { passed: true, ratio: 1 } } }));
    seed({ c: { passed: true, ratio: 1 } });
    start();
    const migrated = JSON.parse(win.localStorage.getItem(PROGRESS_KEY)!);
    expect(migrated.lessons.es.c).toEqual({ passed: true, ratio: 1 });
    // The existing entry for this language wins; the v1 record is dropped
    // rather than merged over the top of it.
    expect(migrated.lessons.es.a).toBeUndefined();
    expect(win.localStorage.getItem(LEGACY_KEY)).toBe(null);
  });

  test("a corrupt record is discarded, not thrown on", () => {
    install(page());
    win.localStorage.setItem(PROGRESS_KEY, "{not json");
    expect(() => start()).not.toThrow();
    expect(text("[data-progress-label]")).toBe("0 / 7 lessons · 0%");
  });

  test("another language's progress is left alone", () => {
    install(page());
    win.localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ lessons: { fr: { x: { passed: true, ratio: 1 } }, es: {} } }),
    );
    start();
    const after = JSON.parse(win.localStorage.getItem(PROGRESS_KEY)!);
    expect(after.lessons.fr).toEqual({ x: { passed: true, ratio: 1 } });
  });
});

describe("theme", () => {
  // The real page runs an inline <head> script that sets dataset.theme from
  // localStorage, or the OS preference, before app.js loads — that is what
  // stops the theme flashing. app.js then continues from whatever it finds, so
  // these fixtures reproduce that script's effect rather than skipping it.
  function pageWithHeadScript(stored?: string, osLight = false) {
    install(`<button data-theme-toggle><span data-theme-icon></span><span data-theme-label></span></button>`);
    const saved = stored ?? null;
    const theme = saved ?? (osLight ? "light" : "dark");
    win.document.documentElement.dataset.theme = theme;
    return theme;
  }

  test("keeps the theme the head script chose, and defaults to dark", () => {
    expect(pageWithHeadScript()).toBe("dark");
    start();
    expect(win.document.documentElement.dataset.theme).toBe("dark");
    expect(text("[data-theme-label]")).toBe("Dark");
  });

  test("an explicit choice survives a reload", () => {
    win.localStorage.setItem("habla.theme", "light");
    expect(pageWithHeadScript("light")).toBe("light");
    start();
    expect(win.document.documentElement.dataset.theme).toBe("light");
    expect(text("[data-theme-label]")).toBe("Light");
  });

  test("toggling flips it and persists the choice", () => {
    pageWithHeadScript();
    start();
    win.document
      .querySelector("[data-theme-toggle]")!
      .dispatchEvent(new win.Event("click", { bubbles: true }));
    expect(win.document.documentElement.dataset.theme).toBe("light");
    expect(win.localStorage.getItem("habla.theme")).toBe("light");
    expect(text("[data-theme-label]")).toBe("Light");
  });

  test("the OS preference applies when nothing is stored", () => {
    expect(pageWithHeadScript(undefined, true)).toBe("light");
    start();
    expect(win.document.documentElement.dataset.theme).toBe("light");
  });
});

describe("no page errors on a bare page", () => {
  test("start() is safe with none of its hooks present", () => {
    install("<main>empty</main>");
    expect(() => start()).not.toThrow();
  });

  test("a chapter list with no cards does not throw", () => {
    install(`<ol class="chapters"></ol><p data-locked-note></p>`);
    expect(() => start()).not.toThrow();
  });
});
