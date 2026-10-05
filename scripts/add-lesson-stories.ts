/**
 * One-off content edit: attach each story to its lesson, extend the numbers
 * lesson to 1000, and insert the new dates lesson.
 *
 * Run with: bun scripts/add-lesson-stories.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const chapter = f.chapters[0];
const lesson = (id: string) => {
  const found = chapter.lessons.find((l) => l.id === id);
  if (!found) throw new Error(`no lesson ${id}`);
  return found;
};

// 1. One story per lesson, appended as the final section before the review lesson.
const attach: Array<[string, string, string]> = [
  ["saludos", "st-saludos", "Read it, then answer the questions. Everything here is from this lesson."],
  ["numeros", "st-numeros", "Numbers 80, 50 and 130 all appear here."],
  ["colores", "st-colores", "Note where each colour sits: after the noun it describes."],
  ["hablar-presente", "st-hablar", "Every form of hablar and estudiar appears in this text."],
  ["comer-y-vivir", "st-comer-vivir", "comer and vivir in context."],
  ["irregulares", "st-irregulares", "ser, estar, ir and tener, all in one short family."],
];

for (const [lessonId, storyId, note] of attach) {
  const target = lesson(lessonId);
  if (target.sections.some((s: { type: string }) => s.type === "story")) {
    throw new Error(`${lessonId} already has a story section`);
  }
  if (target.quiz.questions.some((q: { type: string }) => q.type === "choice")) {
    // fine, keep going
  }
  target.sections.push({ type: "story", title: "Mini story", note, storyId });
  // Story comprehension joins the lesson quiz rather than replacing it.
  const story = f.stories.find((s) => s.id === storyId);
  target.quiz.questions.push(...story.questions);
  target.quiz.id = `${lessonId}-quiz`;
}

// 2. Extend the numbers lesson to hundreds and thousands.
const numeros = lesson("numeros");
numeros.subtitle = "Counting from cero to mil";
const sections = numeros.sections as Array<Record<string, unknown>>;
sections.splice(1, 0, {
  type: "numbers",
  title: "Cien a novecientos",
  note: "From 200 on the ending is -cientos, and the rest of the number follows with 'y': doscientos cincuenta = 250.",
  wordIds: [
    "doscientos",
    "trescientos",
    "cuatrocientos",
    "quinientos",
    "seiscientos",
    "setecientos",
    "ochocientos",
    "novecientos",
  ],
});
sections.splice(2, 0, {
  type: "numbers",
  title: "Mil y más",
  note: "mil never takes an s and never changes form: dos mil, quinientas mil. It needs 'un' only on its own: un kilo.",
  wordIds: ["mil", "dosmil", "diezmil", "cienmil", "millon"],
});
sections.push({
  type: "text",
  title: "How hundreds actually work",
  body: "Below 100 you need 'y' before the last digit. From 100 to 999 the same rule holds, but with -cientos:\n\ndoscientos (200)\ndoscientos cincuenta (250) — not 'doscientos y cincuenta'\nquinientos noventa y nueve (599)\nnovecientos noventa y nueve (999)\n\nThen it resets to plain arithmetic:\n\nmil (1000)\ndos mil (2000)\ndiez mil (10000)\ncien mil (100000)\nun millón (1000000) — with an accent\n\nWatch the two irregular spellings: quinientos has a q and no c, and seiscientos keeps the x. Everything else is mechanical.",
});
numeros.quiz.questions.push(
  { type: "fill", prompt: "250 = ___", answer: "doscientos cincuenta" },
  { type: "fill", prompt: "500 = ___", answer: "quinientos" },
  { type: "fill", prompt: "2000 = ___", answer: "dos mil" },
  {
    type: "choice",
    prompt: "Which is 600?",
    options: [
      { value: "seiscientos", correct: true },
      { value: "seicientos", correct: false },
      { value: "siescientos", correct: false },
      { value: "seisciento", correct: false },
    ],
  },
  {
    type: "choice",
    prompt: "Why is it 'doscientos cincuenta' and not 'doscientos y cincuenta'?",
    options: [
      { value: "Because hundreds take -cientos and then add the rest directly", correct: true },
      { value: "Because 'y' is only used below 100", correct: false },
      { value: "Because fifty is a different word after a hundred", correct: false },
      { value: "It is a spelling mistake and both are wrong", correct: false },
    ],
    explanation: {
      en: "The 'y' rule applies to tens and units (treinta y uno), not to hundreds + tens (doscientos treinta y uno — the y does appear there).",
    },
  },
);

// 3. New lesson: dates and the time of day, inserted after numeros.
const fechas = {
  id: "fechas",
  order: 3,
  title: "Fechas y hora",
  subtitle: "Counting to a thousand, dates, and telling the time",
  source: { kind: "authored" },
  sections: [
    {
      type: "numbers",
      title: "Los mil y más",
      note: "mil is invariable. Only 'un mil' or 'mil' on its own, never 'dos mil' with an s.",
      wordIds: ["mil", "dosmil", "diezmil", "cienmil", "millon"],
    },
    {
      type: "words",
      title: "Los días y los meses",
      note: "Days and months are masculine, and use 'de' before the year: el quince de marzo.",
      wordIds: ["dia", "semana", "mes", "ano", "hoy", "ayer", "lunes", "fin", "comienzo"],
    },
    {
      type: "words",
      title: "La hora",
      note: "es una hora (one o o'clock) · es la una (one) · a las dos. The hour after 'es' drops the 's'.",
      wordIds: ["hora", "mediodia", "medianoche", "y-media", "y-cuarto", "menos-cuarto"],
    },
    {
      type: "text",
      title: "Telling the time",
      body: "Spanish builds the time around the half hour:\n\nEs la una. (1:00)\nEs la una y media. (1:30)\nEs la una menos cuarto. (12:45)\nSon las tres. (3:00)\nSon las tres y cuarto. (3:15)\nSon las tres y media. (3:30)\nSon las cuatro menos cuarto. (3:45)\n\nTwo things trip people up. First, 'es' only for one o'clock; everything else is 'son'. Second, everything after la una behaves like a plural number, so it takes y: las tres y media, not *la tres y media.\n\nFor a date, day first, then 'de' month, then 'de' year:\n\nel quince de marzo de dos mil veinticuatro (15 March 2024)\n\nAnd a quick note on the big numbers you just learned: for a date you do NOT use y between the hundreds and the tens. Mil ochocientos noventa y cinco = 1895, but it becomes mil ochocientos noventa y cinco in the year — the y stays, because it is joining tens and units, not hundreds.",
    },
    {
      type: "text",
      title: "Ordinals in brief",
      body: "You will meet these, and they are easier than they look:\n\nprimero (1º) · segundo · tercero · cuarto · quinto\n\nFrom the fourth onwards they are regular -o forms: sexto, séptimo (with an accent), octavo, noveno, décimo.\n\nThe 20th and up are plain: el vigésimo segundo = 22nd. From the 30th, el ordinal is exactly the tens word plus -ésimo: el trigésimo (30th), el cuadragésimo (40th).",
    },
    { type: "story", title: "Mini story", note: "Dates and times in a real conversation.", storyId: "st-fechas" },
  ],
  quiz: {
    id: "fechas-quiz",
    title: "Fechas y hora quiz",
    passThreshold: 0.8,
    questions: [
      { type: "choice", prompt: "How do you say 3:30?", options: [
        { value: "Son las tres y media", correct: true },
        { value: "Es las tres y media", correct: false },
        { value: "Son la tres y media", correct: false },
        { value: "Es la tres y medio", correct: false },
      ] },
      { type: "choice", prompt: "Why is it 'es la una' but 'son las tres'?", options: [
        { value: "'Es' is only used for one o'clock; the rest are plural", correct: true },
        { value: "'Es' is used in the morning, 'son' in the afternoon", correct: false },
        { value: "There is no difference", correct: false },
        { value: "'Son' is only used after a number", correct: false },
      ], explanation: { en: "One o'clock is singular in Spanish: es la una. Everything else is a plural number: son las tres." } },
      { type: "choice", prompt: "Which date is correctly written?", options: [
        { value: "el quince de marzo de dos mil veinticuatro", correct: true },
        { value: "el quince marzo dos mil veinticuatro", correct: false },
        { value: "de el quince de marzo", correct: false },
        { value: "el marzo quince del dos mil", correct: false },
      ] },
      { type: "fill", prompt: "3:45 = Son las cuatro ___ cuarto.", answer: "menos" },
      { type: "fill", prompt: "1895 = mil ochocientos ___ y cinco", answer: "noventa" },
      { type: "fill", prompt: "How do you say 22nd?", promptLang: "es", answer: "vigésimo segundo", accept: ["vigésimo segundo", "vigesimo segundo"] },
      { type: "choice", prompt: "What does 'el fin de semana' mean?", options: [
        { value: "the weekend", correct: true },
        { value: "the end of the year", correct: false },
        { value: "the beginning of the week", correct: false },
        { value: "the last day", correct: false },
      ] },
    ],
  },
};
chapter.lessons.push(fechas);
fechas.quiz.questions.push(...f.stories.find((s) => s.id === "st-fechas").questions);

// 4. Renumber every lesson, and move the review lesson back to the end.
const order = [
  "saludos", "numeros", "fechas", "colores", "hablar-presente",
  "comer-y-vivir", "irregulares", "lectura-mercado", "lectura-casa", "repaso",
];
chapter.lessons.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
chapter.lessons.forEach((l, i) => {
  l.order = i + 1;
});
chapter.lessons.forEach((l) => {
  l.quiz.id = `${l.id}-quiz`;
});

const ids = chapter.lessons.map((l) => l.id);
if (new Set(ids).size !== ids.length) throw new Error("duplicate lesson id after renumber");
if (ids.some((id) => !order.includes(id))) throw new Error(`unexpected lesson: ${ids}`);

await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log(`chapter 1 lessons: ${chapter.lessons.length}`);
console.log(chapter.lessons.map((l, i) => `  ${i + 1}. ${l.id} (${l.sections.length} sections, ${l.quiz.questions.length} q)`).join("\n"));
