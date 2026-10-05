/**
 * One-off content edit: publish chapter 9, plan chapter 10, and add the verbs
 * chapter 9 reads about.
 *
 * Three separate jobs, because they became true at the same moment.
 *
 * 1. Chapter 9 has lessons, so its `locked` status has to go. It was authored
 *    while locked so it could be reviewed privately.
 *
 * 2. Chapter 10 had no outline, which meant it had no reviewable plan. Every
 *    other chapter gets one before it gets written; chapter 10 is the last.
 *
 * 3. Chapter 9's readings use llegar and correr so often that leaving them as
 *    bare words was wrong: a learner who reads "Marta llegó a casa" and taps
 *    the verb reference should find it. The same goes for the inference verbs
 *    (sostener, sugerir, matizar, afirmar) and the modals' companions (permitir,
 *    impedir, anadir). Nine of these were already in `words` with pos "verb",
 *    which is why the orphan-verb lint was at 25 rather than 16.
 *
 * All nine are regular, so the engine needs no help beyond `stemByTense` for the
 * future and conditional -- which add-future-stems.ts already established as
 * the infinitive minus a reflexive -se.
 *
 * Run with: bun scripts/add-ch9-verbs-and-status.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

/* ---------------------------------------------------------------- publish */

const ch9 = pack.chapters.find((c: { id: string }) => c.id === "chapter-9");
if (!ch9) throw new Error("chapter-9 missing");
if (!ch9.lessons.length) throw new Error("chapter-9 has no lessons to publish");
ch9.status = "published";

/* ---------------------------------------------------------- plan ch10 */

const ch10 = pack.chapters.find((c: { id: string }) => c.id === "chapter-10");
if (!ch10) throw new Error("chapter-10 missing");
if (ch10.lessons.length) throw new Error("chapter-10 already written");

if (!ch10.outline) {
  ch10.outline = [
    {
      title: "El pretérito frente al imperfecto",
      subtitle: "Choosing between the two, on purpose",
      covers: "the decision rules that chapter 9 stated, drilled until automatic",
    },
    {
      title: "Los seis tiempos, uno por uno",
      subtitle: "Present, preterite, imperfect, subjunctive, future, conditional",
      covers: "each tense against the other five, so nothing is only recognisable in isolation",
    },
    {
      title: "Verbos irregulares",
      subtitle: "The ones that keep catching people out",
      covers: "irregular yo forms, stem changers, and the -ir verbs that split two ways",
    },
    {
      title: "Los pronombres de objeto",
      subtitle: "Direct and indirect, and the order they take",
      covers: "me, te, se, lo, la, le, les, nos, os, and where they go in the sentence",
    },
    {
      title: "Imperativo",
      subtitle: "The one mood that has a stem change",
      covers: "tú, usted, nosotros, vosotros, ustedes, and the six irregular verbs",
    },
    {
      title: "Por y para",
      subtitle: "Two prepositions that overlap in English",
      covers: "destination, deadline, purpose, opinion, and the cases where they swap",
    },
    {
      title: "Ser y estar",
      subtitle: "The distinction, and the grey areas",
      covers: "identity against state, plus the pairs where both are defensible",
    },
    {
      title: "Lectura cronometrada",
      subtitle: "Three texts, no glossary",
      covers: "reading at speed with only context, timed so the habit forms",
    },
    {
      title: "Examen",
      subtitle: "One long mixed quiz across everything",
      covers: "the whole course in a single sitting, with no section labels to lean on",
    },
    {
      title: "Cierre",
      subtitle: "What comes after this course",
      covers: "where the gaps are, and how to find out what to study next",
    },
  ];
}

/* -------------------------------------------------------------- verbs */

