/**
 * One-off content edit: Chapter 2 vocabulary and its two reading stories.
 *
 * Run with: bun scripts/add-ch2-content.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const haveWords = new Set(f.words.map((w) => w.id));
const haveStories = new Set(f.stories.map((s) => s.id));

const words: Array<[string, string, string, string?, string?]> = [
  // Objects and places you need for the everyday-verb sentences.
  ["cafe", "el café", "the coffee / the café", "noun", "m"],
  ["fiesta", "la fiesta", "the party", "noun", "f"],
  ["estacion", "la estación", "the station", "noun", "f"],
  ["libro", "el libro", "the book", "noun", "m"],
  ["mesa", "la mesa", "the table", "noun", "f"],
  ["perro2", "el dueño", "the owner", "noun", "m"],
  ["trabajo", "el trabajo", "the work / the job", "noun", "m"],
  ["problema", "el problema", "the problem", "noun", "m"],
  ["mismo", "el mismo", "the same", "adj", "m"],
  ["tarde", "tarde", "late", "adv", ""],
  ["temprano", "temprano", "early", "adv", ""],
  ["siempre", "siempre", "always", "adv", ""],
  ["nunca", "nunca", "never", "adv", ""],
  ["a veces", "a veces", "sometimes", "phrase", ""],
  ["tambien", "también", "also / too", "adv", ""],
  ["porque", "porque", "because", "phrase", ""],
  ["pero", "pero", "but", "phrase", ""],
  ["entonces", "entonces", "then / so", "adv", ""],
  ["todavia", "todavía", "still / yet", "adv", ""],
  ["tener-que", "tener que", "to have to", "phrase", ""],
  ["ir-a", "ir a", "to be going to", "phrase", ""],
  ["querer-decir", "querer decir", "to mean", "phrase", ""],
  ["saber-que", "saber que", "to know that", "phrase", ""],
  ["poder-querer", "poder", "can / to be able to", "verb", ""],
  ["ayudar", "ayudar", "to help", "verb", ""],
  ["buscar", "buscar", "to look for", "verb", ""],
  ["escribir", "escribir", "to write", "verb", ""],
  ["aprender", "aprender", "to learn", "verb", ""],
  ["necesitar", "necesitar", "to need", "verb", ""],
  ["entender", "entender", "to understand", "verb", ""],
  ["elegir", "elegir", "to choose", "verb", ""],
];

let addedWords = 0;
for (const [id, value, en, pos, gender] of words) {
  if (haveWords.has(id)) continue;
  f.words.push({
    id,
    value,
    translations: { en },
    pos,
    ...(gender ? { gender } : {}),
  });
  haveWords.add(id);
  addedWords++;
}

type Q =
  | { type: "choice"; prompt: string; promptLang?: string; options: [string, boolean][] }
  | { type: "fill"; prompt: string; promptLang?: string; answer: string; accept?: string[] };

const choice = (
  prompt: string,
  options: [string, boolean][],
  promptLang?: string,
): Q => ({
  type: "choice",
  prompt,
  promptLang,
  options: options.map(([value, correct]) => ({ value, correct })),
});

const stories = [
  {
    id: "st-poder-decir",
    title: "En el café",
    titleTranslations: { en: "At the café" },
    glossary: ["cafe", "estacion", "manana"],
    text: `— Buenos días. ¿Qué quiere tomar?
— Un café, por favor. Y una tostada.
— Muy bien. ¿Algo más?
— No, gracias. Eso es todo. ¿Sabe usted dónde está la estación?
— Sí, está cerca. Pero no puede ir ahora: la calle está cerrada.
— Vale. Entonces vengo mañana.
— Perfecto. Hasta mañana.
— Gracias. Adiós.`,
    questions: [
      choice("¿Qué quiere tomar la mujer?", [
        ["Un café", true],
        ["Una tostada", false],
        ["Nada", false],
        ["Cerveza", false],
      ]),
      choice("¿Por qué no puede ir a la estación?", [
        ["Porque la calle está cerrada", true],
        ["Porque no sabe dónde está", false],
        ["Porque viene mañana", false],
        ["Porque no quiere", false],
      ]),
      { type: "fill", prompt: "No ___ (poder) ir ahora.", answer: "puede" },
    ],
  },
  {
    id: "st-reflexivos",
    title: "La rutina",
    titleTranslations: { en: "The routine" },
    glossary: ["manana", "tarde", "temprano"],
    text: `Me levanto a las siete todos los días. Me ducho y bebo un café.
Mi hermana se levanta más tarde. Ella no se ducha por la mañana: se ducha por la noche.
Nosotros nos acostamos tarde. Ellos se acuestan a las once.
— ¿A qué hora te quedas tú en casa?
— Yo me quedo en casa los domingos. Después me acuesto muy pronto.
— Nosotros no nos quedamos en casa. Salimos.`,
    questions: [
      choice("¿A qué hora se levanta quien narra?", [
        ["A las siete", true],
        ["A las once", false],
        ["Muy tarde", false],
        ["No se dice", false],
      ]),
      choice("¿Cuándo se ducha la hermana?", [
        ["Por la noche", true],
        ["Por la mañana", false],
        ["Los domingos", false],
        ["Nunca", false],
      ]),
      { type: "fill", prompt: "Nosotros ___ (acostarse) tarde.", answer: "nos acostamos" },
    ],
  },
];

let addedStories = 0;
for (const story of stories) {
  if (haveStories.has(story.id)) continue;
  f.stories.push(story);
  haveStories.add(story.id);
  addedStories++;
}

for (const story of f.stories) {
  for (const id of story.glossary ?? []) {
    if (!haveWords.has(id)) throw new Error(`story ${story.id}: unknown glossary word "${id}"`);
  }
}

await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log(`words +${addedWords}, stories +${addedStories}`);
