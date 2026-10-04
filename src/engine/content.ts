import type { LanguagePack, Lesson, Story, VerbEntry, WordEntry } from "../types.ts";

/**
 * Loads a language pack from JSON and validates its internal references.
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
  requireArray(pack.lessons, "lessons");
  validate(pack);
  return pack;
}

export function validate(pack: LanguagePack): void {
  const wordIds = new Set(pack.words.map((w) => w.id));
  const verbIds = new Set(pack.verbs.map((v) => v.id));
  const storyIds = new Set(pack.stories.map((s) => s.id));
  const patternIds = collectPatternIds(pack);

  const dup = (ids: string[], kind: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      assert(!seen.has(id), `duplicate ${kind} id: ${id}`);
      seen.add(id);
    }
  };
  dup(pack.words.map((w) => w.id), "word");
  dup(pack.verbs.map((v) => v.id), "verb");
  dup(pack.stories.map((s) => s.id), "story");
  dup(pack.lessons.map((l) => l.id), "lesson");

  const orders = pack.lessons.map((l) => l.order);
  assert(new Set(orders).size === orders.length, "lesson.order values must be unique");

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
  }

  for (const story of pack.stories) {
    for (const id of story.glossary ?? []) {
      assert(wordIds.has(id), `story ${story.id}: unknown glossary word "${id}"`);
    }
    validateQuestions(story.questions, `story ${story.id}`, verbIds, pack);
  }

  for (const lesson of pack.lessons) {
    assert(lesson.quiz, `lesson ${lesson.id}: quiz is required`);
    for (const section of lesson.sections) {
      if ("wordIds" in section) {
        for (const id of section.wordIds) {
          assert(wordIds.has(id), `lesson ${lesson.id}: unknown word "${id}"`);
        }
      }
      if (section.type === "conjugation") {
        for (const id of section.verbIds) {
          assert(verbIds.has(id), `lesson ${lesson.id}: unknown verb "${id}"`);
        }
        for (const p of section.focusPersonae ?? []) {
          assert(
            pack.conjugation.personae.some((x) => x.id === p),
            `lesson ${lesson.id}: unknown persona "${p}"`,
          );
        }
      }
      if (section.type === "story") {
        assert(storyIds.has(section.storyId), `lesson ${lesson.id}: unknown story "${section.storyId}"`);
      }
    }
    validateQuestions(lesson.quiz.questions, `lesson ${lesson.id} quiz`, verbIds, pack);

    const threshold = lesson.quiz.passThreshold ?? 0.8;
    assert(
      threshold > 0 && threshold <= 1,
      `lesson ${lesson.id}: passThreshold must be in (0, 1]`,
    );
  }
}

function validateQuestions(
  questions: LanguagePack["lessons"][number]["quiz"]["questions"],
  where: string,
  verbIds: Set<string>,
  pack: LanguagePack,
) {
  const questions_ = requireArray<Record<string, unknown>>(questions, `${where}.questions`);
  questions_.forEach((q, i) => {
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
      const options = requireArray<{ value: string; correct: boolean }>(q["options"], `${at}.options`);
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
  lessons(): Lesson[];
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
  return {
    pack,
    word: (id) => need(words, id, "word"),
    verb: (id) => need(verbs, id, "verb"),
    story: (id) => need(stories, id, "story"),
    lessons: () => [...pack.lessons].sort((a, b) => a.order - b.order),
  };
}
