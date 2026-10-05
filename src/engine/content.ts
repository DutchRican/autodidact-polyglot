import type { Chapter, LanguagePack, Lesson, Story, VerbEntry, WordEntry } from "../types.ts";
import { generateLesson, hasGenerator } from "./generate.ts";
import type { QuizContext } from "./quiz.ts";

/**
 * Loads a language pack from JSON and validates its internal references.
 *
 * Validation is strict on purpose: broken content should fail loudly at boot,
 * never surface as a blank table three lessons in.
 */

export class ContentError extends Error {}

function requireArray<T>(value: unknown, path: string): T[] {
  if (!Array.isArray(value)) throw new ContentError(`${path} must be an array`);
  return value as T[];
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ContentError(message);
}

export function parseLanguagePack(raw: unknown): LanguagePack {
  const pack = raw as LanguagePack;
  assert(pack?.language?.code, "language.code is required");
  assert(pack?.language?.baseLang, "language.baseLang is required");
  assert(pack?.conjugation?.personae?.length, "conjugation.personae is required");
  assert(
    Object.keys(pack?.conjugation?.tenses ?? {}).length,
    "conjugation.tenses must not be empty",
  );
  requireArray(pack.words, "words");
  requireArray(pack.verbs, "verbs");
  requireArray(pack.stories, "stories");
  requireArray(pack.chapters, "chapters");
  validate(pack);
  return expandGeneratedLessons(pack);
}

/**
 * Characters that are legitimate in lesson content.
 *
 * Spanish content uses Latin letters, Spanish punctuation, and the occasional
 * symbol. Anything outside this set is a sign of a corrupted paste — a stray
 * CJK character, a smart quote from the wrong tool, an emoji that crept in from a
 * note. It reads as gibberish in the middle of a sentence and is invisible to
 * the eye at proof-reading speed, so it is rejected here instead.
 */
const ALLOWED_TEXT =
  // Latin-1 supplement and Latin Extended-A cover á é í ó ú ü ñ ç and friends.
  // Newlines are separate: stories use blank lines between paragraphs.
  // The arrows are deliberate — a lesson subtitle reading "tener→tendré" is a
  // real teaching device, and single characters are fine where a run of them
  // would be corruption.
  /^[ -ɏ‐-‰‹›⁄ -¿×÷‐-‧‰-⁞ -ɏ‐-‧\n→←↓↑]*$/m;

/**
 * Runs of tabs or spaces used as fake indentation.
 *
 * These came from my own lesson drafting, where I lined example sentences up
 * with tabs inside a plain-text body. The body renders with white-space:
 * pre-wrap, so they survived as ragged gaps rather than looking obviously
 * broken. A real paragraph never contains eight spaces in a row.
 */
const WHITESPACE_RUN = /\t|[ \t]{8,}/;

export interface TextProblem {
  where: string;
  field: string;
  text: string;
  problem: string;
}

/**
 * Check every free-text field in the pack for corrupted characters.
 *
 * Returns the problems rather than throwing, so a caller can report all of them
 * at once instead of making the author fix them one restart at a time.
 */
