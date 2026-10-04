import { conjugateAll } from "./conjugation.ts";
import type { QuizContext } from "./quiz.ts";
import type { Lesson, QuizQuestion } from "../types.ts";

/**
 * Lesson generators.
 *
 * A chapter of 20 conjugation lessons should not mean hand-writing 20
 * near-identical quizzes. A generated lesson is described in the content file
 * by a recipe:
 *
 *   { "generator": "verbDrill", "args": { "verbId": "vivir", "personae": "todos" } }
 *
 * The generator expands that recipe into a real Lesson — sections plus a quiz —
 * at load time. The content itself still lives in the pack: generators only
 * choose what to include and how to phrase questions. They never invent words
 * or conjugation forms, so nothing generated can be linguistically wrong.
 */

export interface GeneratedLesson {
  title: string;
  subtitle?: string;
  sections: Lesson["sections"];
  questions: QuizQuestion[];
}

export type Generator = (
  args: Record<string, string | string[]>,
  ctx: QuizContext,
) => GeneratedLesson;

function argString(args: Record<string, string | string[]>, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" ? value : undefined;
}

function requireVerb(args: Record<string, string | string[]>, ctx: QuizContext) {
  const verbId = argString(args, "verbId");
  const verb = ctx.pack.verbs.find((v) => v.id === verbId);
  if (!verb) throw new Error(`generator: unknown verbId "${verbId}"`);
  return verb;
}

function requireWordIds(args: Record<string, string | string[]>, ctx: QuizContext): string[] {
  const ids = args["wordIds"];
  const list = typeof ids === "string" ? ids.split(",").map((s) => s.trim()) : [];
  if (!list.length) throw new Error("generator: wordIds is required");
  for (const id of list) {
    if (!ctx.pack.words.some((w) => w.id === id)) {
      throw new Error(`generator: unknown word id "${id}"`);
    }
  }
  return list;
}

/** All six personae of one verb, as a conjugation lesson plus a full drill. */
const verbDrill: Generator = (args, ctx) => {
  const verb = requireVerb(args, ctx);
  const meaning = verb.translations[ctx.baseLang] ?? "";
  const focus = argString(args, "personae");

  const tables = Object.values(conjugateAll(verb, ctx.pack.conjugation));
  const questions: QuizQuestion[] = ctx.pack.conjugation.personae
    .map((persona) => ({
      type: "conjugation" as const,
      verbId: verb.id,
      tense: "present",
      persona: persona.id,
    }))
    .filter((q) => !focus || focus === "todos" || focus.split(",").includes(q.persona));

  return {
    title: `${verb.infinitive} — ${meaning}`,
    subtitle: `All ${ctx.pack.conjugation.personae.length} forms of ${verb.infinitive}`,
    sections: [
      {
        type: "conjugation",
        title: `${verb.infinitive} (${verb.infinitive} — ${meaning})`,
        note: verb.notes,
        verbIds: [verb.id],
      },
      ...(verb.example
        ? [
            {
              type: "text" as const,
              title: "In a sentence",
              body: `${verb.example}\n\n${verb.exampleTranslation?.[ctx.baseLang] ?? ""}`,
            },
          ]
        : []),
    ],
    questions,
  };
};

/** A vocabulary lesson built from a named set of words in the pack. */
const wordSet: Generator = (args, ctx) => {
  const wordIds = requireWordIds(args, ctx);
  const title = argString(args, "title") ?? "Vocabulary";
  const kind = argString(args, "kind") ?? "words";
  const baseLang = ctx.baseLang;
  const words = wordIds.map((id) => ctx.pack.words.find((w) => w.id === id)!);

  // Alternate directions so passing requires both word->meaning and
  // meaning->word. Distractors come from other words in the same set, which is
  // what makes it a real test of this set rather than a lucky guess.
  const questions: QuizQuestion[] = words.map((word, i) => {
    if (i % 2 === 0) {
      return {
        type: "fill",
        prompt: `${word.translations[baseLang] ?? ""} = ___`,
        answer: word.value,
        // Accept the word without its accents.
        accept: [stripAccents(word.value)],
      };
    }

    const meaning = word.translations[baseLang] ?? "";
    const others = words
      .filter((w) => w.value !== word.value)
      .map((w) => w.translations[baseLang] ?? "")
      .filter(Boolean)
      .slice(offset(i), offset(i) + 3);

    const values = [meaning, ...others];
    return {
      type: "choice",
      prompt: word.value,
      promptLang: ctx.pack.language.code,
      options: values.map((value) => ({ value, correct: value === meaning })),
    };
  });

  return {
    title,
    sections: [
      {
        type: kind === "numbers" ? "numbers" : kind === "colors" ? "colors" : "words",
        title,
        wordIds,
      },
    ],
    questions,
  };
};

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Deterministic rotation so distractors differ per question. */
function offset(seed: number): number {
  return (seed * 3 + 1) % 4;
}

/** Read a story and answer questions about it. */
const storyReading: Generator = (args, ctx) => {
  const storyId = argString(args, "storyId");
  const story = ctx.pack.stories.find((s) => s.id === storyId);
  if (!story) throw new Error(`generator: unknown storyId "${storyId}"`);

  return {
    title: story.titleTranslations[ctx.baseLang] ?? story.title,
    subtitle: `Reading: ${story.title}`,
    sections: [{ type: "story", title: story.title, storyId: story.id }],
    questions: story.questions,
  };
};

const generators: Record<string, Generator> = {
  verbDrill,
  wordSet,
  storyReading,
};

export function generateLesson(
  lessonId: string,
  source: NonNullable<Lesson["source"]>,
  ctx: QuizContext,
): Lesson {
  if (source.kind !== "generated") throw new Error(`lesson ${lessonId}: not generated`);
  const generator = generators[source.generator];
  if (!generator) throw new Error(`lesson ${lessonId}: unknown generator "${source.generator}"`);
  const built = generator(source.args, ctx);
  return {
    id: lessonId,
    order: 0,
    title: built.title,
    subtitle: built.subtitle,
    sections: built.sections,
    quiz: {
      id: `${lessonId}-quiz`,
      title: `${built.title} quiz`,
      passThreshold: 0.8,
      questions: built.questions,
    },
    source,
  };
}

export function hasGenerator(name: string): boolean {
  return name in generators;
}
