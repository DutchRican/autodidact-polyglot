/**
 * One-off content edit: derive every verb's imperative from the pack's own data.
 *
 * The previous attempt wrote stemChanges by hand and got the -er/-ir set wrong:
 * those verbs need j before the a/o of the imperative nosotros and ellos
 * (tenga, tenga-mos,queramos), which a stemChange cannot express, because the
 * j belongs to the ending rather than to the stem. The hand-written version
 * produced "tenemos" and "quere" -- both plausible and both wrong.
 *
 * The imperative is not an independent system, though. Two derivations, both of
 * which hold for every verb in the pack except where a form is genuinely
 * irregular:
 *
 *   tu, vosotros   the present indicative minus the final -s
 *                  hablas -> habla,  comeis -> comed
 *
 *   el, nosotros, ellos   the present subjunctive
 *                  hable, hablemos, hablen
 *
 * So rather than hand-writing stems, this script reads the two tenses the pack
 * already holds and copies the forms across. Anything that cannot be copied is a
 * real irregular, and is listed explicitly below rather than guessed.
 *
 * The five genuine irregular imperatives (textbook six, minus haber which is not
 * in the pack):
 *
 *   ser    se,  sea,   seamos,   sed,    sean
 *   estar  esta, este,  estemos,  estad,  esten
 *   ir     ve,  vaya,  vayamos,  ved,    vayan
 *   dar    da,  de,    demos,    ded,    den
 *
 * saber is not among them -- sabe/sepa/sepamos/sabed/sepan is fully regular.
 *
 * The negatives (no hable, no comamos) are the subjunctive plus "no" and are
 * taught in chapter 10 rather than modelled as a tense.
 *
 * Run with: bun scripts/add-imperative-forms.ts
 */
import { loadPack } from "../src/engine/content.ts";
import { conjugate } from "../src/engine/conjugation.ts";

const file = "content/es.json";
const pack = await loadPack(file);
const rules = pack.conjugation;

const IMPERATIVE = "imperative";
const P = ["tu", "el", "nosotros", "vosotros", "ellos"] as const;

/**
 * Present indicative minus the final -s: hablas -> habla, comes -> come.
 *
 * This is right for tú in every pattern. It is NOT how vosotros works, because
 * the vosotros ending carries the accent in the middle of the word: coméis
 * minus its final "s" leaves "coméi", which is not a Spanish form. So vosotros
 * is handled by its own ending, below.
 */
const dropFinalS = (form: string | undefined): string | undefined =>
  form && form.endsWith("s") ? form.slice(0, -1) : form;

/**
 * Present vosotros minus its own ending, plus the imperative ending.
 *
 *   -ar   habláis -> habl + ad -> hablad
 *   -er   coméis  -> com  + ed -> comed
 *   -ir   vivís   -> viv  + id -> vivid
 *
 * The first version of this script used dropFinalS here too and produced
 * "coméi", "tenéi" and "decí" for twelve verbs -- forms that look like typos
 * rather than like a systematically wrong rule, which is the worst kind.
 */
const VOSOTROS: Record<string, { from: string; to: string }> = {
  ar: { from: "áis", to: "ad" },
  er: { from: "éis", to: "ed" },
  ir: { from: "ís", to: "id" },
};

const vosotrosImperative = (
  form: string | undefined,
  pattern: string,
): string | undefined => {
  const rule = VOSOTROS[pattern];
  if (!form || !rule) return undefined;
  if (!form.endsWith(rule.from)) {
    throw new Error(`vosotros "${form}" does not end in "${rule.from}" for -${pattern}`);
  }
  return form.slice(0, -rule.from.length) + rule.to;
};

/**
 * The imperative el/nosotros/ellos equals the present subjunctive, except where
 * the subjunctive's own stem has a j or a diphthong that the imperative shares
 * -- which the copy handles, because it copies the form and not the stem.
 */
const IRREGULAR: Record<string, Record<string, string>> = {
  // sé / dé take an accent the regular forms would not: without it the stress
  // would fall on the final syllable. da and ve do not, because the stress is
  // already on the first.
  ser: { tu: "sé", el: "sea", nosotros: "seamos", vosotros: "sed", ellos: "sean" },
  estar: { tu: "está", el: "esté", nosotros: "estemos", vosotros: "estad", ellos: "estén" },
  // The derivation gets almost every stem changer right -- puedes -> puede,
  // vienes -> ven, hueles -> huele -- because the diphthong means the present tú
  // does not end in a plain -es. tener is the exception: "tienes" less its -s is
  // "tiene", but the imperative is "ten", with no final vowel at all.
  tener: { tu: "ten", el: "tenga", nosotros: "tengamos", vosotros: "tened", ellos: "tengan" },
  ir: { tu: "ve", el: "vaya", nosotros: "vayamos", vosotros: "ved", ellos: "vayan" },
  dar: { tu: "da", el: "dé", nosotros: "demos", vosotros: "ded", ellos: "den" },
  // Listed with them because its vosotros form cannot be derived: the present is
  // "veis", which carries no accent at all, so there is no -éis ending to strip.
  // The imperative is "ved", which is also the only -er verb not ending in -ed.
  ver: { tu: "ve", el: "vea", nosotros: "veamos", vosotros: "ved", ellos: "vean" },
};