export function findTextProblems(pack: LanguagePack): TextProblem[] {
  const problems: TextProblem[] = [];

  const check = (where: string, field: string, value: unknown) => {
    if (typeof value !== "string" || !value) return;
    if (!ALLOWED_TEXT.test(value)) {
      const bad = [...value].filter((c) => !ALLOWED_TEXT.test(c));
      problems.push({
        where,
        field,
        text: value.length > 60 ? `${value.slice(0, 60)}…` : value,
        problem: `unexpected character(s): ${bad.map((c) => JSON.stringify(c)).join(" ")}`,
      });
    }
    if (WHITESPACE_RUN.test(value)) {
      problems.push({
        where,
        field,
        text: value.length > 60 ? `${value.slice(0, 60)}…` : value,
        problem: "tabs or long space runs used as indentation; use separate paragraphs instead",
      });
    }
  };

  for (const verb of pack.verbs) {
    check(`verb ${verb.id}`, "notes", verb.notes);
    check(`verb ${verb.id}`, "example", verb.example);
    for (const [lang, text] of Object.entries(verb.translations ?? {})) {
      check(`verb ${verb.id}`, `translations.${lang}`, text);
    }
    for (const [lang, text] of Object.entries(verb.exampleTranslation ?? {})) {
      check(`verb ${verb.id}`, `exampleTranslation.${lang}`, text);
    }
  }

  for (const word of pack.words) {
    check(`word ${word.id}`, "value", word.value);
    check(`word ${word.id}`, "pronunciation", word.pronunciation);
    check(`word ${word.id}`, "literal", word.literal);
    check(`word ${word.id}`, "example", word.example);
    check(`word ${word.id}`, "notes", word.notes);
    for (const [lang, text] of Object.entries(word.translations ?? {})) {
      check(`word ${word.id}`, `translations.${lang}`, text);
    }
    for (const [lang, text] of Object.entries(word.exampleTranslation ?? {})) {
      check(`word ${word.id}`, `exampleTranslation.${lang}`, text);
    }
  }

  for (const story of pack.stories) {
    check(`story ${story.id}`, "title", story.title);
    for (const [lang, text] of Object.entries(story.titleTranslations ?? {})) {
      check(`story ${story.id}`, `titleTranslations.${lang}`, text);
    }
    // Split on single newlines too, so a paragraph break never hides a bad
    // character from the check.
    story.text.split("\n").forEach((paragraph, i) => {
      check(`story ${story.id}`, `text line ${i + 1}`, paragraph);
    });
    story.questions.forEach((q, i) => {
      check(`story ${story.id}`, `question ${i + 1}.prompt`, q.prompt);
      if (q.type === "choice") {
        q.options.forEach((o, j) => check(`story ${story.id}`, `question ${i + 1}.option ${j}`, o.value));
      }
      if (q.type === "fill") check(`story ${story.id}`, `question ${i + 1}.answer`, q.answer);
    });
  }

  for (const chapter of pack.chapters) {
    check(`chapter ${chapter.id}`, "title", chapter.title);
    check(`chapter ${chapter.id}`, "subtitle", chapter.subtitle);
    check(`chapter ${chapter.id}`, "blurb", chapter.blurb);
    for (const [i, planned] of (chapter.outline ?? []).entries()) {
      const at = `chapter ${chapter.id} outline ${i + 1}`;
      check(at, "title", planned.title);
      check(at, "subtitle", planned.subtitle);
      check(at, "covers", planned.covers);
    }
    for (const lesson of chapter.lessons) {
      const at = `chapter ${chapter.id} lesson ${lesson.id}`;
      check(at, "title", lesson.title);
      check(at, "subtitle", lesson.subtitle);
      for (const section of lesson.sections ?? []) {
        check(at, `section "${section.title}"`, section.title);
        if (section.type === "text") check(at, `section "${section.title}" body`, section.body);
        if (section.type === "story") check(at, `section "${section.title}" note`, section.note);
        if ("note" in section) check(at, `section "${section.title}" note`, section.note);
        if (section.type === "comparison") {
          check(at, `comparison note`, section.note);
          for (const group of section.groups) {
            check(at, `comparison group "${group.title}"`, group.title);
            check(at, `comparison group "${group.title}" left`, group.left);
            check(at, `comparison group "${group.title}" right`, group.right);
            check(at, `comparison group "${group.title}" note`, group.note);
            check(at, `comparison group "${group.title}" leftTranslation`, group.leftTranslation);
            check(at, `comparison group "${group.title}" rightTranslation`, group.rightTranslation);
          }
        }
      }
      for (const q of lesson.quiz?.questions ?? []) {
        check(at, "quiz prompt", q.prompt);
        if (q.type === "choice") {
          q.options.forEach((o, j) => check(at, `quiz option ${j}`, o.value));
        }
        if (q.type === "fill") check(at, "quiz answer", q.answer);
      }
    }
  }

  return problems;
}

