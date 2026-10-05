/**
 * One-off content edit: Chapter 3 vocabulary and two past-tense readings.
 *
 * Run with: bun scripts/add-ch3-content.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const haveWords = new Set(f.words.map((w) => w.id));
const haveStories = new Set(f.stories.map((s) => s.id));

const words: Array<[string, string, string, string, string?]> = [
  ["ayer-noche", "ayer por la noche", "last night", "phrase", ""],
  ["anoche", "anoche", "last night", "adv", ""],
  ["anteayer", "anteayer", "the day before yesterday", "adv", ""],
  ["siempre", "siempre", "always", "adv", ""],
  ["nunca", "nunca", "never", "adv", ""],
  ["a-menudo", "a menudo", "often", "phrase", ""],
  ["todos-los-dias", "todos los días", "every day", "phrase", ""],
  ["cada-ano", "cada año", "every year", "phrase", ""],
  ["la-semana-pasada", "la semana pasada", "last week", "phrase", ""],
  ["el-verano", "el verano", "summer", "noun", "m"],
  ["el-invierno", "el invierno", "winter", "noun", "m"],
  ["la-vacacion", "la vacación", "the holiday / vacation", "noun", "f"],
  ["el-trabajo", "el trabajo", "the work / job", "noun", "m"],
  ["la-oficina", "la oficina", "the office", "noun", "f"],
  ["la-reunion", "la reunión", "the meeting", "noun", "f"],
  ["el-viaje", "el viaje", "the trip", "noun", "m"],
  ["la-playa", "la playa", "the beach", "noun", "f"],
  ["la-piscina", "la piscina", "the swimming pool", "noun", "f"],
  ["la-noche", "la noche", "the night", "noun", "f"],
  ["la-tarde", "la tarde", "the afternoon / evening", "noun", "f"],
  ["el-domingo", "el domingo", "Sunday", "noun", "m"],
  ["el-sabado", "el sábado", "Saturday", "noun", "m"],
  ["el-verano-pasado", "el verano pasado", "last summer", "phrase", ""],
  ["hablar-por-telefono", "hablar por teléfono", "to talk on the phone", "phrase", ""],
  ["despertar", "despertar", "to wake up", "verb", ""],
  ["dormir", "dormir", "to sleep", "verb", ""],
  ["sentir", "sentir", "to feel", "verb", ""],
  ["pedir", "pedir", "to ask for / order", "verb", ""],
  ["comprar", "comprar", "to buy", "verb", ""],
  ["pasar", "pasar", "to happen / to spend (time)", "verb", ""],
  ["empezar", "empezar", "to begin", "verb", ""],
  ["terminar", "terminar", "to finish", "verb", ""],
  ["trabajar", "trabajar", "to work", "verb", ""],
  ["nadar", "nadar", "to swim", "verb", ""],
  ["viajar", "viajar", "to travel", "verb", ""],
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
    id: "st-verano-pasado",
    title: "El verano pasado",
    titleTranslations: { en: "Last summer" },
    glossary: ["el-verano-pasado", "la-playa", "nadar", "viajar"],
    text: `El verano pasado fui a la playa con mi familia. Salimos de Madrid muy temprano, porque el coche estaba en el taller.
La casa estaba en un pueblo pequeño. Todos los días nadábamos en la piscina por la mañana y por la tarde caminábamos por la playa.
Un día llovió. No pudimos ir a la playa, pero estuvimos en la casa todo el día. Mi madre cocinó paella y mi padre bebió vino.
La última noche del viaje no dormimos: hablamos hasta las tres.
Al año siguiente repetimos el viaje. Volvimos en agosto y lo pasamos igual de bien.`,
    questions: [
      choice("¿Adónde fueron?", [
        ["A la playa", true],
        ["A la oficina", false],
        ["A la piscina", false],
        ["A la playa y a la piscina", false],
      ]),
      choice("¿Por qué no pudieron ir a la playa un día?", [
        ["Porque llovió", true],
        ["Porque trabajaron", false],
        ["Porque no tenían coche", false],
        ["Porque era de noche", false],
      ]),
      choice("¿Cuándo no durmieron?", [
        ["La última noche", true],
        ["La primera mañana", false],
        ["Nunca dormían", false],
        ["Todos los días", false],
      ]),
    ],
  },
  {
    id: "st-informe",
    title: "El informe",
    titleTranslations: { en: "The report" },
    glossary: ["la-reunion", "trabajar", "el-trabajo", "terminar"],
    text: `Ayer terminé un proyecto muy importante. Duró seis meses.
La reunión con mi jefa fue el lunes. Ella me preguntó por el informe y yo le respondí con los números.
No sabía si los resultados eran buenos, pero parecían buenos.
Ella no dijo nada durante un minuto. Luego dijo: «Hiciste un buen trabajo».
Ese día salí de la oficina a las ocho. Normalmente salía a las seis, así que fue un regalo.
Al mes siguiente empecé otro proyecto. Esta vez era más difícil.`,
    questions: [
      choice("¿Cuándo terminó el proyecto?", [
        ["Ayer", true],
        ["El mes pasado", false],
        ["Dentro de seis meses", false],
        ["No se dice", false],
      ]),
      choice("¿Qué dijo la jefa?", [
        ["Hiciste un buen trabajo", true],
        ["Hiciste un mal trabajo", false],
        ["No dijo nada", false],
        ["Los resultados no eran buenos", false],
      ]),
      choice("¿A qué hora salió del trabajo?", [
        ["A las ocho", true],
        ["A las seis", false],
        ["A las siete", false],
        ["A las nueve", false],
      ]),
    ],
  },
];

let addedStories = 0;
for (const story of stories) {
  if (haveStories.has(story.id)) continue;
  for (const id of story.glossary) {
    if (!haveWords.has(id)) throw new Error(`story ${story.id}: unknown glossary word "${id}"`);
  }
  f.stories.push(story);
  haveStories.add(story.id);
  addedStories++;
}

await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log(`words +${addedWords}, stories +${addedStories}`);
