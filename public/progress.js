/**
 * Progress and chapter unlocking — pure logic, no DOM.
 *
 * Progress lives in localStorage, so the server cannot know whether a chapter
 * has been unlocked. That makes this the one piece of course logic that runs in
 * the browser. It is a separate module with no DOM access precisely so it can be
 * unit tested (tests/progress.test.ts imports it directly).
 *
 * Plain JavaScript with JSDoc types, not TypeScript: this file is served
 * straight to the browser, which can't parse type syntax.
 *
 * A chapter is selectable when both hold:
 *   1. the content has released it (status is not "locked"), and
 *   2. the chapter before it is complete: every lesson passed, and the
 *      chapter's average score is above the threshold.
 */

/**
 * @typedef {{ passed?: boolean, ratio?: number }} LessonProgress
 * @typedef {Record<string, LessonProgress>} Progress
 * @typedef {{ id: string, order: number, status?: "published" | "locked", lessonIds: string[] }} ChapterShape
 * @typedef {"content" | "previous-incomplete" | null} LockReason
 * @typedef {{
 *   id: string, order: number, open: boolean, released: boolean,
 *   lockedBecause: LockReason, done: number, total: number, ratio: number,
 *   complete: boolean, current: boolean
 * }} ChapterState
 */

export const DEFAULT_THRESHOLD = 0.8;

/** Mean of the best ratio per lesson. Lessons never attempted count as 0. */
export function chapterRatio(chapter, progress) {
  const ids = chapter.lessonIds ?? [];
  if (!ids.length) return 0;
  const total = ids.reduce((sum, id) => sum + (progress[id]?.ratio ?? 0), 0);
  return total / ids.length;
}

export function isChapterComplete(chapter, progress, threshold = DEFAULT_THRESHOLD) {
  const ids = chapter.lessonIds ?? [];
  // An empty chapter can't be completed. Without this, a chapter shell with no
  // lessons yet would vacuously "pass" and cascade-unlock everything after it.
  if (!ids.length) return false;
  const allPassed = ids.every((id) => progress[id]?.passed === true);
  return allPassed && chapterRatio(chapter, progress) > threshold;
}

/**
 * Resolve every chapter's state in course order.
 *
 * A chapter's own progress can be above the threshold while still being locked,
 * because the previous chapter gates it — the two conditions are separate.
 */
export function resolveChapters(chapters, progress, threshold = DEFAULT_THRESHOLD) {
  const ordered = [...chapters].sort((a, b) => a.order - b.order);
  const states = [];

  ordered.forEach((chapter, i) => {
    const released = (chapter.status ?? "published") === "published";
    const previous = i > 0 ? ordered[i - 1] : undefined;

    let lockedBecause = null;
    if (!released) lockedBecause = "content";
    else if (previous && !isChapterComplete(previous, progress, threshold)) {
      lockedBecause = "previous-incomplete";
    }

    const ids = chapter.lessonIds ?? [];
    const done = ids.filter((id) => progress[id]?.passed === true).length;

    states.push({
      id: chapter.id,
      order: chapter.order,
      open: lockedBecause === null,
      released,
      lockedBecause,
      done,
      total: ids.length,
      ratio: chapterRatio(chapter, progress),
      complete: isChapterComplete(chapter, progress, threshold),
      current: false,
    });
  });

  // The current chapter is the first open one that isn't finished yet, or the
  // last open one if everything is done.
  const open = states.filter((s) => s.open);
  const target = open.find((s) => !s.complete) ?? open[open.length - 1];
  if (target) target.current = true;

  return states;
}

/** Overall course progress across every lesson in every chapter. */
export function courseSummary(chapters, progress, threshold = DEFAULT_THRESHOLD) {
  const states = resolveChapters(chapters, progress, threshold);
  const total = chapters.reduce((n, c) => n + (c.lessonIds?.length ?? 0), 0);
  const done = states.reduce((n, s) => n + s.done, 0);
  const openChapters = states.filter((s) => s.open).length;
  const current = states.find((s) => s.current) ?? null;

  return {
    total,
    done,
    ratio: total ? done / total : 0,
    openChapters,
    chapterCount: chapters.length,
    current,
    /** The next chapter to work on, for a "continue" link. */
    continueId: current?.id ?? null,
  };
}

/** Per-language progress, for the landing page cards. */
export function languageProgress(code, progressByLanguage, chapters, threshold = DEFAULT_THRESHOLD) {
  const progress = progressByLanguage?.[code] ?? {};
  const summary = courseSummary(chapters, progress, threshold);
  return {
    ...summary,
    started: summary.done > 0,
    finished: summary.total > 0 && summary.done === summary.total,
    chapters: resolveChapters(chapters, progress, threshold),
  };
}
