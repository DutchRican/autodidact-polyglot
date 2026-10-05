/**
 * One-off content edit: future and conditional tenses.
 *
 * The future attaches its endings to the infinitive minus the infinitive
 * ending, so the stem for these two tenses is derived from each verb rather than
 * written out. Only nine verbs have an irregular future stem.
 *
 * Note the two ending sets are different from each other:
 *   future:     é, ás, á, emos, éis, án
 *   conditional: ía, ías, ía, íamos, íais, ían
 *
 * Run with: bun scripts/add-future-conditional.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const tenses = f.conjugation.tenses;

const SAME = ["ar", "er", "ir"] as const;

if (!tenses["future"]) {
  tenses["future"] = {
    label: "Future (futuro simple)",
    labelTranslations: { en: "Future (futuro simple)" },
    patterns: Object.fromEntries(
      SAME.map((p) => [p, ["é", "ás", "á", "emos", "éis", "án"]]),
    ),
  };
}

if (!tenses["conditional"]) {
  tenses["conditional"] = {
    label: "Conditional (condicional simple)",
    labelTranslations: { en: "Conditional (condicional simple)" },
    patterns: Object.fromEntries(
      SAME.map((p) => [p, ["ía", "ías", "ía", "íamos", "íais", "ían"]]),
    ),
  };
}

const order = ["present", "preterite", "imperfect", "future", "conditional"];
f.conjugation.tenses = Object.fromEntries(
  order.filter((t) => tenses[t]).map((t) => [t, tenses[t]]),
);

// Verbs whose future stem is not simply the infinitive. The regular case is the
// whole infinitive: hablar + é is hablaré, not hablé. These nine shorten it,
// dropping their ar/er/ir ending: tener -> tendr-, poder -> podr-.
const IRREGULAR_FUTURE: Record<string, string> = {
  tener: "tendr",
  poder: "podr",
  hacer: "har",
  decir: "dir",
  salir: "saldr",
  venir: "vendr",
  poner: "pondr",
  saber: "sabr",
  querer: "querr",
};

let derived = 0;
let overridden = 0;
for (const verb of f.verbs) {
  // The future/conditional stem is the infinitive itself. Reflexive infinitives
  // drop only the reflexive -se: levantarse -> levantaré.
  const derivedStem = verb.infinitive.replace(/se$/, "");
  const futureStem = IRREGULAR_FUTURE[verb.id] ?? derivedStem;
  if (!futureStem) throw new Error(`cannot derive a future stem for ${verb.infinitive}`);
  if (IRREGULAR_FUTURE[verb.id]) overridden++;
  else derived++;

  verb.stemByTense = {
    ...(verb.stemByTense ?? {}),
    future: futureStem,
    conditional: futureStem,
  };
}

await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log(
  `tenses: ${Object.keys(f.conjugation.tenses).join(", ")} | future stems derived: ${derived}, irregular: ${overridden}`,
);
