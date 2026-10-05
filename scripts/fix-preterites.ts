/**
 * One-off content edit: fix two wrong preterites found by auditing all 60 verbs
 * across every tense.
 *
 *   seguir  el/ellos took the plain stem, giving *seguió* and *siguieron*. The
 *           third personae diphthong in the preterite too, like the present:
 *           siguió, siguieron.
 *
 *   traer   fully irregular preterite, and the pack had none: traí, traiste,
 *           traió, traimos, traisteis, traieron. Those are the *future*'s shapes
 *           leaking in, which is the signature of the missing-future-stem bug
 *           fixed in add-future-stems.ts showing up in a second place.
 *
 * The imperfect was audited at the same time and is correct for all 60 verbs —
 * Spanish never stem-changes there, so nothing needed doing.
 *
 * Run with: bun scripts/fix-preterites.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const seguir = pack.verbs.find((v) => v.infinitive === "seguir");
if (!seguir) throw new Error("seguir missing");
seguir.stemChanges = {
  ...(seguir.stemChanges ?? {}),
  preterite: {
    yo: "segu",
    tu: "segu",
    el: "sigu",
    nosotros: "segu",
    vosotros: "segu",
    ellos: "sigu",
  },
};
seguir.notes =
  "e becomes ie on tú, él and ellos in the present and the preterite: sigo, sigues, sigue, seguimos, seguís, siguen / seguí, seguiste, siguió, seguimos, seguisteis, siguieron. The subjunctive drops the u instead: siga, sigas, siga, sigamos, sigáis, sigan.";

const traer = pack.verbs.find((v) => v.infinitive === "traer");
if (!traer) throw new Error("traer missing");
traer.irregular = {
  ...(traer.irregular ?? {}),
  preterite: {
    yo: "traje",
    tu: "trajiste",
    el: "trajo",
    nosotros: "trajimos",
    vosotros: "trajisteis",
    ellos: "trajeron",
  },
};
traer.notes =
  "Only yo breaks in the present (traigo). Fully irregular in the preterite: traje, trajiste, trajo, trajimos, trajisteis, trajeron.";

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log("fixed the preterites of seguir and traer");