export function validate(pack: LanguagePack): void {
  const textProblems = findTextProblems(pack);
  if (textProblems.length) {
    const detail = textProblems
      .slice(0, 12)
      .map((p) => `  ${p.where} · ${p.field}: ${p.problem}`)
      .join("\n");
    throw new ContentError(
      `${textProblems.length} corrupted text field(s):\n${detail}` +
        (textProblems.length > 12 ? "\n  …and more" : ""),
    );
  }

  const wordIds = new Set(pack.words.map((w) => w.id));
  const verbIds = new Set(pack.verbs.map((v) => v.id));
  const storyIds = new Set(pack.stories.map((s) => s.id));
  const patternIds = collectPatternIds(pack);

  const assertUnique = (ids: string[], kind: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      assert(!seen.has(id), `duplicate ${kind} id: ${id}`);
      seen.add(id);
    }
  };
  assertUnique(pack.words.map((w) => w.id), "word");
  assertUnique(pack.verbs.map((v) => v.id), "verb");
  assertUnique(pack.stories.map((s) => s.id), "story");
  assertUnique(pack.chapters.map((c) => c.id), "chapter");

  const lessonIds: string[] = [];
  for (const chapter of pack.chapters) {
    requireArray(chapter.lessons, `chapter ${chapter.id}.lessons`);
    lessonIds.push(...chapter.lessons.map((l) => l.id));

    // An outline is the syllabus of a chapter that does not exist yet. If the
    // chapter has lessons, the outline is stale and would contradict them, so
    // it is a pack error rather than something to render.
    if (chapter.outline) {
      requireArray(chapter.outline, `chapter ${chapter.id}.outline`);
      assert(
        chapter.lessons.length === 0,
        `chapter ${chapter.id}: has an outline and ${chapter.lessons.length} lesson(s) — drop the outline`,
      );
      assert(
        chapter.outline.length > 0,
        `chapter ${chapter.id}: outline is empty; omit it instead`,
      );
      chapter.outline.forEach((planned, i) => {
        assert(
          typeof planned?.title === "string" && planned.title.trim(),
          `chapter ${chapter.id} outline ${i + 1}: needs a title`,
        );
      });
    }
  }
  // Lesson ids must be unique across the whole course, not just per chapter:
  // they are used in URLs and as progress keys.
  assertUnique(lessonIds, "lesson");

  const chapterOrders = pack.chapters.map((c) => c.order);
  assert(
    new Set(chapterOrders).size === chapterOrders.length,
    "chapter.order values must be unique",
  );
  assert(chapterOrders.length > 0, "a course needs at least one chapter");

  for (const verb of pack.verbs) {
    assert(patternIds.has(verb.pattern), `verb ${verb.id}: unknown pattern "${verb.pattern}"`);
    for (const tense of Object.keys(verb.irregular ?? {})) {
      assert(
        pack.conjugation.tenses[tense],
        `verb ${verb.id}: irregular override for unknown tense "${tense}"`,
      );
    }
    for (const tense of Object.keys(verb.stemChanges ?? {})) {
      assert(
        pack.conjugation.tenses[tense],
        `verb ${verb.id}: stem change for unknown tense "${tense}"`,
      );
    }
    for (const tense of Object.keys(verb.stemByTense ?? {})) {
      assert(
        pack.conjugation.tenses[tense],
        `verb ${verb.id}: stem for unknown tense "${tense}"`,
      );
    }
    for (const persona of Object.keys(verb.reflexivePronouns ?? {})) {
      assert(
        pack.conjugation.personae.some((p) => p.id === persona),
        `verb ${verb.id}: reflexive pronoun for unknown persona "${persona}"`,
      );
    }
  }

  for (const story of pack.stories) {
    for (const id of story.glossary ?? []) {
      assert(wordIds.has(id), `story ${story.id}: unknown glossary word "${id}"`);
    }
    validateQuestions(story.questions, `story ${story.id}`, verbIds, pack);
  }

  for (const chapter of pack.chapters) {
    assert(
      chapter.status === undefined ||
        chapter.status === "published" ||
        chapter.status === "locked",
      `chapter ${chapter.id}: status must be "published" or "locked"`,
    );
    const lessonOrders = chapter.lessons.map((l) => l.order);
    assert(
      new Set(lessonOrders).size === lessonOrders.length,
      `chapter ${chapter.id}: lesson.order values must be unique`,
    );

    for (const lesson of chapter.lessons) {
      const at = `chapter ${chapter.id} lesson ${lesson.id}`;

      // A generated lesson carries only a recipe; it is expanded after
      // validation, so check the recipe is well-formed here.
      if (lesson.source?.kind === "generated") {
        assert(
          hasGenerator(lesson.source.generator),
          `${at}: unknown generator "${lesson.source.generator}"`,
        );
        // A recipe declares only its args. Once expanded the lesson necessarily
        // has sections and a quiz, so the conflict check applies only before.
        if (!lesson.source.expanded) {
          assert(
            !lesson.sections?.length,
            `${at}: a generated lesson must not also declare sections`,
          );
          assert(!lesson.quiz, `${at}: a generated lesson must not also declare a quiz`);
        }
        continue;
      }

      assert(lesson.quiz, `${at}: quiz is required`);
      for (const section of lesson.sections) {
        if ("wordIds" in section) {
          for (const id of section.wordIds) {
            assert(wordIds.has(id), `${at}: unknown word "${id}"`);
          }
        }
        if (section.type === "conjugation") {
          for (const id of section.verbIds) {
            assert(verbIds.has(id), `${at}: unknown verb "${id}"`);
          }
          for (const p of section.focusPersonae ?? []) {
            assert(
              pack.conjugation.personae.some((x) => x.id === p),
              `${at}: unknown persona "${p}"`,
            );
          }
        }
        if (section.type === "story") {
          assert(
            storyIds.has(section.storyId),
            `${at}: unknown story "${section.storyId}"`,
          );
        }
        if (section.type === "comparison") {
          assert(section.leftLabel, `${at}: comparison needs a leftLabel`);
          assert(section.rightLabel, `${at}: comparison needs a rightLabel`);
          assert(
            section.groups.length > 0,
            `${at}: comparison needs at least one group`,
          );
          for (const group of section.groups) {
            assert(group.title, `${at}: comparison group needs a title`);
            // null on either side is meaningful: only one verb can say it.
            assert(
              (typeof group.left === "string" && group.left) || group.left === null,
              `${at}: comparison group "${group.title}" left must be a string or null`,
            );
            assert(
              (typeof group.right === "string" && group.right) || group.right === null,
              `${at}: comparison group "${group.title}" right must be a string or null`,
            );
            assert(
              group.left || group.right,
              `${at}: comparison group "${group.title}" needs at least one example`,
            );
          }
        }
      }
      validateQuestions(lesson.quiz.questions, `${at} quiz`, verbIds, pack);

      const threshold = lesson.quiz.passThreshold ?? 0.8;
      assert(
        threshold > 0 && threshold <= 1,
        `${at}: passThreshold must be in (0, 1]`,
      );
    }
  }
}

