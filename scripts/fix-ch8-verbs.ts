/**
 * One-off content edit: fix what the lint caught in Chapter 8's new verbs.
 *
 * The lint did its job on its first run against this content.
 *
 *   pensar  The present stem change cannot be uniform. Spanish never changes the
 *           stem on nosotros or vosotros in the present indicative, so
 *           *piensamos* and *piensáis* are wrong -- it is *pensamos* and
 *           *pensáis*. The subjunctive is the opposite case and uniform is
 *           correct there: piense, pienses, piense, PENSEMOS, penséis, piensen.
 *           Two different shapes for two tenses of one verb.
 *
 *   creer, pensar, dudar, opinar
 *           All four needed a future stem. The future attaches to the whole
 *           infinitive, so the fallback to the bare stem gave *creé*, *pensé*,
 *           *dudé* and *opiné* -- the first three of which collide with their
 *           own preterites.
 *
 * Run with: bun scripts/fix-ch8-verbs.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const P = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];

/** The diphthong on the singular and ellos, plain stem on the two plurals. */
const onFour = (dip: string, plain: string) =>
  Object.fromEntries(P.map((p) => [p, p === "nosotros" || p === "vosotros" ? plain : dip]));

/** Uniform across all six, which is right for a subjunctive diphthong. */
const onAll = (stem: string) => Object.fromEntries(P.map((p) => [p, stem]));

const pensar = pack.verbs.find((v) => v.infinitive === "pensar");
if (!pensar) throw new Error("pensar missing");
pensar.stemChanges = {
  present: onFour("piens", "pens"),
  subjunctive: onAll("piens"),
};
pensar.notes =
  "e becomes ie in the present, on the singular and ellos only: pienso, piensas, piensa, PENSAMOS, pensáis, piensan. The subjunctive changes all six: piense, pienses, piense, pensemos, penséis, piensen.";

let futures = 0;
for (const verb of pack.verbs) {
  if (verb.stemByTense?.future || verb.irregular?.future) continue;
  const base = verb.reflexivePronouns ? verb.infinitive.replace(/se$/, "") : verb.infinitive;
  verb.stemByTense = { ...(verb.stemByTense ?? {}), future: base, conditional: base };
  futures++;
}

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`pensar stems corrected; ${futures} future stem(s) added`);
