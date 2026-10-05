/**
 * One-off content edit: fix the two verbs add-ch9-verbs-and-status.ts got wrong.
 *
 * The lint found both, which is the second time it has earned its keep on verbs
 * added in the same session as the rule: a new verb is exactly the case where
 * the author's memory of the pattern is least reliable.
 *
 * 1. `sugerir` is an -ir verb, so it keeps the e->ie change in the preterite
 *    too: sugirió, sugirieron. I had written the present change only, and
 *    preterite-missing-stem-change caught it.
 *
 * 2. `llegar` is a -gar verb, so the subjunctive plural needs a written u
 *    before the ending: lleguemos, lleguéis. The u lives in the endings rather
 *    than the stem, exactly as in pagar, so this needs full-form overrides.
 *
 * The subjunctive stemChanges block I put on `sostener` in the previous script is
 * also removed. It spelled out six forms identical to the regular path, which
 * is noise in the data and a second place for a future edit to go wrong.
 *
 * Run with: bun scripts/fix-ch9-verbs.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const set = (id: string, patch: Record<string, unknown>) => {
  const verb = pack.verbs.find((v: { id: string }) => v.id === id);
  if (!verb) throw new Error(`no verb "${id}"`);
  Object.assign(verb, patch);
  return verb;
};

// 1. sugerir keeps the diphthong in the preterite too.
const sugerir = set("sugerir", {
  stemChanges: {
    present: {
      yo: "suger",
      tu: "sugier",
      el: "sugier",
      nosotros: "suger",
      vosotros: "suger",
      ellos: "sugier",
    },
    preterite: {
      yo: "suger",
      tu: "suger",
      el: "sugier",
      nosotros: "suger",
      vosotros: "suger",
      ellos: "sugier",
    },
  },
  notes:
    "e becomes ie on tu, el and ellos in the present, and on el and ellos in the preterite: sugirió. nosotros and vosotros are regular in both.",
});

// 2. llegar is -gar: the subjunctive needs gu everywhere, and the nosotros and
// vosotros forms need it written rather than inferred.
const llegar = set("llegar", {
  irregular: {
    present: { yo: "llego" },
    subjunctive: {
      yo: "llegue",
      tu: "llegues",
      el: "llegue",
      nosotros: "lleguemos",
      vosotros: "lleguéis",
      ellos: "lleguen",
    },
  },
  notes: "A -gar verb, so the subjunctive writes gu before e: llegue, lleguemos.",
});

// 3. Drop the redundant subjunctive stems on sostener.
set("sostener", { stemChanges: undefined });
delete pack.verbs.find((v: { id: string }) => v.id === "sostener").stemChanges;

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
void sugerir;
void llegar;
console.log("fixed sugerir, llegar, and cleaned sostener");
