import type { LanguagePack, VerbEntry } from "../types.ts";
import { conjugate } from "./conjugation.ts";

/**
 * Lints for mistakes that the conjugation engine cannot detect.
 *
 * The engine is silent about wrong data. A verb whose stem is subtly incorrect
 * produces a well-formed table of forms that do not exist in Spanish, and the
 * golden tables only catch it if someone wrote down the right answer first.
 * Adding the present subjunctive and then chapter 7 produced fourteen wrong
 * forms, so this module encodes the rules that would have caught them.
 *
 * Each rule below is a fact about Spanish with no exceptions in this pack, not a
 * heuristic. That matters: a lint with false positives gets ignored.
 *
 * The rules are not exhaustive. They cover the four causes of every wrong form
 * found so far, plus two data-hygiene problems that were found by hand.
 */

export interface LintFinding {
  rule: string;
  subject: string;
  message: string;
  /**
   * "error" is always wrong. "review" is a judgement call: mentioning a verb in
   * a phrase without ever conjugating it is sometimes right, and sometimes the
   * learner can read a verb the course never teaches. Those are listed, not
   * blocked, so the list stays short enough to read.
   */
  severity: "error" | "review";
}

const PERSONAE = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"] as const;

function forms(verb: VerbEntry, pack: LanguagePack, tense: string): Record<string, string> {
  return conjugate(verb, pack.conjugation, tense).forms;
}

/**
 * Two entries with the same surface form mean the learner sees the same
 * flashcards twice and the glossary lists the word twice. Found twice by hand:
 * "trabajo"/"el-trabajo" and "siempre"/"siempre2".
 */
function duplicateWordValues(pack: LanguagePack): LintFinding[] {
  const seen = new Map<string, string[]>();
  for (const word of pack.words) {
    const key = word.value.trim().toLowerCase();
    seen.set(key, [...(seen.get(key) ?? []), word.id]);
  }
  const out: LintFinding[] = [];
  for (const [value, ids] of seen) {
    if (ids.length < 2) continue;
    out.push({
      rule: "duplicate-word-value",
      subject: value,
      message: `"${value}" is listed under ${ids.length} ids: ${ids.join(", ")}. Keep one and repoint the rest.`,
      severity: "error",
    });
  }
  return out;
}

const BARE_INFINITIVE = /^[a-záéíóúüñ]+$/;

/**
 * A word entry with pos "verb" that is a bare infinitive but has no entry in
 * `verbs`. The learner can read it and never conjugate it, which is the single
 * most confusing gap in a conjugation course. Seven of these existed: trabajar,
 * empezar, necesitar, esperar, buscar, aprender, escribir.
 */
function orphanVerbWords(pack: LanguagePack): LintFinding[] {
  // Compare the word's *value* against the verbs' infinitives, not ids. A word
  // entry whose id differs from the verb's id is still fine when the infinitive
  // it names is in the pack.
  const infinitives = new Set(pack.verbs.map((v) => v.infinitive));
  return pack.words
    .filter((w) => w.pos === "verb" && BARE_INFINITIVE.test(w.value))
    // Deliberate and fine: estudiar, dormir, sentir and pedir are all in both
    // arrays, so the learner gets a flashcard and a conjugation table.
    .filter((w) => !infinitives.has(w.value))
    .map((w) => ({
      rule: "verb-word-without-verb-entry",
      subject: w.id,
      message: `"${w.value}" is a word with pos "verb" but no verb in the pack has that infinitive, so it cannot be conjugated. Add it to \`verbs\`, or accept it: some verbs are only ever mentioned inside a phrase.`,
      severity: "review",
    }));
}

/**
 * No Spanish verb changes its stem on nosotros or vosotros in the present
 * indicative. This is universal, across every class:
 *
 *   pienso, piensas, piensa, PENSAMOS, pensáis, piensan
 *   cuento,  cuentas,  cuenta,  CONTAMOS,  contáis,  cuentan
 *   siento,  sientes,  siente,  SENTIMOS,  sentís,  sienten
 *   duermo,  duermes,  duerme,  DORMIMOS,  dormís,  duermen
 *
 * The diphthong is on the singular and the third person plural, never on the
 * first and second plurals. Marking all six personae is how *empiezamos*,
 * *cuentamos* and *siguimos* ship -- three of the forms this linter was written
 * for.
 *
 * The subjunctive is a different matter and deliberately not checked here: there
 * the plurals really do take the diphthong (piensemos, sintamos).
 */
