/**
 * Core types. Nothing in here mentions Spanish — a language pack is data,
 * and this engine is generic across all of them.
 */

export type LangCode = string;

/** A word / phrase in the target language. */
export interface WordEntry {
  id: string;
  /** The word as written in the target language. */
  value: string;
  /** Keyed by language code, e.g. { en: "hello" }. */
  translations: Record<LangCode, string>;
  pos?: "noun" | "verb" | "adj" | "adv" | "phrase" | "numeral" | "color" | "article";
  gender?: "m" | "f";
  /** Rough pronunciation hint in the learner's own language. */
  pronunciation?: string;
  /** English gloss of a literal/idiomatic meaning. */
  literal?: string;
  /** Example sentence in the target language. */
  example?: string;
  exampleTranslation?: Record<LangCode, string>;
  /** Grammar or usage caveat. */
  notes?: string;
  tags?: string[];
}

/** One person of a conjugation table, e.g. "yo". */
export interface Persona {
  id: string;
  label: string;
}

/** Conjugation rules, supplied per language as data. */
export interface ConjugationRules {
  /** Language the learner already speaks; used to label tenses. */
  baseLang: LangCode;
  /** How a verb's dictionary form is named. */
  infinitiveLabel: string;
  /** Which verb forms we consider "base" (teaching base). */
  baseForms: string[];
  /**
   * How to phrase a conjugation question. `{infinitive}` and `{pronoun}` are
   * substituted; `{pronoun}` comes from the persona map below.
   */
  prompt?: {
    template: string;
    /** Persona id -> how the learner refers to that person in English. */
    pronouns: Record<string, string>;
  };
  personae: Persona[];
  tenses: Record<string, TenseRule>;
}

export interface TenseRule {
  label: string;
  /** Suffixes by verb pattern, in persona order. */
  patterns: Record<string, string[]>;
  /** Optional translation of the tense label, keyed by language code. */
  labelTranslations?: Record<LangCode, string>;
}

export interface VerbEntry {
  id: string;
  infinitive: string;
  /** Stem that regular endings attach to ("habl" + "o" = "hablo"). */
  stem: string;
  /** Pattern key, must exist in the rules' tenses (e.g. "ar"). */
  pattern: string;
  translations: Record<LangCode, string>;
  /** Full-form overrides: { present: { yo: "soy" } }. Wins over everything. */
  irregular?: Record<string, Record<string, string>>;
  /** Stem replacements per persona: { present: { yo: "duerm" } }. */
  stemChanges?: Record<string, Record<string, string>>;
  /**
   * Stem replacement for a whole tense, ignoring the persona.
   *
   * Needed because the Spanish future attaches its endings to the infinitive
   * minus the infinitive ending, not to the usual stem: hablar + é is hablaré,
   * not hablé. Per-persona stemChanges cannot express that, and writing six
   * entries for every verb would be 26 x 6 of noise.
   */
  stemByTense?: Record<string, string>;
  /**
   * Reflexive pronouns by persona. When present the pronoun is prepended to the
   * conjugated form, so "levantarse" yields "me levanto" rather than "levanto" —
   * the quiz, the table and the grading all agree on one string.
   */
  reflexivePronouns?: Record<string, string>;
  notes?: string;
  example?: string;
  exampleTranslation?: Record<LangCode, string>;
}

/** One computed conjugation table for one verb + tense. */
export interface ConjugationTable {
  verbId: string;
  tense: string;
  tenseLabel: string;
  forms: Record<string, string>;
  /** Personas whose form came from an override or stem change (highlighted in UI). */
  irregularForms: Record<string, string>;
}

export type QuizQuestion =
  | ConjugationQuestion
  | ChoiceQuestion
  | FillQuestion;

export interface ConjugationQuestion {
  type: "conjugation";
  verbId: string;
  tense: string;
  persona: string;
  /** e.g. "How do you say 'I speak'?" */
  prompt?: Record<LangCode, string>;
  /** Extra wrong answers; if absent they are generated from sibling forms. */
  distractors?: string[];
}

export interface ChoiceQuestion {
  type: "choice";
  prompt: string;
  promptLang?: LangCode;
  options: Array<{ value: string; correct: boolean }>;
  explanation?: Record<LangCode, string>;
}

export interface FillQuestion {
  type: "fill";
  prompt: string;
  promptLang?: LangCode;
  /** Blank shown as ___ in the prompt. */
  answer: string;
  /** Additional accepted spellings (accents optional, etc). */
  accept?: string[];
  explanation?: Record<LangCode, string>;
}

export interface Story {
  id: string;
  title: string;
  titleTranslations: Record<LangCode, string>;
  /** Paragraphs separated by a blank line. */
  text: string;
  /** Word ids appearing in this story. */
  glossary?: string[];
  questions: QuizQuestion[];
}

