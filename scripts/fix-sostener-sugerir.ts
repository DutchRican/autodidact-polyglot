/**
 * One-off content edit: finish `sostener` and `sugerir`.
 *
 * Both were left half-specified and the golden tables caught it, which is the
 * tables doing their job: neither error was visible from the pack alone.
 *
 * 1. `sostener` had its stemChanges deleted in fix-ch9-verbs.ts, on the grounds
 *    that a subjunctive block spelling out six forms identical to the regular
 *    path was redundant. That was half right -- the subjunctive block was
 *    redundant, but the *present* block was not, and deleting the object took
 *    both. It was generating "sosteno" and "sostenen".
 *
 * 2. `sugerir` was marked present-only, so it came out as "sugero" / "sugieres".
 *    e -> ie reaches yo for these verbs: sugiero, sugieres, sugiere. And the
 *    subjunctive takes the change across all six personae, with nosotros and
 *    vosotros on the plain stem: sugiera, sugieras, sugiera, sugiramos,
 *    sugierais, sugieran. Same shape as sentir, which is already in the pack.
 *
 * Run with: bun scripts/fix-sostener-sugerir.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const verb = (id: string) => {
  const found = pack.verbs.find((v: { id: string }) => v.id === id);
  if (!found) throw new Error(`no verb "${id}"`);
  return found;
};

// e -> ie on yo, tu, el, ellos in the present; g-insertion on top at yo.
verb("sostener").stemChanges = {
  present: {
    yo: "sosten",
    tu: "sostien",
    el: "sostien",
    nosotros: "sosten",
    vosotros: "sosten",
    ellos: "sostien",
  },
};

// e -> ie on the singular and ellos in the present, and on el and ellos in the
// preterite (sugirió). nosotros and vosotros are regular in both.
verb("sugerir").stemChanges = {
  present: {
    yo: "sugier",
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
  subjunctive: {
    yo: "sugier",
    tu: "sugier",
    el: "sugier",
    nosotros: "sugir",
    vosotros: "sugir",
    ellos: "sugier",
  },
};

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log("sostener and sugerir stems completed");