function presentStemChangeOnPlural(pack: LanguagePack): LintFinding[] {
  const endings = (pack: LanguagePack) => pack.conjugation.tenses["present"]!.patterns;
  const out: LintFinding[] = [];
  for (const verb of pack.verbs) {
    const changes = verb.stemChanges?.["present"];
    if (!changes) continue;
    const pattern = endings(pack)[verb.pattern];
    const generated = forms(verb, pack, "present");

    PERSONAE.forEach((persona, i) => {
      const changed = changes[persona];
      // Only a stem that actually differs from the base one is a change. Several
      // verbs list nosotros/vosotros explicitly with the plain stem, which is
      // redundant but harmless -- that is not what this rule is for.
      if (changed === undefined || changed === verb.stem) return;
      if (persona !== "nosotros" && persona !== "vosotros") return;
      const plain = verb.stem + (pattern?.[i] ?? "");
      if (generated[persona] === plain) return;
      out.push({
        rule: "present-stem-change-on-plural",
        subject: verb.id,
        message: `${verb.id} changes its present stem on ${persona}, giving "${generated[persona]}" where Spanish has "${plain}". No Spanish verb does this in the present indicative; only the subjunctive changes the plural.`,
        severity: "error",
      });
    });
  }
  return out;
}

/**
 * Spelling rules for the three verb classes whose subjunctive is not derivable
 * from the stem plus the -ar endings. Each is orthography, so each is exact.
 *
 *   -gar   a hard g needs gu before e/i, on all five personae that take e/i:
 *          pagUE, pagUEs, pagUE, PAGUEMOS, PAGUÉIS, pagUEn
 *   -car   a hard c needs qu: busquE, busquEs, busquE, BUSQUEMOS, BUSQUÉIS, busquEn
 *   -zar   z becomes c before e: almuercE, almuercEs, almuercE, ALMORCEMOS,
 *          ALMORCÉIS, almuercEn
 *
 * Note what -zar does *not* do: the diphthong stays on the singular and ellos,
 * and only the two plural personae take the c. That is why the check is
 * per-persona rather than a single suffix.
 *
 * The `qu`/`gu`/`c` of the -car/-gar/-zar classes all live in the *endings*, not
 * the stem, which is why these verbs need their subjunctive written out in full
 * rather than left to the engine.
 *
 * This is the rule behind *empemos*, *explicemos* and *almorzemos* -- all three
 * were wrong before this existed, and the first two looked entirely plausible.
 */
function subjunctiveOrthography(pack: LanguagePack): LintFinding[] {
  /** Suffixes each class must show, per persona. */
  const rules: Record<string, Partial<Record<(typeof PERSONAE)[number], string>>> = {
    gar: {
      yo: "gue",
      tu: "gues",
      el: "gue",
      nosotros: "guemos",
      vosotros: "guéis",
      ellos: "guen",
    },
    car: { nosotros: "quemos", vosotros: "quéis", ellos: "quen" },
    zar: { yo: "ce", tu: "ces", el: "ce", ellos: "cen", nosotros: "cemos", vosotros: "céis" },
  };

  const out: LintFinding[] = [];
  for (const verb of pack.verbs) {
    const suffix = /(gar|car|zar)$/.exec(verb.infinitive)?.[1];
    if (!suffix) continue;
    if (verb.pattern !== "ar") continue;
    const subjunctive = forms(verb, pack, "subjunctive");
    for (const [persona, ending] of Object.entries(rules[suffix]!)) {
      const form = subjunctive[persona] ?? "";
      if (form.endsWith(ending)) continue;
      out.push({
        rule: `subjunctive-${suffix}-orthography`,
        subject: verb.id,
        message: `${verb.id} is a -${suffix} verb, so its subjunctive ${persona} should end in "${ending}", but "${form}" does not.`,
        severity: "error",
      });
    }
  }
  return out;
}

