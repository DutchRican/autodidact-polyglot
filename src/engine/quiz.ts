import type { LanguagePack, QuizQuestion, VerbEntry } from "../types.ts";
import { conjugate, makeDistractors, shuffleStable } from "./conjugation.ts";

/**
 * Quiz engine. Turns a declarative question from the content pack into
 * something renderable, and grades an answer. Works for any language because
 * it only reads the pack's rules — it never hardcodes a conjugation ending.
 */

export type PresentedQuestion =
  | {
      kind: "choice";
      index: number;
      prompt: string;
      promptLang: string;
      options: string[];
    }
  | {
      kind: "fill";
      index: number;
      prompt: string;
      promptLang: string;
      placeholder: string;
    }
  | {
      kind: "conjugation";
      index: number;
      /** e.g. "hablar · yo · present" */
      prompt: string;
      personaLabel: string;
      tenseLabel: string;
      infinitive: string;
      meaning: string;
      options: string[];
    };

export interface QuizContext {
  pack: LanguagePack;
  baseLang: string;
}

export function presentQuestion(q: QuizQuestion, index: number, ctx: QuizContext): PresentedQuestion {
  if (q.type === "choice") {
    return {
      kind: "choice",
      index,
      prompt: q.prompt,
      promptLang: q.promptLang ?? ctx.baseLang,
      options: shuffleStable(q.options.map((o) => o.value), index + 1),
    };
  }

  if (q.type === "fill") {
    return {
      kind: "fill",
      index,
      prompt: q.prompt,
      promptLang: q.promptLang ?? ctx.baseLang,
      placeholder: "type in " + ctx.pack.language.code,
    };
  }

  const verb = ctx.pack.verbs.find((v) => v.id === q.verbId);
  if (!verb) throw new Error(`unknown verb ${q.verbId}`);
  const persona = ctx.pack.conjugation.personae.find((p) => p.id === q.persona);
  if (!persona) throw new Error(`unknown persona ${q.persona}`);
  const rule = ctx.pack.conjugation.tenses[q.tense];
  if (!rule) throw new Error(`unknown tense ${q.tense}`);

  const answer = conjugate(verb, ctx.pack.conjugation, q.tense).forms[q.persona] ?? "";

  // Wrong answers: other forms of this same verb first (that's the real test),
  // topped up with forms of other verbs.
  const table = conjugate(verb, ctx.pack.conjugation, q.tense);
  const siblings = ctx.pack.conjugation.personae
    .map((p) => table.forms[p.id])
    .filter((f): f is string => Boolean(f) && f !== answer);

  const others = ctx.pack.verbs
    .filter((v) => v.id !== verb.id)
    .flatMap((v) => {
      try {
        return Object.values(conjugate(v, ctx.pack.conjugation, q.tense).forms);
      } catch {
        return [];
      }
    });

  const distractors = q.distractors?.length
    ? q.distractors
    : makeDistractors(answer, siblings, others, 3);

  const prompt = q.prompt?.[ctx.baseLang] ?? buildPrompt(verb, persona.id, ctx);

  return {
    kind: "conjugation",
    index,
    prompt,
    personaLabel: persona.label,
    tenseLabel: rule.labelTranslations?.[ctx.baseLang] ?? rule.label,
    infinitive: verb.infinitive,
    meaning: verb.translations[ctx.baseLang] ?? "",
    options: shuffleStable([answer, ...distractors], index + 7),
  };
}

/**
 * "hablar — I". Built from the pack's own prompt template so that a language
 * can describe its own questions.
 */
function buildPrompt(verb: VerbEntry, personaId: string, ctx: QuizContext): string {
  const template = ctx.pack.conjugation.prompt;
  if (!template) return `Conjugate: ${verb.infinitive}`;
  const pronoun = template.pronouns[personaId];
  if (!pronoun) return `Conjugate: ${verb.infinitive} (${personaId})`;
  return template.template
    .replaceAll("{infinitive}", verb.infinitive)
    .replaceAll("{pronoun}", pronoun);
}

export interface Graded {
  correct: boolean;
  answer: string;
  /** Accepted alternatives, shown after answering. */
  alsoAccept?: string[];
  explanation?: string;
}

function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents: "estás" == "estas"
    .replace(/\s+/g, " ");
}

export function grade(question: QuizQuestion, response: string, ctx: QuizContext): Graded {
  if (question.type === "conjugation") {
    const verb = ctx.pack.verbs.find((v) => v.id === question.verbId);
    if (!verb) throw new Error(`unknown verb ${question.verbId}`);
    const answer = conjugate(verb, ctx.pack.conjugation, question.tense).forms[question.persona] ?? "";
    return { correct: normalize(response) === normalize(answer), answer };
  }

  if (question.type === "choice") {
    const option = question.options.find((o) => o.value === response);
    return {
      correct: option?.correct ?? false,
      answer: question.options.find((o) => o.correct)?.value ?? "",
      explanation: question.explanation?.[ctx.baseLang],
    };
  }

  const accepted = [question.answer, ...(question.accept ?? [])];
  return {
    correct: accepted.some((a) => normalize(a) === normalize(response)),
    answer: question.answer,
    alsoAccept: (question.accept ?? []).filter((a) => !question.answer.includes(a)),
    explanation: question.explanation?.[ctx.baseLang],
  };
}

export interface ScoreResult {
  total: number;
  correct: number;
  ratio: number;
  passed: boolean;
  /** Index of each question, true if correct. */
  marks: boolean[];
}

export function score(
  questions: QuizQuestion[],
  responses: string[],
  ctx: QuizContext,
  passThreshold = 0.8,
): ScoreResult {
  const marks = questions.map((q, i) => grade(q, responses[i] ?? "", ctx).correct);
  const correct = marks.filter(Boolean).length;
  const ratio = questions.length ? correct / questions.length : 0;
  return { total: questions.length, correct, ratio, passed: ratio >= passThreshold, marks };
}
