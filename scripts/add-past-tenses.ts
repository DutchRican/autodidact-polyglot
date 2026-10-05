/**
 * One-off content edit: add the two past tenses to the Spanish rules.
 *
 * preterite was already in the pack and is correct as written.
 * imperfect is new. Note that the imperfect has no stem changes at all — every
 * -er and -ir verb uses the same ía/ías/ía/íamos/íais/ían, which is exactly why
 * it is such a relief after the preterite.
 *
 * Run with: bun scripts/add-past-tenses.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const tenses = f.conjugation.tenses;

if (!tenses["preterite"]) {
  tenses["preterite"] = {
    label: "Preterite (pretérito indefinido)",
    labelTranslations: { en: "Preterite (pretérito indefinido)" },
    patterns: {
      ar: ["é", "aste", "ó", "amos", "asteis", "aron"],
      er: ["í", "iste", "ió", "imos", "isteis", "ieron"],
      ir: ["í", "iste", "ió", "imos", "isteis", "ieron"],
    },
  };
}

if (!tenses["imperfect"]) {
  tenses["imperfect"] = {
    label: "Imperfect (pretérito imperfecto)",
    labelTranslations: { en: "Imperfect (pretérito imperfecto)" },
    patterns: {
      // -er and -ir are identical in the imperfect.
      ar: ["aba", "abas", "aba", "ábamos", "abais", "aban"],
      er: ["ía", "ías", "ía", "íamos", "íais", "ían"],
      ir: ["ía", "ías", "ía", "íamos", "íais", "ían"],
    },
  };
}

// Order matters for display: present, preterite, imperfect.
const order = ["present", "preterite", "imperfect"];
f.conjugation.tenses = Object.fromEntries(
  order.filter((t) => tenses[t]).map((t) => [t, tenses[t]]),
);

await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log("tenses:", Object.keys(f.conjugation.tenses).join(", "));