/**
 * Replace every generated lesson's recipe with a real lesson.
 *
 * Generated output is validated too, so a bad generator cannot slip broken
 * content into the course.
 */
export function expandGeneratedLessons(pack: LanguagePack): LanguagePack {
  const ctx: QuizContext = { pack, baseLang: pack.language.baseLang };
  return {
    ...pack,
    chapters: pack.chapters.map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.map((lesson) => {
        if (lesson.source?.kind !== "generated") return lesson;
        if (lesson.source.expanded) return lesson;
        const built = generateLesson(lesson.id, lesson.source, ctx);
        return {
          ...built,
          order: lesson.order,
          source: { ...lesson.source, expanded: true },
        };
      }),
    })),
  };
}

function validateQuestions(
  questions: unknown,
  where: string,
  verbIds: Set<string>,
  pack: LanguagePack,
) {
  const list = requireArray<Record<string, unknown>>(questions, `${where}.questions`);
  list.forEach((q, i) => {
    const at = `${where} question ${i + 1}`;
    const type = q["type"];
    assert(
      type === "conjugation" || type === "choice" || type === "fill",
      `${at}: unknown type "${type}"`,
    );
    if (type === "conjugation") {
      assert(verbIds.has(String(q["verbId"])), `${at}: unknown verb "${q["verbId"]}"`);
      assert(
        pack.conjugation.tenses[String(q["tense"])],
        `${at}: unknown tense "${q["tense"]}"`,
      );
      assert(
        pack.conjugation.personae.some((p) => p.id === q["persona"]),
        `${at}: unknown persona "${q["persona"]}"`,
      );
    }
    if (type === "choice") {
      const options = requireArray<{ value: string; correct: boolean }>(
        q["options"],
        `${at}.options`,
      );
      assert(options.length >= 2, `${at}: needs at least 2 options`);
      const correct = options.filter((o) => o.correct);
      assert(correct.length === 1, `${at}: needs exactly 1 correct option`);
      const values = options.map((o) => o.value.toLowerCase());
      assert(new Set(values).size === values.length, `${at}: duplicate option values`);
    }
    if (type === "fill") {
      assert(typeof q["answer"] === "string" && q["answer"].trim(), `${at}: answer required`);
    }
  });
}

