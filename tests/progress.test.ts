import { describe, expect, test } from "bun:test";
// Plain JS with JSDoc types: the browser loads this file directly, so it can't
// contain TypeScript syntax. Types come from the sibling progress.d.ts.
import {
  chapterLockMessage,
  chapterRatio,
  courseSummary,
  isChapterComplete,
  resolveChapters,
} from "../public/progress.js";
import type { ChapterShape, Progress } from "../public/progress.js";

/**
 * The unlock rule: a chapter opens when the content released it AND the chapter
 * before it is complete — every lesson passed, average above 80%.
 */

const chapter = (
  order: number,
  lessonIds: string[],
  status?: "published" | "locked",
): ChapterShape => ({ id: `c${order}`, order, status, lessonIds });

/** Every listed lesson passed at the given ratio. */
const done = (ids: string[], ratio = 1): Progress =>
  Object.fromEntries(ids.map((id) => [id, { passed: true, ratio }]));

describe("chapterRatio", () => {
  test("is the mean of best ratios, counting untouched lessons as zero", () => {
    const c = chapter(1, ["a", "b", "c", "d"]);
    expect(chapterRatio(c, { a: { ratio: 1 }, b: { ratio: 0.5 } })).toBeCloseTo(0.375);
  });

  test("an empty chapter scores zero rather than NaN", () => {
    expect(chapterRatio(chapter(1, []), {})).toBe(0);
  });
});

describe("isChapterComplete", () => {
  test("needs every lesson passed", () => {
    const c = chapter(1, ["a", "b"]);
    expect(isChapterComplete(c, { a: { passed: true, ratio: 1 } })).toBe(false);
    expect(
      isChapterComplete(c, { a: { passed: true, ratio: 1 }, b: { passed: false, ratio: 1 } }),
    ).toBe(false);
  });

  test("needs the average strictly above the threshold", () => {
    const c = chapter(1, ["a", "b", "c", "d"]);
    // (1 + 1 + 0.6 + 0.6) / 4 = exactly 0.8 — not above it.
    const exactly80: Progress = {
      a: { passed: true, ratio: 1 },
      b: { passed: true, ratio: 1 },
      c: { passed: true, ratio: 0.6 },
      d: { passed: true, ratio: 0.6 },
    };
    expect(chapterRatio(c, exactly80)).toBeCloseTo(0.8);
    expect(isChapterComplete(c, exactly80)).toBe(false);

    // 0.9 — clears the bar.
    const justOver: Progress = {
      a: { passed: true, ratio: 1 },
      b: { passed: true, ratio: 1 },
      c: { passed: true, ratio: 0.9 },
      d: { passed: true, ratio: 0.7 },
    };
    expect(isChapterComplete(c, justOver)).toBe(true);
  });

  test("an empty chapter is never complete", () => {
    // Otherwise a chapter shell with no lessons would vacuously pass and
    // cascade-unlock everything after it.
    expect(isChapterComplete(chapter(1, []), {})).toBe(false);
  });
});

describe("resolveChapters", () => {
  const chapters = [
    chapter(1, ["a", "b"]),
    chapter(2, ["c", "d"]),
    chapter(3, ["e"], "locked"),
  ];

  test("chapter 1 is always open", () => {
    const [first] = resolveChapters(chapters, {});
    expect(first!.open).toBe(true);
    expect(first!.lockedBecause).toBe(null);
  });

  test("chapter 2 stays shut until chapter 1 is complete", () => {
    const partial = resolveChapters(chapters, { a: { passed: true, ratio: 1 } });
    expect(partial[1]!.open).toBe(false);
    expect(partial[1]!.lockedBecause).toBe("previous-incomplete");

    const full = resolveChapters(chapters, done(["a", "b"]));
    expect(full[1]!.open).toBe(true);
  });

  test("content lock beats everything", () => {
    // Chapter 3 is locked by content even with all of 1 and 2 complete.
    const states = resolveChapters(chapters, { ...done(["a", "b"]), ...done(["c", "d"]) });
    expect(states[2]!.open).toBe(false);
    expect(states[2]!.lockedBecause).toBe("content");
    expect(states[2]!.released).toBe(false);
  });

  test("a chapter with high progress is still gated on the previous chapter", () => {
    // The two conditions are separate: passing chapter 2's lessons while
    // chapter 1 is incomplete does not open chapter 2.
    const states = resolveChapters(chapters, {
      a: { passed: true, ratio: 1 },
      ...done(["c", "d"]),
    });
    expect(states[1]!.open).toBe(false);
    expect(states[1]!.ratio).toBe(1);
  });

  test("current is the first open chapter that isn't finished", () => {
    expect(resolveChapters(chapters, {})[0]!.current).toBe(true);

    const mid = resolveChapters(chapters, done(["a", "b"]));
    expect(mid[0]!.current).toBe(false);
    expect(mid[1]!.current).toBe(true);

    const finished = resolveChapters(chapters, { ...done(["a", "b"]), ...done(["c", "d"]) });
    // Chapters 1 and 2 are finished; chapter 3 is locked, so the last open one wins.
    expect(finished[1]!.current).toBe(true);
    expect(finished[2]!.current).toBe(false);
  });

  test("reports per-chapter progress", () => {
    const states = resolveChapters(chapters, { a: { passed: true, ratio: 0.9 } });
    expect(states[0]!.done).toBe(1);
    expect(states[0]!.total).toBe(2);
    expect(states[0]!.complete).toBe(false);
  });

  test("respects a custom threshold", () => {
    const c = [chapter(1, ["a", "b"]), chapter(2, ["c"])];
    const half = done(["a", "b"], 0.7);
    expect(resolveChapters(c, half)[1]!.open).toBe(false);
    expect(resolveChapters(c, half, 0.5)[1]!.open).toBe(true);
  });
});

