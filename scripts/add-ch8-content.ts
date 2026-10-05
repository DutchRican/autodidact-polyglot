/**
 * One-off content edit: Chapter 8 vocabulary, verbs and one participle field.
 *
 * The subjunctive itself already exists in the pack from the tense commit. What
 * this adds is the vocabulary around it -- the connectors, the emotion and doubt
 * nouns -- plus `creer`, `pensar` and `dudar`, which are the three verbs the mood
 * lesson needs and which the pack only had as word entries.
 *
 * The passive lesson needs a participle, and the engine has no concept of one. It
 * does not need one: the passive is only ever ser + participle, so an explicit
 * string per verb is enough, and no conjugation rule depends on it. Defaulting
 * stem + ado/ido would be wrong for abrir (abierto), venir (venido with a
 * stem change) and the dozen irregulars, so every participle here is written out.
 *
 * Run with: bun scripts/add-ch8-content.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const haveWords = new Set(pack.words.map((w: { id: string }) => w.id));
const haveVerbs = new Set(pack.verbs.map((v: { id: string }) => v.id));

// ---- words -----------------------------------------------------------------
const words: Array<[string, string, string, string, string?]> = [
  // connectors: cause
  ["ya-que", "ya que", "since, given that", "conj", ""],
  ["puesto-que", "puesto que", "given that", "conj", ""],
  ["dado-que", "dado que", "given that", "conj", ""],

  // connectors: concession
  ["aunque", "aunque", "although", "conj", ""],
  ["a-pesar-de-que", "a pesar de que", "in spite of the fact that", "conj", ""],
  ["si-bien", "si bien", "although it is true", "conj", ""],

  // connectors: consequence
  ["por-eso", "por eso", "for that reason", "conj", ""],
  ["asi-que", "así que", "so, and so", "conj", ""],
  ["por-lo-tanto", "por lo tanto", "therefore", "conj", ""],
  ["en-consecuencia", "en consecuencia", "consequently", "conj", ""],

  // connectors that are not connectors
  ["sin-embargo", "sin embargo", "however", "adv", ""],
  ["no-obstante", "no obstante", "nevertheless", "adv", ""],
  ["ademas", "además", "besides, moreover", "adv", ""],
  ["por-otra-parte", "por otra parte", "on the other hand", "adv", ""],

  // the two that trip people up
  ["sino", "sino", "but rather, rather", "conj", ""],
  ["tampoco", "tampoco", "neither, not either", "adv", ""],

  // mood
  ["duda", "la duda", "the doubt", "noun", "f"],
  ["sorpresa", "la sorpresa", "the surprise", "noun", "f"],
  ["alegria", "la alegría", "the joy", "noun", "f"],
  ["proposito", "el propósito", "the intention", "noun", "m"],
  ["opinion", "la opinión", "the opinion", "noun", "f"],
  ["argumento", "el argumento", "the argument", "noun", "m"],
  ["punto", "el punto", "the point", "noun", "m"],

  // agreeing and disagreeing
  ["de-acuerdo", "de acuerdo", "in agreement", "phrase", ""],
  ["tienes-razon", "tienes razón", "you are right", "phrase", ""],
  ["no-estoy-de-acuerdo", "no estoy de acuerdo", "I do not agree", "phrase", ""],
  ["creo-que", "creo que", "I think that", "phrase", ""],
  ["en-mi-opinion", "en mi opinión", "in my opinion", "phrase", ""],

  // participles, for the passive
  ["part-construido", "construido", "built", "adj", ""],
  ["part-dicho", "dicho", "said", "adj", ""],
  ["part-hecho", "hecho", "done, made", "adj", ""],
  ["part-puesto", "puesto", "put, placed", "adj", ""],
  ["part-visto", "visto", "seen", "adj", ""],
  ["part-escrito", "escrito", "written", "adj", ""],
  ["part-abierto", "abierto", "opened", "adj", ""],
  ["part-perdido", "perdido", "lost", "adj", ""],
  ["part-resuelto", "resuelto", "resolved", "adj", ""],
];

let addedWords = 0;
for (const [id, value, en, pos, gender] of words) {
  if (haveWords.has(id)) continue;
  pack.words.push({
    id,
    value,
    translations: { en },
    pos,
    ...(gender ? { gender } : {}),
  });
  haveWords.add(id);
  addedWords++;
}

// ---- verbs -----------------------------------------------------------------
const ALL = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];
const onAll = (stem: string) => Object.fromEntries(ALL.map((p) => [p, stem]));

type Verb = {
  id: string;
  infinitive: string;
  stem: string;
  pattern: string;
  en: string;
  stemChanges?: Record<string, Record<string, string>>;
  notes?: string;
  participle?: string;
  example: string;
  exampleEn: string;
};

const verbs: Verb[] = [
  { id: "creer", infinitive: "creer", stem: "cre", pattern: "er", en: "to believe",
    participle: "creído",
    notes: "creer QUE takes the indicative for what you think, and the subjunctive for what other people think. No creer que takes the subjunctive.",
    example: "Creo que viene.", exampleEn: "I think he is coming." },
  { id: "pensar", infinitive: "pensar", stem: "pens", pattern: "ar", en: "to think",
    // Both tenses take the diphthong on all six personae: piense, pienses,
    // piense, pensemos, penséis, piensen.
    stemChanges: { present: onAll("piens"), subjunctive: onAll("piens") },
    participle: "pensado",
    example: "¿Qué piensas de eso?", exampleEn: "What do you think of that?" },
  { id: "dudar", infinitive: "dudar", stem: "dud", pattern: "ar", en: "to doubt",
    participle: "dudado",
    notes: "dudar DE + noun, dudar QUE + clause. The clause takes the subjunctive.",
    example: "Dudo que sea verdad.", exampleEn: "I doubt that it is true." },
  { id: "opinar", infinitive: "opinar", stem: "opin", pattern: "ar", en: "to have an opinion",
    participle: "opinado",
    notes: "opinar SOBRE + noun. The preposition is not optional.",
    example: "¿Qué opinas sobre el plan?", exampleEn: "What do you think about the plan?" },
];

let addedVerbs = 0;
for (const v of verbs) {
  if (haveVerbs.has(v.id)) continue;
  pack.verbs.push({
    id: v.id,
    infinitive: v.infinitive,
    stem: v.stem,
    pattern: v.pattern,
    translations: { en: v.en },
    ...(v.stemChanges ? { stemChanges: v.stemChanges } : {}),
    ...(v.notes ? { notes: v.notes } : {}),
    ...(v.participle ? { participle: v.participle } : {}),
    example: v.example,
    exampleTranslation: { en: v.exampleEn },
  });
  haveVerbs.add(v.id);
  addedVerbs++;
}

/**
 * Participles for verbs already in the pack, for the passive lesson. Only verbs
 * that exist are listed; construir, abrir, perder, resolver and ganar are not in
 * the pack yet, so they are not here either.
 */
