/**
 * One-off fix: stem-changing and fully irregular present forms for the
 * Chapter 2 verbs.
 *
 * The engine happily generated "queres" and "dece" because nothing in the data
 * said otherwise. These verbs either change their stem (e -> ie in querer,
 * e -> i in decir) or don't follow any pattern at all (ver), so the data has to
 * say so. Regular -er endings produce "vees" for ver, which is wrong.
 *
 * Run with: bun scripts/fix-ch2-stems.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();

const patch = (
  id: string,
  changes: Record<string, unknown>,
): void => {
  const verb = f.verbs.find((v) => v.id === id);
  if (!verb) throw new Error(`no verb ${id}`);
  Object.assign(verb, changes);
};

// querer: e -> ie on tu / el / ellos only. nosotros and vosotros are unaffected.
patch("querer", {
  irregular: { present: { yo: "quiero" } },
  stemChanges: { present: { tu: "quier", el: "quier", ellos: "quier" } },
});

// decir: e -> i on tu / el / ellos, plus a g-form for yo and three irregulars.
patch("decir", {
  irregular: { present: { yo: "digo", nosotros: "decimos", vosotros: "decís" } },
  stemChanges: { present: { tu: "dic", el: "dic", ellos: "dic" } },
});

// ver: no pattern survives contact with the endings — spell all six out.
patch("ver", {
  irregular: {
    present: {
      yo: "veo",
      tu: "ves",
      el: "ve",
      nosotros: "vemos",
      vosotros: "veis",
      ellos: "ven",
    },
  },
});

// poder and venir: e -> ie on tu / el / ellos, like querer.
patch("poder", {
  irregular: { present: { yo: "puedo" } },
  stemChanges: { present: { tu: "pued", el: "pued", ellos: "pued" } },
});

patch("venir", {
  irregular: { present: { yo: "vengo" } },
  stemChanges: { present: { tu: "vien", el: "vien", ellos: "vien" } },
});

// dar is fully irregular: the vosotros form takes no accent, unlike dáis in
// every other verb.
patch("dar", {
  irregular: { present: { yo: "doy", vosotros: "dais" } },
});

// acostarse is stem-changing like acostar. Here the yo form changes too
// (me acuesto), unlike querer where yo is the odd one out with quiero.
patch("acostarse", {
  stemChanges: {
    present: { yo: "acuest", tu: "acuest", el: "acuest", ellos: "acuest" },
  },
});

await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log("patched: querer, decir, ver, poder, venir, dar, acostarse");
