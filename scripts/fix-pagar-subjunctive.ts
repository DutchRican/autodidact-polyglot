/**
 * One-off content edit: fix `pagar`'s subjunctive ellos.
 *
 * The pack had `pagen`, which is wrong: a -gar verb's subjunctive ellos is
 * `paguen`, gu included. This is the same form as `lleguen` in the chapter 9
 * readings, so chapter 9 and the verb reference were contradicting each other.
 *
 * The bug survived because of a lint rule that asserted the opposite -- it
 * claimed the ellos form takes no gu -- and that rule only ever looked at
 * ellos, so it never checked the five personae where the gu does show. The
 * rule has been replaced (see src/engine/lint.ts) and this is the finding it
 * now produces.
 *
 * `pagar` is written out in full in the pack because the qu/gu insertion lives
 * in the endings rather than the stem, so the engine cannot derive it.
 *
 * Run with: bun scripts/fix-pagar-subjunctive.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const pagar = pack.verbs.find((v: { id: string }) => v.id === "pagar");
if (!pagar) throw new Error("no verb \"pagar\"");
if (!pagar.irregular) pagar.irregular = {};
pagar.irregular["subjunctive"] = {
  yo: "pague",
  tu: "pagues",
  el: "pague",
  nosotros: "paguemos",
  vosotros: "paguéis",
  ellos: "paguen",
};
pagar.notes = "A -gar verb, so the subjunctive writes gu before e on all five personae: paguen, paguemos.";

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log("pagar subjunctive ellos: pagen -> paguen");