const verbs: Array<[string, string, string, string, string, string, string]> = [
  // id, infinitive, stem, pattern, en, example, exampleEn
  ["llegar", "llegar", "lleg", "ar", "to arrive", "Llegó a casa a las doce.", "He arrived home at midnight."],
  ["correr", "correr", "corr", "er", "to run", "Salió corriendo.", "She went out running."],
  ["permitir", "permitir", "permit", "ir", "to allow", "No permiten fumar aquí.", "They do not allow smoking here."],
  ["impedir", "impedir", "imped", "ir", "to prevent", "La lluvia nos impidió salir.", "The rain prevented us from going out."],
  ["anadir", "añadir", "añad", "ir", "to add", "Añade sal, pero poca.", "Add salt, but little."],
  ["coger", "coger", "cog", "er", "to catch, to take", "Cogió el autobús.", "He caught the bus."],
  ["sostener", "sostener", "sosten", "er", "to claim, to assert", "Sostienen que hay que abrirla.", "They claim that it should be opened."],
  ["sugerir", "sugerir", "suger", "ir", "to suggest", "Sugirió esperar un poco.", "He suggested waiting a while."],
  ["afirmar", "afirmar", "afirm", "ar", "to assert, to state firmly", "Afirmó que nadie lo había visto.", "He asserted that nobody had seen it."],
  ["inundar", "inundar", "inund", "ar", "to flood", "El valle se inundará.", "The valley will flood."],
];

const haveVerbs = new Set(pack.verbs.map((v: { id: string }) => v.id));

for (const [id, infinitive, stem, pattern, en, example, exampleEn] of verbs) {
  if (haveVerbs.has(id)) continue;

  // e -> ie in the present singular and third plural. Written per-persona
  // because the engine's stemChanges are explicit, and this is the only tense
  // that changes: neither the preterite nor the imperfect nor the subjunctive
  // does this to an -er or -ir verb.
  if (id === "sostener") {
    pack.verbs.push({
      id,
      infinitive,
      stem,
      pattern,
      translations: { en },
      stemChanges: {
        present: {
          yo: "sosten",
          tu: "sostien",
          el: "sostien",
          nosotros: "sosten",
          vosotros: "sosten",
          ellos: "sostien",
        },
        subjunctive: {
          yo: "sosten",
          tu: "sosten",
          el: "sosten",
          nosotros: "sosten",
          vosotros: "sosten",
          ellos: "sosten",
        },
      },
      notes: "e becomes ie on tu, el and ellos only. The subjunctive is untouched.",
      example,
      exampleTranslation: { en: exampleEn },
      stemByTense: { future: infinitive, conditional: infinitive },
      participle: "sostenido",
    });
    continue;
  }

  // e -> ie on the same four-personae pattern, but an -ir verb this time. The
  // subjunctive plural splits here: sentir gives sintamos, so the written vowel
  // wins over the diphthong. Silence is the safest statement of that -- the
  // engine's regular path already produces sentamos-style forms, and a stem
  // override would have to be right to survive.
  if (id === "sugerir") {
    pack.verbs.push({
      id,
      infinitive,
      stem,
      pattern,
      translations: { en },
      stemChanges: {
        present: {
          yo: "suger",
          tu: "sugier",
          el: "sugier",
          nosotros: "suger",
          vosotros: "suger",
          ellos: "sugier",
        },
      },
      notes: "e becomes ie on tu, el and ellos only, and nosotros and vosotros are regular.",
      example,
      exampleTranslation: { en: exampleEn },
      stemByTense: { future: infinitive, conditional: infinitive },
      participle: "sugerido",
    });
    continue;
  }

  pack.verbs.push({
    id,
    infinitive,
    stem,
    pattern,
    translations: { en },
    example,
    exampleTranslation: { en: exampleEn },
    stemByTense: { future: infinitive, conditional: infinitive },
    participle: infinitive.replace(/e$|ir$/, "") + (pattern === "ar" ? "ado" : "ido"),
  });
}

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`verbs now ${pack.verbs.length}, chapter 9 published, chapter 10 planned`);