/**
 * Every verb needs an explicit future stem.
 *
 * The future attaches to the whole infinitive, not to the short stem:
 * hablar + é = hablaré, not hablé. That is why `stemByTense` exists at all.
 *
 * A verb with neither `stemByTense.future` nor `irregular.future` falls back to
 * `stem`, which silently produces a truncated form. For encontrar that is
 * "encontré" -- which is its *preterite*, so the future and the preterite become
 * the same string and a learner drilling the future is told the wrong thing.
 * There is no exception: a Spanish infinitive's stem is always shorter than the
 * infinitive, so the fallback is always wrong.
 *
 * 34 of 60 verbs had no future stem. It went unnoticed because chapter 4 only
 * *displayed* the future for the 17 verbs it set up -- but the verb reference
 * page conjugates every tense of every verb, so it was visible there the whole
 * time.
 */
function missingFutureStem(pack: LanguagePack): LintFinding[] {
  return pack.verbs
    .filter((v) => !v.stemByTense?.["future"] && !v.irregular?.["future"])
    .map((v) => ({
      rule: "missing-future-stem",
      subject: v.id,
      message: `${v.id} has neither stemByTense.future nor irregular.future, so its future is built from the bare stem and comes out as "${forms(v, pack, "future")["yo"]}" rather than "${v.infinitive}é".`,
      severity: "error" as const,
    }));
}

/**
 * An -ir verb whose present diphthongates the third personae must diphthongate
 * them in the preterite too.
 *
 *   dormir   duermo, duermes, duerme, dormimos, dormís, duermen
 *            dormí, dormiste, DURMIÓ, dormimos, dormisteis, DURMIERON
 *   sentir   sienta ... / sintío, sintieron
 *   seguir   sigue ... / siguió, siguieron
 *
 * This is the one that got away: seguir had no preterite stem change, so it
 * produced *seguió* and *siguieron*, which look like real words and are not.
 * Only -ir verbs behave this way -- a -ar or -er stem changer drops the diphthong
 * in the preterite entirely (contar -> conté, contaron), so the rule is scoped to
 * -ir.
 *
 * Derived from the verb's own present data rather than a list, so it covers verbs
 * added later without being told about them.
 */
/**
 * An -ir verb that changes the stem on a persona in the present must change it
 * in the preterite too.
 *
 *   dormir   duerme, duermen   /   durmió, durmieron
 *   sentir   siente, sienten   /   sintió, sintieron
 *   servir   sirve, sirven     /   sirvió, sirvieron
 *   seguir   sigue, siguen     /   siguió, siguieron
 *
 * Only -ir verbs behave this way, and only in the third person. An -ar or -er
 * stem changer drops the diphthong in the preterite entirely: contar -> conté,
 * contaron. And an -ir verb's preterite yo and tú stay regular: duermo/durmí,
 * siento/sentí, pido/pedí. Both restrictions are load-bearing -- without them
 * this rule fires on dormir, pedir, sentir and contar, all of which are correct.
 *
 * The test is structural, not lexical: it strips every preterite override and asks
 * whether that persona's form then changes. Matching the diphthong as a substring
 * does not work, because the vowel moves -- dormir's preterite stem is "durm",
 * not "duerm", and venir's preterite is irregular throughout (viene -> vino).
 * A substring version of this rule false-positived on both.
 *
 * This found two real bugs. servir had no preterite stem change and produced
 * *servió*; seguir had none and produced *seguió*. Both look like real words,
 * which is why they shipped.
 */
