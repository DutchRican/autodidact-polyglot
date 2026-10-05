import { indexPack, loadPack, ContentError } from "../engine/content.ts";
import { lintPack } from "../engine/lint.ts";
import { isChapterPublished, type LanguagePack } from "../types.ts";

/**
 * Language discovery.
 *
 * A language is a file in content/*.json. Dropping a new file in is the whole
 * install procedure for a new language, so the landing page is built by
 * scanning the directory rather than from a hand-maintained list.
 *
 * A pack that fails validation is skipped rather than fatal: the landing page
 * still renders, and the error names the file to fix.
 */

export interface LanguageEntry {
  code: string;
  name: string;
  endonym: string;
  flag: string;
  blurb: string;
  lessonCount: number;
  chapterCount: number;
  /** Chapters that are selectable. */
  openChapters: number;
}

export interface LanguageCatalog {
  /** Valid packs, ordered by code for a stable landing page. */
  languages: LanguageEntry[];
  /** Problems worth showing the developer, not the learner. */
  errors: Array<{ file: string; message: string }>;
  /** Loaded packs, keyed by code. */
  packs: Map<string, LanguagePack>;
}

const SUMMARY = (pack: LanguagePack): LanguageEntry => {
  const index = indexPack(pack);
  return {
    code: pack.language.code,
    name: pack.language.name,
    endonym: pack.language.endonym,
    flag: pack.language.flag ?? "",
    blurb: pack.language.blurb ?? "",
    lessonCount: index.lessonCount(),
    chapterCount: index.chapters().length,
    openChapters: index.chapters().filter(isOpen).length,
  };
};

const isOpen = isChapterPublished;

/**
 * A pack that parses can still teach the wrong thing: a verb whose future is
 * really its preterite, a -car verb whose subjunctive drops its qu. Those failures
 * are silent -- the engine produces a well-formed table of forms that do not exist
 * in Spanish -- so they are treated as load failures, the same as a schema
 * violation.
 *
 * "review" findings are not fatal. The pack ships with verb words that are only
 * ever mentioned inside a phrase, and taking the course down over a judgement call
 * would be the wrong trade.
 */
export function assertPackLints(pack: LanguagePack): void {
  const errors = lintPack(pack).filter((f) => f.severity === "error");
  if (!errors.length) return;
  throw new ContentError(
    `content lint failed: ${errors
      .map((f) => `[${f.rule}] ${f.subject}: ${f.message}`)
      .join(" | ")}`,
  );
}

export async function loadLanguages(dir = "content"): Promise<LanguageCatalog> {
  const glob = new Bun.Glob("*.json");
  const languages: LanguageEntry[] = [];
  const errors: Array<{ file: string; message: string }> = [];
  const packs = new Map<string, LanguagePack>();

  for await (const file of glob.scan({ cwd: dir })) {
    const path = `${dir}/${file}`;
    try {
      const pack = await loadPack(path);
      // Two packs claiming the same code would make /course/:code ambiguous.
      if (packs.has(pack.language.code)) {
        throw new ContentError(
          `duplicate language code "${pack.language.code}" (also defined elsewhere in ${dir})`,
        );
      }
      packs.set(pack.language.code, pack);
      assertPackLints(pack);
      languages.push(SUMMARY(pack));
    } catch (err) {
      errors.push({ file, message: err instanceof Error ? err.message : String(err) });
    }
  }

  languages.sort((a, b) => a.code.localeCompare(b.code));
  return { languages, errors, packs };
}
