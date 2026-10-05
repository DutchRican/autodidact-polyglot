/**
 * One-off content edit: Chapter 6 vocabulary and verbs for everyday life.
 *
 * The pack validator now rejects corrupted characters and layout garbage in
 * every text field, so this script relies on it rather than checking locally.
 *
 * Run with: bun scripts/add-ch6-content.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const haveWords = new Set(f.words.map((w) => w.id));
const haveVerbs = new Set(f.verbs.map((v) => v.id));
const haveStories = new Set(f.stories.map((s) => s.id));

const words: Array<[string, string, string, string, string?]> = [
  // meals of the day
  ["desayuno", "el desayuno", "breakfast", "noun", "m"],
  ["cena", "la cena", "dinner", "noun", "f"],
  ["almuerzo", "el almuerzo", "lunch", "noun", "m"],
  ["merienda", "la merienda", "the afternoon snack", "noun", "f"],

  // food and drink
  ["pan", "el pan", "bread", "noun", "m"],
  ["queso", "el queso", "cheese", "noun", "m"],
  ["carne", "la carne", "meat", "noun", "f"],
  ["pollo", "el pollo", "chicken", "noun", "m"],
  ["arroz", "el arroz", "rice", "noun", "m"],
  ["huevo", "el huevo", "egg", "noun", "m"],
  ["leche", "la leche", "milk", "noun", "f"],
  ["postre", "el postre", "dessert", "noun", "m"],

  // in a restaurant
  ["camarero", "el camarero", "the waiter", "noun", "m"],
  ["camarera", "la camarera", "the waitress", "noun", "f"],
  ["cuenta", "la cuenta", "the bill", "noun", "f"],
  ["menu", "el menú", "the menu", "noun", "m"],
  ["propina", "la propina", "the tip", "noun", "f"],
  ["bebida", "la bebida", "the drink", "noun", "f"],

  // shops
  ["panaderia", "la panadería", "the bakery", "noun", "f"],
  ["supermercado", "el supermercado", "the supermarket", "noun", "m"],
  ["fruteria", "la frutería", "the greengrocer's", "noun", "f"],
  ["carniceria", "la carnicería", "the butcher's", "noun", "f"],
  ["quiosco", "el quiosco", "the kiosk", "noun", "m"],

  // buying things
  ["caro", "caro", "expensive", "adj", ""],
  ["barato", "barato", "cheap", "adj", ""],
  ["rebaja", "la rebaja", "the discount", "noun", "f"],
  ["cambio", "el cambio", "the change (money)", "noun", "m"],
  ["efectivo", "en efectivo", "in cash", "phrase", ""],
  ["tarjeta", "la tarjeta", "the card", "noun", "f"],
  ["dinero", "el dinero", "the money", "noun", "m"],

  // weather, extending chapter 5
  ["viento", "el viento", "the wind", "noun", "m"],
  ["lluvia", "la lluvia", "the rain", "noun", "f"],
  ["nieve", "la nieve", "the snow", "noun", "f"],
  ["nublado", "nublado", "cloudy", "adj", ""],
  ["soleado", "soleado", "sunny", "adj", ""],
  ["helado", "helado", "ice cold / iced", "adj", ""],
  ["calido", "cálido", "warm", "adj", ""],

  // routine
  ["manana3", "por la mañana", "in the morning", "phrase", ""],
  ["tarde2", "por la tarde", "in the afternoon", "phrase", ""],
  ["noche2", "por la noche", "at night", "phrase", ""],
  ["pronto", "pronto", "soon / early", "adv", ""],
  ["todavia2", "todavía no", "not yet", "phrase", ""],
  ["siempre2", "siempre", "always", "adv", ""],
  ["cada-vez", "cada vez", "every time", "phrase", ""],
  ["normal", "normal", "normal / usual", "adj", ""],
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

type Verb = {
  id: string;
  infinitive: string;
  stem: string;
  pattern: string;
  en: string;
  irregular?: Record<string, string>;
  stemChanges?: Record<string, string>;
  notes?: string;
  example: string;
  exampleEn: string;
};

const verbs: Verb[] = [
  { id: "traer", infinitive: "traer", stem: "tra", pattern: "er", en: "to bring",
    irregular: { yo: "traigo" }, notes: "Only yo breaks, like poner and salir.",
    example: "Traigo la leche.", exampleEn: "I am bringing the milk." },
  { id: "pagar", infinitive: "pagar", stem: "pag", pattern: "ar", en: "to pay",
    irregular: { yo: "pago" }, example: "Pago con tarjeta.", exampleEn: "I pay by card." },
  { id: "encontrar", infinitive: "encontrar", stem: "encontr", pattern: "ar", en: "to find",
    irregular: { yo: "encuentro" },
    example: "¿Encontraste el dinero?", exampleEn: "Did you find the money?" },
  { id: "servir", infinitive: "servir", stem: "serv", pattern: "ir", en: "to serve",
    irregular: { yo: "sirvo" }, notes: "Like vivir: a v-form on yo only.",
    example: "Sirven muy bien.", exampleEn: "They serve very well." },
  { id: "costar", infinitive: "costar", stem: "cost", pattern: "ar", en: "to cost",
    example: "¿Cuánto cuesta?", exampleEn: "How much does it cost?" },
  { id: "cocinar", infinitive: "cocinar", stem: "cocin", pattern: "ar", en: "to cook",
    example: "Cocino paella los domingos.", exampleEn: "I cook paella on Sundays." },
  { id: "desayunar", infinitive: "desayunar", stem: "desayun", pattern: "ar", en: "to have breakfast",
    example: "Desayuno café con leche.", exampleEn: "I have coffee with milk for breakfast." },
  { id: "almorzar", infinitive: "almorzar", stem: "almorz", pattern: "ar", en: "to have lunch",
    stemChanges: { yo: "almuerz", tu: "almuerz", el: "almuerz", ellos: "almuerz" },
    notes: "a becomes ie: almuerzo, almuerzas, almuerza, almorzamos, almuerzan.",
    example: "Almuerzo a las dos.", exampleEn: "I have lunch at two." },
  { id: "quedar", infinitive: "quedar", stem: "qued", pattern: "ar", en: "to meet up / to be left",
    notes: "quedar con alguien = to meet up with someone. Also quedan las ocho = it is eight o'clock.",
    example: "¿Quedamos a las seis?", exampleEn: "Shall we meet at six?" },
  // A shop sells things, and Spanish says vender rather than tener. Chapter 6
  // both teaches and quizzes this verb, so it has to exist.
  { id: "vender", infinitive: "vender", stem: "vend", pattern: "er", en: "to sell",
    example: "¿Dónde venden pan?", exampleEn: "Where do they sell bread?" },
  { id: "cenar", infinitive: "cenar", stem: "cen", pattern: "ar", en: "to have dinner",
    notes: "Regular, but watch the collision: ceno is 'I have dinner' and cena is 'dinner'. The final -a is a noun, the -o is a verb.",
    example: "Ceno a las nueve.", exampleEn: "I have dinner at nine." },
];

let addedVerbs = 0;
for (const v of verbs) {
  if (haveVerbs.has(v.id)) continue;
  f.verbs.push({
    id: v.id,
    infinitive: v.infinitive,
    stem: v.stem,
    pattern: v.pattern,
    translations: { en: v.en },
    ...(v.irregular ? { irregular: { present: v.irregular } } : {}),
    ...(v.stemChanges ? { stemChanges: { present: v.stemChanges } } : {}),
    ...(v.notes ? { notes: v.notes } : {}),
    example: v.example,
    exampleTranslation: { en: v.exampleEn },
  });
  haveVerbs.add(v.id);
  addedVerbs++;
}

// Three more stem-changers, same trap as oler and llouver: marking only the yo
// form leaves the other three personae looking perfectly regular and wrong.
// encontrar and costar change o -> ue; servir changes u -> ie, like vivir.
const stemChange = (id: string, changes: Record<string, string>, note: string) => {
  const verb = f.verbs.find((v) => v.id === id);
  if (!verb) throw new Error(`no verb ${id}`);
  verb.stemChanges = { ...(verb.stemChanges ?? {}), present: changes };
  verb.notes = [verb.notes, note].filter(Boolean).join(" ");
};
stemChange(
  "encontrar",
  { tu: "encuentr", el: "encuentr", ellos: "encuentr" },
  "o becomes ue: encuentras, encuentra, encuentran. nosotros and vosotros are regular.",
);
stemChange(
  "servir",
  { tu: "sirv", el: "sirv", ellos: "sirv" },
  "Like vivir: sirvo, sirves, sirve, servimos, servís, sirven.",
);
// Unlike querer and poder, costing has no g-form for yo, so o becomes ue on
// all four affected personae: cuesto, cuestas, cuesta, cuestan.
stemChange(
  "costar",
  { yo: "cuest", tu: "cuest", el: "cuest", ellos: "cuest" },
  "o becomes ue on every form that changes: cuesto, cuestas, cuesta, cuestan.",
);

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
    id: "st-el-mercado",
    title: "El mercado del sábado",
    titleTranslations: { en: "Saturday market" },
    glossary: ["mercado", "fruteria", "carniceria", "barato", "caro"],
    text: `Los sábados por la mañana voy al mercado con mi hermana. Está cerca de nuestra casa y abre a las ocho.
Primero vamos a la frutería. Compramos fruta: dos kilos de naranjas, un kilo de plátanos y cuatro manzanas. La fruta de aquí es barata y buena.
Después vamos a la carnicería. Mi hermana compra pollo y yo compro queso. El queso es caro, pero está bueno.
— ¿Quieres carne? —pregunta ella.
— No, hoy no. Tenemos pollo del ayer.
— Bueno. Pagamos y nos vamos. No quiero estar aquí mucho tiempo.
De vuelta compramos pan. El pan es lo único que nunca tenemos suficiente en casa.
A la una ya estamos en casa.`,
    questions: [
      choice("¿Cuándo va la hermana al mercado?", [
        ["Los sábados por la mañana", true],
        ["Los domingos por la tarde", false],
        ["Todos los días", false],
        ["Por la noche", false],
      ]),
      choice("¿Qué compra la hermana en la carnicería?", [
        ["Pollo", true],
        ["Queso", false],
        ["Fruta", false],
        ["Pan", false],
      ]),
      choice("¿Qué compran de vuelta?", [
        ["Pan", true],
        ["Fruta", false],
        ["Carne", false],
        ["Leche", false],
      ]),
    ],
  },
  {
    id: "st-en-el-restaurante",
    title: "En el restaurante",
    titleTranslations: { en: "At the restaurant" },
    glossary: ["camarera", "cuenta", "menu", "propina", "postre"],
    text: `El sábado por la noche vamos mi hermana y yo a un restaurante italiano cerca de casa. La camarera nos trae el menú.
— Buenas noches. ¿Qué va a tomar?
— Para mí, una sopa y el pescado. ¿Y tú?
— El pollo con arroz, por favor. Y un agua.
— Muy bien. Un momento.
La comida estuvo buena. El pescado era pequeño, pero estaba muy rico.
— ¿Tomamos postre?
— Sí. Yo quiero helado. Ella prefiere café.
— Perfecto. La cuenta, por favor.
La camarera trae la cuenta. Mi hermana paga y deja una propina.
— Buen provecho —dice ella.`,
    questions: [
      choice("¿Qué pidió Andrés?", [
        ["Una sopa y el pescado", true],
        ["El pollo con arroz", false],
        ["Un café", false],
        ["Solo el agua", false],
      ]),
      choice("¿Qué pidió de postre?", [
        ["Helado", true],
        ["Café", false],
        ["Sopa", false],
        ["Nada", false],
      ]),
      choice("¿Quién pagó?", [
        ["Sat yrés", true],
        ["La camarera", false],
        ["Los dos a medias", false],
        ["Nadie", false],
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
console.log(`words +${addedWords}, verbs +${addedVerbs}, stories +${addedStories}`);
