/**
 * One-off content edit: Chapter 3's ten lessons on the past, and publish it.
 *
 * Run with: bun scripts/add-ch3-lessons.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const chapter = f.chapters.find((c) => c.id === "chapter-3");
if (!chapter) throw new Error("chapter-3 missing");
if (chapter.lessons.length) throw new Error("chapter-3 already has lessons");

const word = (id: string) => {
  if (!f.words.some((w) => w.id === id)) throw new Error(`unknown word "${id}"`);
  return id;
};
const story = (id: string) => {
  const found = f.stories.find((s) => s.id === id);
  if (!found) throw new Error(`unknown story "${id}"`);
  return found;
};

type Q = Record<string, unknown>;
const conj = (verbId: string, tense: string, persona: string): Q => ({
  type: "conjugation",
  verbId,
  tense,
  persona,
});
const fill = (prompt: string, answer: string, accept?: string[]): Q =>
  accept ? { type: "fill", prompt, answer, accept } : { type: "fill", prompt, answer };
const pick = (prompt: string, right: string, wrong: string[]): Q => ({
  type: "choice",
  prompt,
  options: [right, ...wrong].map((value, i) => ({ value, correct: i === 0 })),
});

const PAST = ["preterite", "imperfect"];

const lessons: unknown[] = [
  {
    id: "ch3-preterite-regular",
    order: 1,
    title: "El pretérito regular",
    subtitle: "What happened, and it is finished",
    sections: [
      {
        type: "conjugation",
        title: "hablar y comer",
        note: "Three endings carry almost all of it: -é/ió for yo and él, and -aste/iste for tú. The nosotros form is the bare stem.",
        verbIds: ["hablar", "comer"],
        tenses: ["preterite"],
      },
      {
        type: "text",
        title: "Reading the endings",
        body: "Once you know three endings you can complete any regular preterite:\n\n-AR:  habl-é · habl-aste · habl-ó · hablamos · hablasteis · hablaron\n-ER:  com-í · com-iste · com-ió · comimos · comisteis · comieron\n-IR:  viv-í · viv-iste · vivió · vivimos · vivisteis · vivieron\n\n-e verbs and -er/-ir verbs differ only in the yo and tú endings, and even then they rhyme: é/aste against í/iste.\n\nThe preterite is for events with a beginning and an end. 'I spoke' is done: hablé. That is the whole difference from the imperfect, which is lesson 2.",
      },
    ],
    quiz: {
      id: "ch3-preterite-regular-quiz",
      title: "Pretérito regular quiz",
      passThreshold: 0.8,
      questions: [
        conj("hablar", "preterite", "yo"),
        conj("hablar", "preterite", "tu"),
        conj("hablar", "preterite", "el"),
        conj("hablar", "preterite", "nosotros"),
        conj("hablar", "preterite", "ellos"),
        conj("comer", "preterite", "yo"),
        conj("comer", "preterite", "el"),
        conj("vivir", "preterite", "yo"),
        conj("vivir", "preterite", "ellos"),
        pick("Which nosotros form is correct for hablar?", "hablamos", [
          "hablábamos",
          "hablaron",
          "hablásemos",
        ]),
      ],
    },
  },
  {
    id: "ch3-imperfecto",
    order: 2,
    title: "El imperfecto",
    subtitle: "Habits, backgrounds, and no clear end",
    sections: [
      {
        type: "conjugation",
        title: "hablar, comer, vivir",
        note: "This one is almost free: -er and -ir share every ending, and nothing changes except in three verbs.",
        verbIds: ["hablar", "comer", "vivir"],
        tenses: ["imperfect"],
      },
      {
        type: "text",
        title: "What the imperfect is for",
        body: "The imperfect describes things with no clear start or end: habits, states, backgrounds, and things going on while something else happens.\n\n-AR:  habl-aba · habl-abas · habl-aba · habl-ábamos · habl-abais · habl-aban\n-ER:  com-ía · com-ías · com-ía · com-íamos · com-íais · com-ían\n-IR:  viv-ía · viv-ías · viv-ía · viv-íamos · viv-íais · viv-ían\n\nOnly three verbs are irregular: era (ser), iba (ir), veía (ver).\n\nThe test is the English one. 'I used to live there' is imperfect: Yo vivía allí. 'I lived there for three years' is a completed stretch, so preterite: Viví allí tres años.\n\nWith two verbs in one sentence, put the background in the imperfect and the event in the preterite:\n\nLlovía cuando salí. (It was raining when I left.)",
      },
    ],
    quiz: {
      id: "ch3-imperfecto-quiz",
      title: "Imperfecto quiz",
      passThreshold: 0.8,
      questions: [
        conj("hablar", "imperfect", "yo"),
        conj("hablar", "imperfect", "nosotros"),
        conj("comer", "imperfect", "tu"),
        conj("vivir", "imperfect", "ellos"),
        conj("ser", "imperfect", "yo"),
        conj("ir", "imperfect", "nosotros"),
        pick("Which is the imperfect of ser?", "era", ["fue", "fui", "iré"]),
        pick(
          "Which sentence is correct?",
          "Llovía cuando salí",
          ["Llovió cuando salía", "Lluve cuando salí", "Llovería cuando salí"],
        ),
      ],
    },
  },
  {
    id: "ch3-cuando-eleccion",
    order: 3,
    title: "Elegir la forma",
    subtitle: "Preterite or imperfect? A decision you can actually make",
    sections: [
      {
        type: "text",
        title: "The decision",
        body: "There is no rule you can apply mechanically. But there are patterns:\n\nUse the PRETERITE when the action:\n· is a single completed event (fui, hablé, compré)\n· has a clear start and end (trabajé seis meses)\n· is stated as a fact (Ayer llegué tarde.)\n· is a series of events in sequence (llegué, comí, volví)\n\nUse the IMPERFECT when the action:\n· describes a habit (hablaba todos los días)\n· describes a background state (era pequeño)\n· sets the scene for another action (llovía cuando...)\n· has no stated end (vivía en Madrid)\n\nMixed sentences are the interesting case. The imperfect is the scenery, the preterite is the event:\n\nHacía sol cuando salimos. (The sun was shining when we left.)\n\nAnd note the asymmetry in the trigger words:\n\nsiempre, nunca, a menudo, todos los días → usually imperfect\nayer, anoche, la semana pasada, el año pasado → usually preterite\n\nsiempre is the exception that proves the rule. 'Siempre fui feliz' is a fact about a whole stretch of life, so preterite. But 'Siempre cantaba' is a habit, so imperfect.",
      },
    ],
    quiz: {
      id: "ch3-cuando-eleccion-quiz",
      title: "Choosing the tense",
      passThreshold: 0.75,
      questions: [
        pick(
          "Which time marker points to the imperfect?",
          "todos los días",
          ["ayer", "anoche", "la semana pasada"],
        ),
        pick("'I was sleeping when the phone rang.' The sleeping is:", "dormía", [
          "dormí",
          "dormiré",
          "duermo",
        ]),
        pick("'I read the book when I was ten.' Which is the reading?", "leí", [
          "leía",
          "leeré",
          "leo",
        ]),
        pick("Which sentence sets a scene with the imperfect?", "Llovía cuando salimos", [
          "Llovió cuando llueve",
          "Lloverá cuando salió",
          "Llueve cuando salió",
        ]),
        pick(
          "'Nunca fui a Japón.' Why is this preterite despite the 'nunca'?",
          "It states a single fact about your life",
          ["Nunca is always imperfect", "It is a habit", "It is not a real sentence"],
        ),
      ],
    },
  },
  {
    id: "ch3-irregulares-pasado",
    order: 4,
    title: "El pretérito irregular",
    subtitle: "Fui, estuve, tuve, hice",
    source: {
      kind: "generated",
      generator: "verbDrill",
      args: { verbId: "ser", tenses: "preterite", questionTense: "preterite" },
      extraQuestions: [
        conj("ir", "preterite", "yo"),
        conj("estar", "preterite", "yo"),
        conj("tener", "preterite", "yo"),
        conj("hacer", "preterite", "yo"),
        conj("decir", "preterite", "yo"),
        conj("poder", "preterite", "yo"),
        pick(
          "ser and ir share which preterite form?",
          "All of them: fui, fuiste, fue, fuimos, fuisteis, fueron",
          ["Only yo", "Only the tú form", "Only nosotros"],
        ),
        pick("How do you say 'I was' in the imperfect?", "era", ["fui", "esté", "estaba"]),
        pick("How do you say 'I went' in the preterite?", "fui", ["iba", "iré", "estaba"]),
      ],
    },
  },
  {
    id: "ch3-cambio-vocal",
    order: 5,
    title: "Cambio vocal",
    subtitle: "duermo, pido, siento — and durmió, pidió",
    source: {
      kind: "generated",
      generator: "verbDrill",
      args: { verbId: "dormir", tenses: PAST.join(","), questionTense: "preterite" },
      extraQuestions: [
        conj("dormir", "present", "yo"),
        conj("dormir", "preterite", "el"),
        conj("pedir", "present", "nosotros"),
        conj("pedir", "preterite", "ellos"),
        conj("sentir", "present", "el"),
        conj("sentir", "preterite", "ellos"),
        pick(
          "In the present, how many personae of dormir change the stem?",
          "Four: yo, tú, él, ellos",
          ["One: yo", "Two", "All six"],
        ),
        pick("In the preterite, how many personae of dormir change the stem?", "Two: él, ellos", [
          "Four: yo, tú, él, ellos",
          "One: yo",
          "All six",
        ]),
        pick(
          "Which is correct?",
          "pidió",
          ["pidío", "pidiò", "pidó"],
        ),
      ],
    },
  },
  {
    id: "ch3-mas-vocabulario",
    order: 6,
    title: "Palabras del pasado",
    subtitle: "The vocabulary a story about yesterday needs",
    sections: [
      {
        type: "words",
        title: "Tiempo",
        note: "These words pull a sentence towards the past tense. Notice que yesterday is always in the preterite.",
        wordIds: [
          word("anoche"),
          word("anteayer"),
          word("la-semana-pasada"),
          word("el-verano-pasado"),
          word("hoy"),
          word("ayer"),
        ],
      },
      {
        type: "words",
        title: "Frecuencia y lugares",
        wordIds: [
          word("siempre"),
          word("nunca"),
          word("a-menudo"),
          word("todos-los-dias"),
          word("cada-ano"),
          word("la-playa"),
          word("el-viaje"),
          word("la-reunion"),
        ],
      },
      {
        type: "text",
        title: "Two verbs for 'was'",
        body: "Spanish has no single 'was'. Which one you use decides whether the sentence reads as background or as an event:\n\nEra pequeño. — He was small. A lasting fact, so imperfect.\nEstaba cansado. — He was tired. A temporary state, so imperfect.\nHubo un problema. — There was a problem. A single event, so preterite.\n\nAnd a useful pair of formulas for the story tense:\n\nDe pequeño, jugaba en la calle.\nAl día siguiente, me mudé de ciudad.\n\nThe first sets up a background with the imperfect. The second moves the story forward with the preterite. Reading them together is how the past becomes narrative rather than a list.",
      },
    ],
    quiz: {
      id: "ch3-mas-vocabulario-quiz",
      title: "Past vocabulary quiz",
      passThreshold: 0.75,
      questions: [
        fill("___ = last night", "anoche"),
        fill("___ = every day", "todos los días"),
        pick("Which marker goes with the imperfect?", "siempre", ["ayer", "anoche", "anteayer"]),
        pick(
          "'There was a problem' — which form?",
          "Hubo un problema",
          ["Había un problema", "Hay un problema", "Habrá un problema"],
        ),
        pick(
          "'He was tired' (temporary) — which form?",
          "Estaba cansado",
          ["Era cansado", "Es cansado", "Estará cansado"],
        ),
        pick(
          "What does 'De pequeño, jugaba en la calle' use, and why?",
          "Imperfect, because it sets a background",
          ["Preterite, because it is past", "Present, because habits are present", "Future"],
        ),
      ],
    },
  },
  {
    id: "ch3-lectura-verano",
    order: 7,
    title: "Lectura: el verano pasado",
    subtitle: "Narrative in both past tenses",
    sections: [
      {
        type: "story",
        title: "El verano pasado",
        note: "Watch the split: the trip is preterite (fui, nadábamos is imperfect — see if you can spot why each was chosen).",
        storyId: story("st-verano-pasado").id,
      },
    ],
    quiz: {
      id: "ch3-lectura-verano-quiz",
      title: "Reading comprehension",
      passThreshold: 0.75,
      questions: story("st-verano-pasado").questions,
    },
  },
  {
    id: "ch3-lectura-informe",
    order: 8,
    title: "Lectura: el informe",
    subtitle: "Short, formal, and full of preterite",
    sections: [
      {
        type: "story",
        title: "El informe",
        note: "This passage leans almost entirely on the preterite, because it reports events that are over.",
        storyId: story("st-informe").id,
      },
    ],
    quiz: {
      id: "ch3-lectura-informe-quiz",
      title: "Reading comprehension",
      passThreshold: 0.75,
      questions: story("st-informe").questions,
    },
  },
  {
    id: "ch3-reflexivos-pasado",
    order: 9,
    title: "Reflexivos en el pasado",
    subtitle: "Me levanté, nos acostamos",
    sections: [
      {
        type: "conjugation",
        title: "levantarse y ducharse",
        note: "Reflexive verbs take the regular preterite endings with the pronoun in front. There are no irregular reflexives to memorise here.",
        verbIds: ["levantarse", "ducharse", "acostarse"],
        tenses: PAST,
      },
      {
        type: "text",
        title: "Narrating a day",
        body: "Put the two tenses side by side and you get a whole day:\n\nMe levanté a las siete. Me duché en diez minutos. Antes dormía hasta las nueve, pero esta semana me levanté temprano todos los días.\n\nThe first three verbs are preterite: a specific morning, a specific shower. The 'antes' sentence switches to imperfect because it describes the general old habit.\n\nNotice that me, te, se, nos and os do not change with tense. That is convenient: only the verb ending moves between these two tables.",
      },
    ],
    quiz: {
      id: "ch3-reflexivos-pasado-quiz",
      title: "Reflexive verbs in the past",
      passThreshold: 0.8,
      questions: [
        conj("levantarse", "preterite", "yo"),
        conj("levantarse", "preterite", "nosotros"),
        conj("levantarse", "imperfect", "yo"),
        conj("ducharse", "preterite", "ellos"),
        conj("acostarse", "preterite", "yo"),
        conj("acostarse", "imperfect", "nosotros"),
        fill("Me ___ (levantarse) a las siete.", "levanté"),
        fill("Nosotros ___ (acostarse) tarde.", "nos acostamos"),
      ],
    },
  },
  {
    id: "ch3-repaso",
    order: 10,
    title: "Repaso",
    subtitle: "Chapter 3 mixed drill",
    sections: [
      {
        type: "text",
        title: "What you now know",
        body: "• The regular preterite for -ar, -er and -ir\n• The imperfect, which is nearly identical for -er and -ir\n• ser, ir and ver as the only irregular imperfects\n• Fifteen irregular preterites: fui, estuve, tuve, hice, dije, pude...\n• Stem-changing -ir verbs in the present and the preterite\n• Reflexive verbs across both tenses\n• Using time markers to choose, and mixing the two in one sentence\n\nThis quiz mixes every tense. Getting most of it right means Chapter 4 is within reach.",
      },
    ],
    quiz: {
      id: "ch3-repaso-quiz",
      title: "Chapter 3 review",
      passThreshold: 0.8,
      questions: [
        conj("hablar", "preterite", "yo"),
        conj("hablar", "imperfect", "yo"),
        conj("comer", "preterite", "tu"),
        conj("vivir", "imperfect", "nosotros"),
        conj("ser", "preterite", "el"),
        conj("ir", "imperfect", "tu"),
        conj("estar", "preterite", "yo"),
        conj("tener", "preterite", "ellos"),
        conj("hacer", "preterite", "yo"),
        conj("decir", "preterite", "nosotros"),
        conj("dormir", "preterite", "el"),
        conj("pedir", "preterite", "ellos"),
        conj("levantarse", "preterite", "yo"),
        conj("acostarse", "imperfect", "el"),
        pick("Which is the preterite of 'we were'?", "fuimos", ["éramos", "somos", "seremos"]),
        pick("Which sentence mixes both tenses correctly?", "Dormía cuando sonó el teléfono", [
          "Durmió cuando sonaba el teléfono",
          "Dormí cuando suena",
          "Dorme cuando sonó",
        ]),
      ],
    },
  },
];

chapter.lessons = lessons as never;
chapter.status = "published";
chapter.lessons.forEach((l: { order: number }, i: number) => {
  l.order = i + 1;
});

await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log(`chapter-3 lessons: ${chapter.lessons.length}, status: ${chapter.status}`);