const participles: Record<string, string> = {
  decir: "dicho",
  hacer: "hecho",
  poner: "puesto",
  ver: "visto",
  escribir: "escrito",
  necesitar: "necesitado",
  aprender: "aprendido",
};

let addedParticiples = 0;
for (const verb of pack.verbs) {
  const participle = participles[verb.infinitive];
  if (!participle || verb.participle) continue;
  verb.participle = participle;
  addedParticiples++;
}

// ---- story -----------------------------------------------------------------
if (!pack.stories.some((s: { id: string }) => s.id === "st-dos-puntos")) {
  const glossary = ["sin-embargo", "por-eso", "creo-que", "en-mi-opinion"];
  for (const id of glossary) {
    if (!haveWords.has(id)) throw new Error(`unknown glossary word "${id}"`);
  }
  pack.stories.push({
    id: "st-dos-puntos",
    title: "Dos puntos de vista",
    titleTranslations: { en: "Two points of view" },
    glossary,
    text: [
      "Ana y Luis discuten el mismo plan, pero no dicen lo mismo. Ana lo ve claro",
      "y Luis tiene dudas.",
      "",
      "—Yo creo que el plan es bueno. No veo ningún problema.",
      "",
      "—Sin embargo, no estoy de acuerdo. Dudo que funcione en el norte, donde",
      "no hay tren.",
      "",
      "—Aunque no tengas razón, puedo entender por qué piensas así. Por eso",
      "quiero discutirlo contigo.",
      "",
      "Ana no cambió de opinión. Tampoco era necesario. Hablaron media hora y",
      "al final propusieron trabajar en dos etapas.",
      "",
      "Al final los dos tenían razón a medias, que es como suele pasar cuando",
      "alguien discute de verdad.",
    ].join("\n"),
    questions: [
      {
        type: "choice",
        prompt: "¿Qué cree Ana?",
        options: [
          { value: "Que el plan es bueno", correct: true },
          { value: "Que el plan no funciona", correct: false },
          { value: "Que no hay tren en el norte", correct: false },
          { value: "Que hay que hablar con Luis", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "¿Por qué no está de acuerdo Luis?",
        options: [
          { value: "Porque no hay tren en el norte", correct: true },
          { value: "Porque Ana tiene razón", correct: false },
          { value: "Porque el plan es malo", correct: false },
          { value: "Porque no quiere trabajar", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "¿Qué proponen al final?",
        options: [
          { value: "Trabajar en dos etapas", correct: true },
          { value: "No hacer nada", correct: false },
          { value: "Buscar un tren", correct: false },
          { value: "Cambiar de plan", correct: false },
        ],
      },
    ],
  });
}

// ---- write -----------------------------------------------------------------
await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(
  `words +${addedWords}, verbs +${addedVerbs}, participles +${addedParticiples}, story +${pack.stories.some((s: { id: string }) => s.id === "st-dos-puntos") ? 1 : 0}`,
);