function collectPatternIds(pack: LanguagePack): Set<string> {
  const ids = new Set<string>();
  for (const tense of Object.values(pack.conjugation.tenses)) {
    for (const [pattern, endings] of Object.entries(tense.patterns)) {
      ids.add(pattern);
      assert(
        endings.length === pack.conjugation.personae.length,
        `tense "${tense.label}" pattern "${pattern}" has ${endings.length} endings, expected ${pack.conjugation.personae.length}`,
      );
    }
  }
  return ids;
}

export async function loadPack(path: string): Promise<LanguagePack> {
  const file = Bun.file(path);
  if (!file.exists()) throw new ContentError(`language pack not found: ${path}`);
  return parseLanguagePack(await file.json());
}

/** Convenience indexes over a pack. */
export interface PackIndex {
  pack: LanguagePack;
  word(id: string): WordEntry;
  verb(id: string): VerbEntry;
  story(id: string): Story;
  /** Chapters in course order. */
  chapters(): Chapter[];
  /** All lessons in course order, chapter order then lesson order. */
  lessons(): Array<Lesson & { chapterId: string; chapterOrder: number }>;
  lesson(id: string): Lesson & { chapterId: string; chapterOrder: number } | undefined;
  /** Total lesson count across the whole course. */
  lessonCount(): number;
}

export function indexPack(pack: LanguagePack): PackIndex {
  const words = new Map(pack.words.map((w) => [w.id, w]));
  const verbs = new Map(pack.verbs.map((v) => [v.id, v]));
  const stories = new Map(pack.stories.map((s) => [s.id, s]));
  const need = <T,>(map: Map<string, T>, id: string, kind: string): T => {
    const found = map.get(id);
    if (!found) throw new ContentError(`unknown ${kind}: ${id}`);
    return found;
  };

  const chapters = () => [...pack.chapters].sort((a, b) => a.order - b.order);
  const lessons = () =>
    chapters().flatMap((chapter) =>
      [...chapter.lessons]
        .sort((a, b) => a.order - b.order)
        .map((lesson) => ({ ...lesson, chapterId: chapter.id, chapterOrder: chapter.order })),
    );

  const byLessonId = new Map(lessons().map((l) => [l.id, l]));

  return {
    pack,
    word: (id) => need(words, id, "word"),
    verb: (id) => need(verbs, id, "verb"),
    story: (id) => need(stories, id, "story"),
    chapters,
    lessons,
    lesson: (id) => byLessonId.get(id),
    lessonCount: () => byLessonId.size,
  };
}