export type LessonSection =
  | { type: "words"; title: string; note?: string; wordIds: string[] }
  | { type: "numbers"; title: string; note?: string; wordIds: string[] }
  | { type: "colors"; title: string; note?: string; wordIds: string[] }
  | {
      type: "conjugation";
      title: string;
      note?: string;
      verbIds: string[];
      /** Which personas to emphasise while teaching the table. */
      focusPersonae?: string[];
      /**
       * Which tenses to display, in this order. Omit for "every tense in the
       * pack". Early lessons pin this to ["present"] so a preterite table
       * doesn't appear three chapters before it is taught.
       */
      tenses?: string[];
    }
  | { type: "story"; title: string; note?: string; storyId: string }
  | { type: "text"; title: string; body: string }
  | ComparisonSection;

export interface Quiz {
  id: string;
  title: string;
  /** Passing threshold as a fraction, e.g. 0.75. */
  passThreshold?: number;
  questions: QuizQuestion[];
}

export interface Lesson {
  id: string;
  /** Position within its chapter. */
  order: number;
  title: string;
  subtitle?: string;
  sections: LessonSection[];
  quiz: Quiz;
  /**
   * How this lesson came to exist. "authored" lessons live in the content file
   * by hand; "generated" ones were produced by the engine from verbs/words, and
   * the pack records only the recipe. Content itself always lives in the pack.
   */
  source?: LessonSource;
}

/**
 * A two-verb comparison, rendered as a table rather than prose.
 *
 * Some contrasts are positional: which verb you pick changes what the sentence
 * means. A paragraph can say that, but it cannot line the two side by side, and
 * the side-by-side is the part a learner actually reads. Each group is one
 * meaning, with a worked example for each side; `null` on a side means that
 * verb cannot express that meaning.
 */
export interface ComparisonGroup {
  /** The meaning being contrasted, e.g. "Identity". */
  title: string;
  /**
   * Example using the left verb, or null if the left verb cannot express this
   * meaning. That absence is the point of the table — it shows which side of
   * the pair owns a category, rather than leaving the learner to infer it.
   */
  left: string | null;
  /** Example using the right verb, or null if only the left verb works. */
  right: string | null;
  /** How to say the left example in the learner's language. */
  leftTranslation?: string;
  rightTranslation?: string;
  /** Why they differ, or a caveat. */
  note?: string;
}

export interface ComparisonSection {
  type: "comparison";
  title: string;
  note?: string;
  /** Column headings, usually the two verbs' infinitives. */
  leftLabel: string;
  rightLabel: string;
  groups: ComparisonGroup[];
}

export type LessonSource =
  | { kind: "authored" }
  | {
      kind: "generated";
      /** Generator name in src/engine/generate.ts. */
      generator: string;
      /** Arguments the generator was run with. */
      args: Record<string, string | string[]>;
      /**
       * Authored questions appended after the generated ones. Lets a generated
       * conjugation drill carry a couple of hand-written questions about the
       * specific irregulars, without hand-writing the whole quiz.
       */
      extraQuestions?: QuizQuestion[];
      /**
       * Set by the loader once the recipe has been expanded. Distinguishes a
       * recipe in a hand-written pack (must not carry sections or a quiz) from
       * the same lesson after loading, which necessarily has both.
       */
      expanded?: boolean;
    };

/**
 * A chapter groups lessons so complexity can ramp up over time. Chapters are
 * the top level of the course; a chapter has no cross-chapter dependencies.
 */
export interface Chapter {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  /** What the learner will be able to do by the end. */
  blurb?: string;
  /** Difficulty band, for display only. */
  level?: "beginner" | "elementary" | "intermediate" | "advanced";
  /**
   * "published" (the default) or "locked". A locked chapter is authored but
   * held back — shown so the shape of the course is legible, not selectable.
   *
   * This is the *content* lock. Whether a published chapter has been unlocked
   * yet is a separate, progress-derived question answered in
   * public/progress.js, because progress lives in the browser.
   */
  status?: "published" | "locked";
  lessons: Lesson[];
}

/** Content-level check only: has this chapter been released yet? */
export const isChapterPublished = (chapter: Chapter): boolean =>
  (chapter.status ?? "published") === "published";

/** A complete language, as data. */
export interface LanguagePack {
  language: {
    code: LangCode;
    name: string;
    endonym: string;
    flag?: string;
    /** Language the learner already speaks; UI + translations are keyed by it. */
    baseLang: LangCode;
    blurb?: string;
  };
  conjugation: ConjugationRules;
  words: WordEntry[];
  verbs: VerbEntry[];
  stories: Story[];
  /** Top-level course structure. Order matters; lessons live inside chapters. */
  chapters: Chapter[];
}
