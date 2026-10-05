/**
 * One-off content edit: the high-frequency verbs for Chapter 2.
 *
 * Almost all of these are regular except for a handful of first-person forms
 * (quiero, puedo, hago, vengo...) — the same "g-insertion" shape as tener.
 * decir also changes nosotros/vosotros. Everything else is the engine's job.
 *
 * Run with: bun scripts/add-ch2-verbs.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const have = new Set(f.verbs.map((v) => v.id));

type V = {
  id: string;
  infinitive: string;
  stem: string;
  pattern: string;
  en: string;
  irregular?: Record<string, string>;
  reflexive?: Record<string, string>;
  notes?: string;
  example: string;
  exampleEn: string;
};

const verbs: V[] = [
  { id: "querer", infinitive: "querer", stem: "quer", pattern: "er", en: "to want / to love",
    irregular: { yo: "quiero" }, notes: "Only yo breaks. Same shape as tener.",
    example: "Quiero un café, por favor.", exampleEn: "I want a coffee, please." },
  { id: "poder", infinitive: "poder", stem: "pod", pattern: "er", en: "to be able to / can",
    irregular: { yo: "puedo" }, notes: "Only yo breaks.",
    example: "No puedo ir hoy.", exampleEn: "I can't go today." },
  { id: "hacer", infinitive: "hacer", stem: "hac", pattern: "er", en: "to do / to make",
    irregular: { yo: "hago" }, notes: "Also a very common weather verb: hacer frío.",
    example: "¿Qué haces hoy?", exampleEn: "What are you doing today?" },
  { id: "decir", infinitive: "decir", stem: "dec", pattern: "ir", en: "to say / to tell",
    irregular: { yo: "digo", nosotros: "decimos", vosotros: "decís" },
    notes: "Three irregular forms: the yo form, plus nosotros and vosotros.",
    example: "Digo la verdad.", exampleEn: "I tell the truth." },
  { id: "dar", infinitive: "dar", stem: "d", pattern: "ar", en: "to give",
    irregular: { yo: "doy" },
    example: "Me dan el libro.", exampleEn: "They give me the book." },
  { id: "saber", infinitive: "saber", stem: "sab", pattern: "er", en: "to know (facts)",
    irregular: { yo: "sé" }, notes: "Facts and information. For skills use poder.",
    example: "¿Sabes dónde está la estación?", exampleEn: "Do you know where the station is?" },
  { id: "venir", infinitive: "venir", stem: "ven", pattern: "ir", en: "to come",
    irregular: { yo: "vengo" },
    example: "¿Vienes a la fiesta?", exampleEn: "Are you coming to the party?" },
  { id: "salir", infinitive: "salir", stem: "sal", pattern: "ir", en: "to go out / to leave",
    irregular: { yo: "salgo" },
    example: "Salgo a las ocho.", exampleEn: "I leave at eight." },
  { id: "poner", infinitive: "poner", stem: "pon", pattern: "er", en: "to put / to place",
    irregular: { yo: "pongo" },
    example: "Pongo la mesa.", exampleEn: "I set the table." },
  { id: "ver", infinitive: "ver", stem: "ve", pattern: "er", en: "to see",
    irregular: { yo: "veo" }, notes: "vosotros is veis, with no accent.",
    example: "Veo un perro.", exampleEn: "I see a dog." },

  // Reflexives. The stem alone conjugates; the pronoun rides along.
  { id: "levantarse", infinitive: "levantarse", stem: "levant", pattern: "ar",
    en: "to get up", reflexive: { yo: "me", tu: "te", el: "se", nosotros: "nos", vosotros: "os", ellos: "se" },
    example: "Me levanto a las siete.", exampleEn: "I get up at seven." },
  { id: "ducharse", infinitive: "ducharse", stem: "duch", pattern: "ar",
    en: "to shower", reflexive: { yo: "me", tu: "te", el: "se", nosotros: "nos", vosotros: "os", ellos: "se" },
    example: "Se ducha por la mañana.", exampleEn: "He showers in the morning." },
  { id: "acostarse", infinitive: "acostarse", stem: "acost", pattern: "ar",
    en: "to go to bed", reflexive: { yo: "me", tu: "te", el: "se", nosotros: "nos", vosotros: "os", ellos: "se" },
    example: "Nos acostamos tarde.", exampleEn: "We go to bed late." },
  { id: "quedarse", infinitive: "quedarse", stem: "qued", pattern: "ar",
    en: "to stay / to remain", reflexive: { yo: "me", tu: "te", el: "se", nosotros: "nos", vosotros: "os", ellos: "se" },
    example: "¿Te quedas en casa?", exampleEn: "Are you staying home?" },
];

const added: unknown[] = [];
for (const v of verbs) {
  if (have.has(v.id)) continue;
  added.push({
    id: v.id,
    infinitive: v.infinitive,
    stem: v.stem,
    pattern: v.pattern,
    translations: { en: v.en },
    ...(v.irregular ? { irregular: { present: v.irregular } } : {}),
    ...(v.reflexive ? { reflexivePronouns: v.reflexive } : {}),
    ...(v.notes ? { notes: v.notes } : {}),
    example: v.example,
    exampleTranslation: { en: v.exampleEn },
  });
}
f.verbs.push(...added);

await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log(`verbs: ${f.verbs.length} (+${added.length})`);