let copied = 0;
const irregular: string[] = [];
const skipped: string[] = [];

for (const verb of pack.verbs) {
  const present = conjugate(verb, rules, "present").forms;
  const subj = conjugate(verb, rules, "subjunctive").forms;

  // Listed before the derivations run, because a listed verb's forms are
  // written out and the derivations would either contradict them or refuse.
  const overrides = IRREGULAR[verb.id];
  if (overrides) {
    irregular.push(verb.id);
    if (!verb.irregular) verb.irregular = {};
    verb.irregular[IMPERATIVE] = overrides;
    continue;
  }

  // A reflexives' pronoun rides in front in the present and the subjunctive but
  // attaches to the end in the imperative: "levantate", not "te levanta".
  // The data model prepends, so these are written out in full instead.
  if (verb.reflexivePronouns) {
    skipped.push(verb.id);
    continue;
  }

  const derived: Record<string, string> = {};
  derived["tu"] = dropFinalS(present["tu"]) ?? "";
  derived["vosotros"] = vosotrosImperative(present["vosotros"], verb.pattern) ?? "";
  derived["el"] = subj["el"] ?? "";
  derived["nosotros"] = subj["nosotros"] ?? "";
  derived["ellos"] = subj["ellos"] ?? "";

  // Copy the forms as full overrides rather than as stems: the derivation is a
  // fact about whole forms, and stems cannot express the j of "tengamos".
  if (!verb.irregular) verb.irregular = {};
  verb.irregular[IMPERATIVE] = Object.fromEntries(
    P.map((p) => [p, derived[p]]).filter(([, v]) => v),
  );
  copied++;
}

// Reflexives: written by hand, because the pronoun attaches at the end and the
// accent moves with it. levántate, not te levanta / te levanta.
const REFLEXIVE_IMPERATIVE: Record<string, Record<string, string>> = {
  levantarse: {
    tu: "levántate",
    el: "levántate",
    nosotros: "levantémonos",
    vosotros: "levantad",
    ellos: "levántense",
  },
  ducharse: {
    tu: "dúchate",
    el: "dúchate",
    nosotros: "duchémonos",
    vosotros: "duchad",
    ellos: "dúchense",
  },
  acostarse: {
    tu: "acuéstate",
    el: "acuéstate",
    nosotros: "acostémonos",
    vosotros: "acostad",
    ellos: "acuéstense",
  },
  quedarse: {
    tu: "quédate",
    el: "quédate",
    nosotros: "quedémonos",
    vosotros: "quedad",
    ellos: "quédense",
  },
  acordarse: {
    tu: "acuérdate",
    el: "acuérdate",
    nosotros: "acordémonos",
    vosotros: "acordad",
    ellos: "acuérdense",
  },
  olvidarse: {
    tu: "olvídate",
    el: "olvídate",
    nosotros: "olvidémonos",
    vosotros: "olvidad",
    ellos: "olvídense",
  },
  aburrirse: {
    tu: "abúrrete",
    el: "abúrrete",
    nosotros: "aburrámonos",
    vosotros: "aburrid",
    ellos: "abúrranse",
  },
  despertarse: {
    tu: "despiértate",
    el: "despiértate",
    nosotros: "despertémonos",
    vosotros: "despertad",
    ellos: "despiétense",
  },
};

for (const [id, forms] of Object.entries(REFLEXIVE_IMPERATIVE)) {
  const verb = pack.verbs.find((v: { id: string }) => v.id === id);
  if (!verb) throw new Error(`no verb "${id}"`);
  if (!verb.irregular) verb.irregular = {};
  verb.irregular[IMPERATIVE] = forms;
  // The engine prepends `reflexivePronouns` to every form, including overrides,
  // which would give "te levántate". The imperative is the one tense where the
  // pronoun goes on the end, so the pronoun is suppressed here and the form
  // carries it itself.
  verb.reflexivePronounsIn = { ...(verb.reflexivePronounsIn ?? {}), imperative: false };
  skipped.push(id);
}

// Drop the stemChanges the hand-written pass added, which were partly wrong.
let cleared = 0;
for (const verb of pack.verbs) {
  if (verb.stemChanges?.["imperative"]) {
    delete verb.stemChanges["imperative"];
    cleared++;
  }
}

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(
  `imperative written for ${pack.verbs.length} verbs: ${copied} derived, ` +
    `${irregular.length} irregular (${irregular.join(", ")}), ` +
    `${skipped.length} reflexives; ${cleared} bad stem changes removed`,
);