describe("courseSummary", () => {
  const chapters = [chapter(1, ["a", "b"]), chapter(2, ["c"]), chapter(3, [], "locked")];

  test("counts only published lessons in the total", () => {
    // The locked shell has no lessons and cannot be worked on, so it must not
    // dilute the percentage.
    const summary = courseSummary(chapters, {});
    expect(summary.total).toBe(3);
    expect(summary.done).toBe(0);
    expect(summary.chapterCount).toBe(3);
    expect(summary.openChapters).toBe(1);
  });

  test("points at the chapter to work on next", () => {
    expect(courseSummary(chapters, {}).continueId).toBe("c1");
    expect(courseSummary(chapters, done(["a", "b"])).continueId).toBe("c2");
  });

  test("with no chapters at all it does not divide by zero", () => {
    const summary = courseSummary([], {});
    expect(summary.ratio).toBe(0);
    expect(summary.continueId).toBe(null);
  });
});

describe("gatedBy", () => {
  // The card message is built from this, and it used to be `order - 1`. That
  // printed "finish chapter 0 to unlock" on the open first chapter, because
  // nothing checked whether the chapter was actually locked, and the first
  // chapter has no predecessor for `order - 1` to name.
  test("an open chapter is gated by nothing, so no chapter number can leak", () => {
    const states = resolveChapters([chapter(1, ["a"]), chapter(2, ["b"])], {});
    expect(states[0]!.open).toBe(true);
    expect(states[0]!.gatedBy).toBe(null);
    expect(states[1]!.gatedBy).toEqual({ id: "c1", order: 1 });
  });

  test("a content-locked chapter names no chapter to finish", () => {
    const states = resolveChapters([chapter(1, ["a"]), chapter(2, [], "locked")], {});
    expect(states[1]!.lockedBecause).toBe("content");
    expect(states[1]!.gatedBy).toBe(null);
  });

  test("it names the real predecessor when orders are not consecutive", () => {
    // Orders are display numbers, not array indices. Chapter 10 gated by
    // chapter 3 must say 3, not 9.
    const chapters = [chapter(3, ["a"]), chapter(10, ["b"]), chapter(20, ["c"])];
    const states = resolveChapters(chapters, {});
    expect(states[1]!.gatedBy).toEqual({ id: "c3", order: 3 });
    expect(states[2]!.gatedBy).toEqual({ id: "c10", order: 10 });
  });

  test("every chapter that is open has a null gatedBy, always", () => {
    const chapters = [chapter(1, ["a"]), chapter(2, ["b"]), chapter(3, ["c"])];
    for (const progress of [{}, done(["a"]), done(["a", "b"]), done(["a", "b", "c"])]) {
      for (const state of resolveChapters(chapters, progress)) {
        if (state.open) expect(state.gatedBy).toBe(null);
        else expect(state.gatedBy).not.toBe(null);
      }
    }
  });
});

describe("chapterLockMessage", () => {
  test("an open chapter says nothing at all", () => {
    // The reported bug: the first chapter is always open and always
    // accessible, yet its card read "finish chapter 0 to unlock".
    const [first] = resolveChapters([chapter(1, ["a"]), chapter(2, ["b"])], {});
    expect(first!.open).toBe(true);
    expect(chapterLockMessage(first!)).toBe("");
    expect(chapterLockMessage(first!)).not.toContain("chapter 0");
  });

  test("no chapter anywhere in the course can produce 'chapter 0'", () => {
    const chapters = [chapter(1, ["a"]), chapter(2, ["b"]), chapter(3, ["c"])];
    for (const progress of [{}, done(["a"]), done(["a", "b"]), done(["a", "b", "c"])]) {
      for (const state of resolveChapters(chapters, progress)) {
        expect(chapterLockMessage(state)).not.toContain("chapter 0");
      }
    }
  });

  test("a chapter gated on the previous one names it", () => {
    const states = resolveChapters([chapter(1, ["a"]), chapter(2, ["b"])], {});
    expect(chapterLockMessage(states[1]!)).toBe("finish chapter 1 to unlock");
  });

  test("a content-locked chapter says so instead", () => {
    const states = resolveChapters([chapter(1, ["a"]), chapter(2, [], "locked")], {});
    expect(chapterLockMessage(states[1]!)).toBe("not released yet");
  });

  test("names the real predecessor when orders are not consecutive", () => {
    const states = resolveChapters([chapter(3, ["a"]), chapter(10, ["b"])], {});
    expect(chapterLockMessage(states[1]!)).toBe("finish chapter 3 to unlock");
  });

  test("a locked chapter with no identified gate still explains itself", () => {
    const state = {
      id: "x",
      order: 4,
      open: false,
      released: true,
      lockedBecause: "previous-incomplete",
      done: 0,
      total: 1,
      ratio: 0,
      complete: false,
      current: false,
      gatedBy: null,
    } as const;
    expect(chapterLockMessage(state)).toBe("locked");
  });
});
