/**
 * One-off content edit: three corrections to chapter 9's new verbs.
 *
 * Each of these was wrong on the first pass and is now pinned in data.
 *
 * 1. `llegar` subjunctive ellos is `lleguen`, not `lleguen` with a gu. The lint
 *    rule said so and I argued with it. The gu insertion belongs on nosotros
 *    and vosotros only: lleguemos, lleguéis, and then the g falls before e.
 *
 * 2. `sostener` needs g-insertion on yo, so `sostengo` not `sosteno`. Same
 *    mechanism as tener and hacer, spelled the way those are: an explicit yo
 *    form rather than a stem, because the inserted g is not part of the stem.
 *
 * 3. `impedir` is an orthographic e->i verb, not a stem changer: impido,
 *    impide, impide, impedimos, impedís, impiden. And like the other e->i -ir
 *    verbs it takes the change in the preterite third person too -- impidió,
 *    impidieron -- and across the whole subjunctive: impida, impidamos.
 *    The imperfect stays regular, which is the one place nothing happens.
 *
 * Run with: bun scripts/fix-ch9-verbs-2.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const verb = (id: string) => {
  const found = pack.verbs.find((v: { id: string }) => v.id === id);
  if (!found) throw new Error(`no verb "${id}"`);
  return found;
};

// 1. The gu insertion is nosotros/vosotros only.
verb("llegar").irregular.subjunctive.ellos = "lleguen";

// 2. g-insertion on yo. An explicit form, matching tener/poder.
verb("sostener").irregular = { present: { yo: "sostengo" } };

// 3. impedir: e -> i, everywhere the spelling demands it and nowhere else.
const impedir = verb("impedir");
impedir.stemChanges = {
  present: {
    yo: "impid",
    tu: "impid",
    el: "impid",
    nosotros: "imped",
    vosotros: "imped",
    ellos: "impid",
  },
  preterite: {
    yo: "imped",
    tu: "imped",
    el: "impid",
    nosotros: "imped",
    vosotros: "imped",
    ellos: "impid",
  },
  subjunctive: {
    yo: "impid",
    tu: "impid",
    el: "impid",
    nosotros: "impid",
    vosotros: "impid",
    ellos: "impid",
  },
};
impedir.notes =
  "e becomes i on tu, el and ellos in the present, on el and ellos in the preterite (impidió), and across the whole subjunctive. The imperfect is regular: impedía.";

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log("fixed llegar, sostener, impedir");
