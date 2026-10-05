/**
 * One-off content edit: add the present subjunctive as a sixth tense.
 *
 * Chapter 8 teaches it. It has been a known gap: `ojalá` and `esperar que`
 * appear in a chapter 4 reading and are never explained.
 *
 * The endings fit the existing three-pattern model with no engine change.
 * Present subjunctive:
 *   -ar   e, es, e, emos, éis, en      (hable, hables, hable, ...)
 *   -er   a, as, a, amos, áis, an      (tenga, tengas, tenga, ...)
 *   -ir   a, as, a, amos, áis, an      (pida, pidas, pida, ...) -- same as -er
 *
 * Stem changers need attention, and this is the part that bites. The present
 * subjunctive uses the diphthong on ALL personae where the indicative uses it on
 * four:
 *
 *   pensar  indicative  pienso, piensas, piensa, pensamos, pensáis, piensan
 *            subjunctive  piense, pienses, piense, pensemos, penséis, piensen
 *
 * so the stem change moves from four personae to six. `-ir` stem changers keep
 * the same stem as the indicative (dormir -> duerma, not duerma/durmamos
 * mishmash), while -ar/-er ones add the diphthong that the indicative omits on
 * nosotros and vosotros. Both are expressed with stemChanges.subjunctive.
 *
 * Run with: bun scripts/add-subjunctive.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

if (!pack.conjugation.tenses.subjunctive) {
  // Display order matters: the views render tenses in this sequence.
  pack.conjugation.tenses.subjunctive = {
    label: "Present subjunctive (presente de subjuntivo)",
    labelTranslations: { en: "Present subjunctive (presente de subjuntivo)" },
    patterns: {
      ar: ["e", "es", "e", "emos", "éis", "en"],
      er: ["a", "as", "a", "amos", "áis", "an"],
      ir: ["a", "as", "a", "amos", "áis", "an"],
    },
  };
  // Reorder so subjunctive lands after imperfect, before future: the indicative
  // moods together, then the non-finite ones.
  const order = [
    "present",
    "preterite",
    "imperfect",
    "subjunctive",
    "future",
    "conditional",
  ];
  pack.conjugation.tenses = Object.fromEntries(
    order.filter((k) => pack.conjugation.tenses[k]).map((k) => [k, pack.conjugation.tenses[k]]),
  );
}

/**
 * The diphthong on all six personae, for verbs whose stem changes in the present.
 * `all` is a convenience: six identical entries.
 */
const ALL = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];
const onAll = (stem: string) => Object.fromEntries(ALL.map((p) => [p, stem]));

/** Present subjunctive stems, where they differ from the plain stem. */
const subjunctiveStems: Record<string, string> = {
  // e -> ie, and unlike the indicative this covers nosotros and vosotros too.
  pensar: "piens",
  querer: "quier",
  poder: "pued",
  // o -> ue, same shape.
  dormir: "duerm",
  morir: "muer",
  // u -> ue. contar -> cuente; the indicative also drops the u.
  contar: "cuent",
  encontrar: "cuent",
  // e -> ie on -ir verbs, matching the indicative's stem.
  pedir: "pid",
  mentir: "mient",
  sentir: "sient",
  // o -> ue on -ir verbs.
  volver: "vuelv",
  // e -> ie on -ar.
  negar: "nieg",
  // Common spellings that are not derivable from the stem.
  saber: "sep",
  haber: "hay",
  ir: "vay",
  estar: "est",
  dar: "d",
};

let changed = 0;
for (const verb of pack.verbs) {
  const stem = subjunctiveStems[verb.infinitive];
  if (!stem) continue;
  verb.stemChanges = { ...(verb.stemChanges ?? {}), subjunctive: onAll(stem) };
  changed++;
}

// Reflexives conjugate the same but carry their pronoun; the engine adds the
// prefix, so nothing extra is needed for them beyond the stem.
await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`tense added; ${changed} verbs given a subjunctive stem`);
