import type { ConjugationRules, ConjugationTable, VerbEntry } from "../types.ts";

/**
 * Conjugation engine. Regular verbs are generated from the language's rules;
 * irregular forms come from data on the verb itself. Adding a tense to a
 * language therefore means editing JSON, never this file.
 */

export function conjugate(
  verb: VerbEntry,
  rules: ConjugationRules,
  tense: string,
): ConjugationTable {
  const rule = rules.tenses[tense];
  if (!rule) throw new Error(`Unknown tense: ${tense}`);
  const endings = rule.patterns[verb.pattern];
  if (!endings) throw new Error(`Unknown pattern "${verb.pattern}" for verb ${verb.id}`);

  const personae = rules.personae;
  const irregular: Record<string, string> = {};

  if (endings.length !== personae.length) {
    throw new Error(
      `Tense "${tense}" has ${endings.length} endings but ${personae.length} personae`,
    );
  }

  const forms: Record<string, string> = {};
  personae.forEach((persona, i) => {
    // Reflexive pronouns ride along with the conjugated form.
    const prefix = verb.reflexivePronouns?.[persona.id] ? `${verb.reflexivePronouns[persona.id]} ` : "";
    const override = verb.irregular?.[tense]?.[persona.id];
    if (override) {
      forms[persona.id] = prefix + override;
      irregular[persona.id] = "override";
      return;
    }
    const stem =
      verb.stemChanges?.[tense]?.[persona.id] ?? verb.stemByTense?.[tense] ?? verb.stem;
    forms[persona.id] = prefix + stem + (endings[i] ?? "");
    if (verb.stemChanges?.[tense]?.[persona.id]) irregular[persona.id] = "stem-change";
  });

  return {
    verbId: verb.id,
    tense,
    tenseLabel: rule.labelTranslations?.[rules.baseLang] ?? rule.label,
    forms,
    irregularForms: irregular,
  };
}

/**
 * All requested tenses for one verb, keyed by tense id. Defaults to every tense
 * the language defines; pass `tenses` to show a subset (an early lesson asking
 * for present only).
 */
export function conjugateAll(
  verb: VerbEntry,
  rules: ConjugationRules,
  tenses?: string[],
): Record<string, ConjugationTable> {
  const ids = tenses?.length ? tenses : Object.keys(rules.tenses);
  return Object.fromEntries(ids.map((tense) => [tense, conjugate(verb, rules, tense)]));
}

/** Does this form follow the regular rule, or is it irregular? */
export function isRegularForm(verb: VerbEntry, rules: ConjugationRules, form: string): boolean {
  return Object.values(conjugateAll(verb, rules))
    .flatMap((t) => Object.values(t.forms))
    .includes(form);
}

/**
 * Build wrong answers for a conjugation question: sibling forms of the same
 * verb first, then forms of other verbs, de-duplicated and never the answer.
 */
export function makeDistractors(
  answer: string,
  siblingForms: string[],
  otherForms: string[],
  count = 3,
): string[] {
  const seen = new Set<string>([answer.toLowerCase()]);
  const out: string[] = [];
  for (const candidate of [...shuffleStable(siblingForms), ...shuffleStable(otherForms)]) {
    const key = candidate.toLowerCase();
    if (seen.has(key) || !candidate.trim()) continue;
    seen.add(key);
    out.push(candidate);
    if (out.length === count) break;
  }
  return out;
}

/** Deterministic shuffle so repeated renders don't reshuffle mid-question. */
export function shuffleStable<T>(items: T[], seed = 1): T[] {
  const out = [...items];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    const a = out[i]!;
    const b = out[j]!;
    out[i] = b;
    out[j] = a;
  }
  return out;
}
