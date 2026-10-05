// Types for public/progress.js, which is plain JS with JSDoc so the browser can
// load it directly. This lets the TypeScript test file import it with types.
export type LessonProgress = { passed?: boolean; ratio?: number };
export type Progress = Record<string, LessonProgress>;

export type ChapterShape = {
  id: string;
  order: number;
  status?: "published" | "locked";
  lessonIds: string[];
};

export type LockReason = "content" | "previous-incomplete" | null;

export type ChapterRef = { id: string; order: number } | null;

export type ChapterState = {
  id: string;
  order: number;
  open: boolean;
  released: boolean;
  lockedBecause: LockReason;
  done: number;
  total: number;
  ratio: number;
  complete: boolean;
  current: boolean;
  /** The chapter holding this one shut, when locked on progress. */
  gatedBy: ChapterRef;
};

export type CourseSummary = {
  total: number;
  done: number;
  ratio: number;
  openChapters: number;
  chapterCount: number;
  current: ChapterState | null;
  continueId: string | null;
};

export const DEFAULT_THRESHOLD: number;

/** Empty string when the chapter is open; otherwise why it cannot be entered. */
export function chapterLockMessage(state: ChapterState): string;

/** Chapters the learner cannot enter, counting content and progress locks. */
export function lockedChapterCount(states: ChapterState[]): number;

export function chapterRatio(chapter: ChapterShape, progress: Progress): number;export function isChapterComplete(
  chapter: ChapterShape,
  progress: Progress,
  threshold?: number,
): boolean;
export function resolveChapters(
  chapters: ChapterShape[],
  progress: Progress,
  threshold?: number,
): ChapterState[];
export function courseSummary(
  chapters: ChapterShape[],
  progress: Progress,
  threshold?: number,
): CourseSummary;
export function languageProgress(
  code: string,
  progressByLanguage: Record<string, Progress>,
  chapters: ChapterShape[],
  threshold?: number,
): CourseSummary & { started: boolean; finished: boolean; chapters: ChapterState[] };