function preteriteMissingStemChange(pack: LanguagePack): LintFinding[] {
  const out: LintFinding[] = [];
  for (const verb of pack.verbs) {
    if (verb.pattern !== "ir") continue;
    const present = verb.stemChanges?.["present"];
    if (!present) continue;

    // The verb with every preterite override removed, so we can see what the
    // preterite would fall back to.
    const withoutTense = (entries: Record<string, unknown> | undefined, tense: string) =>
      Object.fromEntries(Object.entries(entries ?? {}).filter(([k]) => k !== tense));

    const bare = {
      ...verb,
      stemChanges: withoutTense(verb.stemChanges as never, "preterite"),
      stemByTense: withoutTense(verb.stemByTense as never, "preterite"),
      irregular: withoutTense(verb.irregular as never, "preterite"),
    } as VerbEntry;

    const real = forms(verb, pack, "preterite");
    const fallback = forms(bare, pack, "preterite");
    const presentForms = forms(verb, pack, "present");

    // Only él and ellos. For an -ir verb the preterite yo and tú are regular
    // even where the present diphthongates: duermo/durmí, siento/sentí,
    // pido/pedí. Scoping to the third personae is what makes this rule true
    // rather than merely plausible.
    for (const persona of ["el", "ellos"] as const) {
      const stem = present[persona];
      if (stem === undefined || stem === verb.stem) continue;
      // Out of scope when the preterite already handles it, by any means.
      if (real[persona] !== fallback[persona]) continue;
      out.push({
        rule: "preterite-missing-stem-change",
        subject: verb.id,
        message: `${verb.id} changes the stem on ${persona} in the present ("${presentForms[persona]}") but not in the preterite ("${real[persona]}"). An -ir verb keeps the change in both.`,
        severity: "error",
      });
    }
  }
  return out;
}

/**
 * An -ar or -er verb must not diphthongise its subjunctive plural.
 *
 * The diphthong lands on the singular and on ellos, and nowhere else:
 *
 *   pensar   piense, pienses, piense, PENSEMOS, penséis, piensen
 *   querer   quiera, quieras, quiera, QUERAMOS, queráis, quieran
 *   poder    pueda, puedas, pueda, PODAMOS, podáis, puedan
 *
 * Scoped tightly to the diphthong, because the plural *does* legitimately differ
 * from the base stem in three other ways, each with its own rule: a written g
 * (tener -> tengamos), z to c (empezar -> empecemos), and qu (explicar ->
 * expliquemos). Comparing the plural against the plain stem would flag all of
 * those, and the first version of this rule did exactly that and produced
 * twenty-six false positives.
 *
 * -ir verbs are excluded because they split two ways: an e->ie -ir changes the
 * vowel to i (sentir -> sintamos) while an o->ue -ir keeps the diphthong
 * (dormir -> duermamos). Neither is reachable from the present stem, so there is
 * no single rule, and a wrong guess would be worse than none.
 *
 * This found three bugs -- *quieramos*, *puedamos* and *nos despiertamos* --
 * all of which were sitting in the golden subjunctive table, because that table
 * was generated from the engine rather than written first.
 */
function subjunctivePluralNotDiphthonged(pack: LanguagePack): LintFinding[] {
  const DIPHTHONG = /(ie|ue)/;
  const out: LintFinding[] = [];

  for (const verb of pack.verbs) {
    if (verb.pattern === "ir") continue;
    const changes = verb.stemChanges?.["subjunctive"];
    if (!changes) continue;

    const endings = pack.conjugation.tenses["subjunctive"]?.patterns[verb.pattern];
    const subjunctive = forms(verb, pack, "subjunctive");
    const singular = changes["el"] ?? verb.stem;
    // Only interesting when the singular is diphthonged at all.
    if (!DIPHTHONG.test(singular)) continue;

    for (const [index, persona] of ["nosotros", "vosotros"].entries()) {
      const i = index + 3;
      const stem = changes[persona];
      if (stem === undefined || stem !== singular) continue;
      out.push({
        rule: "subjunctive-plural-diphthonged",
        subject: verb.id,
        message: `${verb.id} is an -${verb.pattern} verb, so its subjunctive ${persona} must not carry the diphthong. It should be "${verb.stem}${endings?.[i] ?? ""}" but the stem is "${stem}" throughout.`,
        severity: "error",
      });
    }
  }
  return out;
}

