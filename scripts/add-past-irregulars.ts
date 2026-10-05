/**
 * One-off content edit: irregular past-tense forms, plus three stem-changing
 * -ir verbs for Chapter 3.
 *
 * The preterite is where Spanish stops being mechanical. The engine will happily
 * build "só" from ser and "sió" from ver, because nothing in the data says
 * otherwise — so the data has to say so, tense by tense.
 *
 * Run with: bun scripts/add-past-irregulars.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const verb = (id: string) => {
  const found = f.verbs.find((v) => v.id === id);
  if (!found) throw new Error(`no verb ${id}`);
  return found;
};

const P = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"] as const;
type Six = [string, string, string, string, string, string];

/** Full preterite tables, in persona order. */
const PRETERITE: Record<string, Six> = {
  // ser and ir are identical in the preterite — the textbook tell.
  ser: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
  ir: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
  estar: ["estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron"],
  tener: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"],
  hacer: ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"],
  decir: ["dije", "dijiste", "dijo", "dijimos", "dijisteis", "dijeron"],
  poder: ["pude", "pudiste", "pudo", "pudimos", "pudisteis", "pudieron"],
  poner: ["puse", "pusiste", "puso", "pusimos", "pusisteis", "pusieron"],
  venir: ["vine", "viniste", "vino", "vinimos", "vinisteis", "vinieron"],
  ver: ["vi", "viste", "vio", "vimos", "visteis", "vieron"],
  dar: ["di", "diste", "dio", "dimos", "disteis", "dieron"],
  saber: ["supe", "supiste", "supo", "supimos", "supisteis", "supieron"],
  querer: ["quise", "quisiste", "quiso", "quisimos", "quisisteis", "quisieron"],
  salir: ["salí", "saliste", "salió", "salimos", "salisteis", "salieron"],
  // leer is regular-looking and then isn't: the yo and vosotros take í, the
  // third person takes y, and leímos keeps the accent.
  leer: ["leí", "leíste", "leyó", "leímos", "leísteis", "leyeron"],
};

/** Only the imperfects that are irregular. Everything else follows the rule. */
const IMPERFECT: Record<string, Six> = {
  ser: ["era", "eras", "era", "éramos", "erais", "eran"],
  ir: ["iba", "ibas", "iba", "íbamos", "ibais", "iban"],
  ver: ["veía", "veías", "veía", "veíamos", "veíais", "veían"],
};

for (const [id, forms] of Object.entries(PRETERITE)) {
  const v = verb(id);
  v.irregular = { ...(v.irregular ?? {}), preterite: Object.fromEntries(P.map((p, i) => [p, forms[i]!])) };
}
for (const [id, forms] of Object.entries(IMPERFECT)) {
  const v = verb(id);
  v.irregular = { ...(v.irregular ?? {}), imperfect: Object.fromEntries(P.map((p, i) => [p, forms[i]!])) };
}

verb("ser").notes =
  "Fully irregular in both past tenses. The preterite is identical to ir: fui, fuiste, fue. In the imperfect it splits from ir: yo era, yo iba.";
verb("ir").notes =
  "Fully irregular in both past tenses. Its preterite is identical to ser; the imperfect differs (iba, not era).";
verb("leer").notes =
  "Regular in the present but irregular in the preterite: leí, leíste, leyó, leímos, leísteis, leyeron.";
verb("tener").notes = "Only yo breaks in the present (tengo), but the whole preterite changes.";

// Three stem-changing -ir verbs. The change hits el and ellos in the present,
// and only the third person in the preterite.
const have = new Set(f.verbs.map((v) => v.id));
const newVerbs = [
  {
    id: "dormir",
    infinitive: "dormir",
    stem: "dorm",
    pattern: "ir",
    en: "to sleep",
    present: ["duerm", "duerm", "duerm", "duerm"],
    preterite: ["durm", "durm"],
    notes:
      "Present: duermo, duermes, duerme, dormimos, dorméis, duermen. Preterite: only él and ellos change — durmió, durmieron.",
    example: "Duermo ocho horas.",
    exampleEn: "I sleep eight hours.",
  },
  {
    id: "pedir",
    infinitive: "pedir",
    stem: "ped",
    pattern: "ir",
    en: "to ask for / to request",
    present: ["pid", "pid", "pid", "pid"],
    preterite: ["pid", "pid"],
    notes: "e becomes i: pido, pides, pide... and pidió, pidieron.",
    example: "Pido un café.",
    exampleEn: "I order a coffee.",
  },
  {
    id: "sentir",
    infinitive: "sentir",
    stem: "sent",
    pattern: "ir",
    en: "to feel",
    present: ["sient", "sient", "sient", "sient"],
    preterite: ["sint", "sint"],
    notes: "Present: siento, sientes, siente. Preterite 3rd person: sintió, sintieron.",
    example: "Siento frío.",
    exampleEn: "I feel cold.",
  },
];

for (const v of newVerbs) {
  if (have.has(v.id)) continue;
  const stemChange = (personae: string[], stems: string[]) =>
    Object.fromEntries(personae.map((p, i) => [p, stems[i]!]));

  f.verbs.push({
    id: v.id,
    infinitive: v.infinitive,
    stem: v.stem,
    pattern: v.pattern,
    translations: { en: v.en },
    stemChanges: {
      present: stemChange(["yo", "tu", "el", "ellos"], v.present),
      preterite: stemChange(["el", "ellos"], v.preterite),
    },
    notes: v.notes,
    example: v.example,
    exampleTranslation: { en: v.exampleEn },
  });
}

// Pin the earlier chapters to the present tense. Their sections have no `tenses`
// key, and a generated lesson has no sections at all in the pack, so this walks
// what exists rather than assuming a shape.
let pinned = 0;
for (const chapter of f.chapters) {
  if ((chapter.status ?? "published") !== "published" || chapter.order > 2) continue;
  for (const lesson of chapter.lessons) {
    for (const section of lesson.sections ?? []) {
      if (section.type === "conjugation" && !section.tenses) {
        section.tenses = ["present"];
        pinned++;
      }
    }
  }
}

await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log(
  `preterite tables: ${Object.keys(PRETERITE).length}, imperfect tables: ${Object.keys(IMPERFECT).length}, new verbs: ${newVerbs.length}, sections pinned: ${pinned}`,
);
