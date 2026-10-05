/**
 * One-off content edit: two wrong subjunctive plurals, and the rule behind them.
 *
 * Checking `pensar` against the RAE turned up a rule I had asserted backwards,
 * and the same bug was already sitting in `sentir`.
 *
 * For an -ar or -er stem changer, the subjunctive plural is REGULAR. The
 * diphthong is on the singular and on ellos, and nowhere else:
 *
 *   pensar   piense, pienses, piense, PENSEMOS, penséis, piensen
 *   querer   quiera, quieras, quiera, QUERAMOS, queráis, quieran
 *
 * -ir verbs are different in two separate ways, which is why this is worth
 * stating rather than generalising:
 *
 *   e -> ie    sentir   sienta, sientas, sienta, SINTAMOS, sintáis, sientan
 *   e -> ie    pedir    pida, pidas, pida, PIDAMOS, pidáis, pidan
 *   o -> ue    dormir   duerma, duermas, duerma, DUERMAMOS, duermáis, duerman
 *
 * So an e->ie -ir drops the diphthong *and* changes the vowel to i, while an
 * o->ue -ir keeps the diphthong. Neither is reachable from the present stem.
 *
 * The pack had uniform "piens" for pensar, giving *piensemos*, and uniform
 * "sient" for sentir, giving *sientamos*. Both wrong. My golden subjunctive
 * table had been generated from the engine, so it recorded the wrong value and
 * passed -- which is exactly the weakness that table was built with a caveat
 * about.
 *
 * Run with: bun scripts/fix-subjunctive-plurals.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const P = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];

/** Dipthhonged on the singular and ellos, plain stem on the two plurals. */
const onFour = (dip: string, plain: string) =>
  Object.fromEntries(P.map((p) => [p, p === "nosotros" || p === "vosotros" ? plain : dip]));

const pensar = pack.verbs.find((v) => v.infinitive === "pensar");
if (!pensar) throw new Error("pensar missing");
pensar.stemChanges = {
  ...(pensar.stemChanges ?? {}),
  subjunctive: onFour("piens", "pens"),
};
pensar.notes =
  "e becomes ie in the present, on the singular and ellos only: pienso, piensas, piensa, PENSAMOS, pensáis, piensan. The subjunctive is the same shape: piense, pienses, piense, PENSEMOS, penséis, piensen.";

const sentir = pack.verbs.find((v) => v.infinitive === "sentir");
if (!sentir) throw new Error("sentir missing");
sentir.stemChanges = {
  ...(sentir.stemChanges ?? {}),
  subjunctive: onFour("sient", "sint"),
};
sentir.notes =
  "An e->ie -ir verb, which behaves differently again in the subjunctive plural: sita, sietas, sienta, SINTAMOS, sintáis, sientan. The i replaces the ie rather than keeping it.";

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log("corrected the subjunctive plurals of pensar and sentir");