/**
 * The affirmative imperative is derived, so a mismatch is a bug rather than a
 * judgement call.
 *
 * Two derivations, both exact for every verb except the listed irreducibles:
 *
 *   tu, vosotros        the present indicative, less its own ending
 *   el, nosotros, ellos  the present subjunctive
 *
 * This exists because getting it wrong is easy and invisible. Three ways it went
 * wrong while chapter 10 was written, each of which produced forms that parsed
 * and looked like plausible Spanish:
 *
 *   - "vosotros" derived as "minus the final -s" gives coméi and tenéi, because
 *     the vosotros accent sits mid-word. Twelve verbs, none of them looking like
 *     the same mistake twice.
 *   - "ten" derived as "tienes less -s" gives "tiene", which is not a word.
 *   - the -er/-ir stem changers need a j before the a/o of the imperative
 *     nosotros and ellos: tengamos, queramos, sigamos. A stemChange cannot
 *     express it, because the j belongs to the ending.
 *
 * The exception list is short and every entry is a fact about the language:
 * ser/ver have a vosotros present with no accent to strip, dar and ir reduce to
 * one letter, and tener loses a final vowel.
 */
function imperativeDerivation(pack: LanguagePack): LintFinding[] {
  const out: LintFinding[] = [];
  const rule = pack.conjugation.tenses["imperative"];
  if (!rule) return out;

  /** Where the derivation cannot hold, and why. */
  const IRREGULAR = new Set(["ser", "estar", "ir", "dar", "ver", "tener"]);

  const VOSOTROS: Record<string, [from: string, to: string]> = {
    ar: ["áis", "ad"],
    er: ["éis", "ed"],
    ir: ["ís", "id"],
  };

  for (const verb of pack.verbs) {
    if (IRREGULAR.has(verb.id) || verb.reflexivePronouns) continue;

    const present = forms(verb, pack, "present");
    const subj = forms(verb, pack, "subjunctive");
    const imperative = forms(verb, pack, "imperative");

    const expectedTu = (present["tu"] ?? "").replace(/s$/, "");
    if (imperative["tu"] !== expectedTu) {
      out.push({
        rule: "imperative-tu-not-present-minus-s",
        subject: verb.id,
        message: `${verb.id} imperative tú is "${imperative["tu"]}" but the present "${present["tu"]}" less its final -s gives "${expectedTu}".`,
        severity: "error",
      });
    }

    const vos = VOSOTROS[verb.pattern];
    if (vos && present["vosotros"]?.endsWith(vos[0])) {
      const expected = present["vosotros"]!.slice(0, -vos[0].length) + vos[1];
      if (imperative["vosotros"] !== expected) {
        out.push({
          rule: "imperative-vosotros-wrong-ending",
          subject: verb.id,
          message: `${verb.id} imperative vosotros is "${imperative["vosotros"]}" but "${present["vosotros"]}" less "-${vos[0]}" plus "-${vos[1]}" gives "${expected}".`,
          severity: "error",
        });
      }
    }

    for (const persona of ["el", "nosotros", "ellos"] as const) {
      if (imperative[persona] !== subj[persona]) {
        out.push({
          rule: "imperative-not-subjunctive",
          subject: verb.id,
          message: `${verb.id} imperative ${persona} is "${imperative[persona]}" but the present subjunctive is "${subj[persona]}".`,
          severity: "error",
        });
      }
    }

    // Spanish has no first-person imperative, so the tense declares it as null.
    // A form here means something has filled the gap in.
    if (verb.irregular?.["imperative"]?.["yo"]) {
      out.push({
        rule: "imperative-has-yo-form",
        subject: verb.id,
        message: `${verb.id} gives a yo imperative ("${verb.irregular["imperative"]["yo"]}") but Spanish has no first-person imperative: an order to yourself is not an order.`,
        severity: "error",
      });
    }
  }
  return out;
}

export function lintPack(pack: LanguagePack): LintFinding[] {
  return [
    ...duplicateWordValues(pack),
    ...orphanVerbWords(pack),
    ...presentStemChangeOnPlural(pack),
    ...preteriteMissingStemChange(pack),
    ...subjunctiveOrthography(pack),
    ...subjunctivePluralNotDiphthonged(pack),
    ...missingFutureStem(pack),
    ...imperativeDerivation(pack),
  ];
}
