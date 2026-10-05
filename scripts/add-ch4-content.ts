/**
 * One-off content edit: Chapter 4 vocabulary and two future/conditional
 * readings.
 *
 * Run with: bun scripts/add-ch4-content.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const haveWords = new Set(f.words.map((w) => w.id));
const haveStories = new Set(f.stories.map((s) => s.id));

const words: Array<[string, string, string, string, string?]> = [
  // time expressions for talking about the future
  ["la-semana-que-viene", "la semana que viene", "next week", "phrase", ""],
  ["el-proximo-ano", "el próximo año", "next year", "phrase", ""],
  ["el-mes-que-viene", "el mes que viene", "next month", "phrase", ""],
  ["dentro-de", "dentro de", "in (a period of time)", "phrase", ""],
  ["dentro-de-un-ano", "dentro de un año", "in a year", "phrase", ""],
  ["ahora-mismo", "ahora mismo", "right now", "phrase", ""],
  ["hace-dos-anos", "hace dos años", "two years ago", "phrase", ""],
  ["hace-falta", "hace falta", "it is needed", "phrase", ""],
  ["cuanto-hace", "¿cuánto hace?", "how long ago?", "phrase", ""],

  // uncertainty and prediction
  ["quizas", "quizás", "maybe", "adv", ""],
  ["tal-vez", "tal vez", "maybe", "phrase", ""],
  ["seguro-que", "seguro que", "I'm sure that", "phrase", ""],
  ["ojala", "ojalá", "I hope / if only", "adv", ""],
  ["a-menos-que", "a menos que", "unless", "phrase", ""],
  ["cuando", "cuando", "when", "phrase", ""],
  ["mientras", "mientras", "while", "phrase", ""],
  ["sin-embargo", "sin embargo", "however", "phrase", ""],

  // planning vocabulary
  ["el-plan", "el plan", "the plan", "noun", "m"],
  ["los-planes", "los planes", "the plans", "noun", "m"],
  ["vacaciones", "las vacaciones", "the holiday / vacation", "noun", "f"],
  ["reservar", "reservar", "to book / reserve", "verb", ""],
  ["alquilar", "alquilar", "to rent", "verb", ""],
  ["mudarse", "mudarse", "to move house", "verb", ""],
  ["casarse", "casarse", "to get married", "verb", ""],
  ["creer", "creer", "to believe", "verb", ""],
  ["esperar", "esperar", "to wait / to hope", "verb", ""],
  ["decidir", "decidir", "to decide", "verb", ""],
  ["cambiar", "cambiar", "to change", "verb", ""],
  ["buscar-casa", "buscar casa", "to look for a flat", "phrase", ""],
  ["el-bono", "el bono", "the bonus", "noun", "m"],
  ["el-ascensor", "el ascensor", "the lift / elevator", "noun", "m"],
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
    id: "st-planes",
    title: "Los planes",
    titleTranslations: { en: "The plans" },
    glossary: ["los-planes", "vacaciones", "reservar", "dentro-de"],
    text: `Marta tiene planes para el verano. Dentro de un mes empezará las vacaciones.
— ¿Qué harás este verano? —le pregunta su hermana.
— No lo sé todavía. Quizá trabajé, o quizá descansaré.
— ¿Vas a viajar?
— Sí, ya reservé el billete. Iremos a Lisboa en agosto.
— Perfecto. ¿Reservaste el hotel?
— Todavía no. Y seguro que lo haré mañana, porque los hoteles en agosto se llenan rápido.
Marta espera que todo salga bien. Si el trabajo se acaba pronto, tendrá más días libres. Si no, irá sola y no pasa nada.`,
    questions: [
      choice("¿Cuándo empezarán las vacaciones?", [
        ["Dentro de un mes", true],
        ["En agosto", false],
        ["Mañana", false],
        ["No se dice", false],
      ]),
      choice("¿Cuándo reservó el billete?", [
        ["Ya", true],
        ["Mañana", false],
        ["En agosto", false],
        ["Nunca", false],
      ]),
      choice("¿Reservó el hotel?", [
        ["Todavía no", true],
        ["Sí", false],
        ["Nunca", false],
        ["Mañana", false],
      ]),
      {
        type: "fill",
        prompt: "Marta espera que todo ___ (salir) bien.",
        promptLang: "es",
        answer: "salga",
        accept: ["salga", "sale"],
      },
    ],
  },
  {
    id: "st-sube",
    title: "¿Podrías abrirme?",
    titleTranslations: { en: "Could you open it for me?" },
    glossary: ["el-ascensor", "el-bono", "el-trabajo"],
    text: `— Perdone, ¿podría abrirme la puerta? El ascensor no funciona.
— Claro, espere un momento.
El hombre le abrió la puerta y después subió con ella al quinto piso.
— Gracias. ¿Sabe usted cuándo lo arreglarán?
— Creo que mañana por la mañana. Siempre se rompe por la semana.
— ¿Y si no lo arreglan? Tendré que subir andando todos los días.
— No se preocupe. Seguramente estará funcionando antes del lunes.
Ella le dio las gracias otra vez y entró en su piso.`,
    questions: [
      choice("¿Qué no funciona?", [
        ["El ascensor", true],
        ["La puerta", false],
        ["El teléfono", false],
        ["La luz", false],
      ]),
      choice("¿Cuándo lo arreglarán el ascensor?", [
        ["Mañana por la mañana", true],
        ["El lunes", false],
        ["La semana que viene", false],
        ["No se sabe", false],
      ]),
      choice("¿Qué haría ella si no lo arreglan?", [
        ["Subir andando", true],
        ["Bajar a la oficina", false],
        ["Esperar en el coche", false],
        ["Llamar a la policía", false],
      ]),
      {
        type: "fill",
        prompt: "— Claro, ___ un momento.",
        promptLang: "es",
        answer: "espere",
      },
    ],
  },
];

// Nothing non-Latin, and no accidental fragments from a bad paste. Whole-word
// matches only: "libres" is not the fragment "ib".
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
