/**
 * One-off content edit: Chapter 2's ten lessons, and publish the chapter.
 *
 * Conjugation drills use the `verbDrill` generator, so each is one line of
 * recipe rather than a hand-written table and quiz. Explanatory lessons and the
 * two readings are authored.
 *
 * Run with: bun scripts/add-ch2-lessons.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const chapter = f.chapters.find((c) => c.id === "chapter-2");
if (!chapter) throw new Error("chapter-2 missing");
if (chapter.lessons.length) throw new Error("chapter-2 already has lessons");

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
const conj = (verbId: string, persona: string): Q => ({
  type: "conjugation",
  verbId,
  tense: "present",
  persona,
});
const fill = (prompt: string, answer: string, accept?: string[]): Q =>
  accept ? { type: "fill", prompt, answer, accept } : { type: "fill", prompt, answer };
const pick = (prompt: string, right: string, wrong: string[], promptLang?: string): Q => ({
  type: "choice",
  prompt,
  promptLang,
  options: [right, ...wrong].map((value, i) => ({ value, correct: i === 0 })),
});

/** Authored lessons carry their own sections and quiz. */

const lessons: unknown[] = [
  {
    id: "ch2-querer-decir",
    order: 1,
    title: "Querer y decir",
    source: {
      kind: "generated",
      generator: "verbDrill",
      args: { verbId: "querer" },
      extraQuestions: [
        conj("decir", "yo"),
        conj("decir", "nosotros"),
        conj("decir", "ellos"),
        pick("Which sentence is correct?", "Quiero un café", [
          "Querer un café",
          "Quiero un café por favor querer",
          "Yo querer un café",
        ]),
      ],
    },
  },
  {
    id: "ch2-poder-saber",
    order: 2,
    title: "Poder y saber",
    source: {
      kind: "generated",
      generator: "verbDrill",
      args: { verbId: "poder" },
      extraQuestions: [
        conj("saber", "yo"),
        pick(
          "You know how to cook. Which is it?",
          "Sé cocinar",
          ["Puedo cocinar", "Soy cocinar", "Tengo cocinar"],
        ),
        pick(
          "You are able to come, but you won't. Which is right?",
          "Puedo venir, pero no quiero",
          ["Sé venir, pero no quiero", "Quiero poder, pero no sé", "Poderé, pero no soy"],
        ),
      ],
    },
  },
  {
    id: "ch2-hacer-dar",
    order: 3,
    title: "Hacer y dar",
    source: {
      kind: "generated",
      generator: "verbDrill",
      args: { verbId: "hacer" },
      extraQuestions: [
        conj("dar", "yo"),
        conj("dar", "vosotros"),
        pick("How do you say 'it is cold'?", "Hace frío", [
          "Es frío",
          "Tiene frío",
          "Está frío el",
        ]),
        pick("How do you say 'they give me the book'?", "Me dan el libro", [
          "Me da el libro",
          "Dan me el libro",
          "Yo dan el libro",
        ]),
      ],
    },
  },
  {
    id: "ch2-venir-salir",
    order: 4,
    title: "Venir y salir",
    source: {
      kind: "generated",
      generator: "verbDrill",
      args: { verbId: "venir" },
      extraQuestions: [
        conj("salir", "yo"),
        conj("salir", "ellos"),
        pick("Which form is NOT regular?", "vienes", ["venimos", "venís", "vengo"]),
        pick("Why is 'vienes' irregular?", "The e changes to ie in the stem", [
          "It takes an accent",
          "It adds an extra n",
          "It is the plural form",
        ]),
      ],
    },
  },
  {
    id: "ch2-reflexivos",
    order: 5,
    title: "Verbos reflexivos",
    subtitle: "Me levanto, te quedas, se ducha",
    sections: [
      {
        type: "conjugation",
        title: "levantarse",
        note: "The stem is completely regular. All the work is in the pronoun, which goes in front and changes with the persona.",
        verbIds: ["levantarse"],
      },
      {
        type: "conjugation",
        title: "acostarse and quedarse",
        note: "acostarse is stem-changing like acostar: me acuesto, but nos acostamos.",
        verbIds: ["acostarse", "quedarse"],
      },
      {
        type: "text",
        title: "How reflexives actually work",
        body: "A reflexive verb points the action back at the subject. The infinitive ends in -se, but that -se is not a word you say. It splits into a pronoun that goes in front:\n\nlevantarse → me levanto · te levantas · se levanta\nnos levantamos · os levantáis · se levantan\n\nThree things to notice:\n\nél and ellos share se, because Spanish does not mark gender here. That is not a mistake.\n\nThe nos- and os- forms are identical to the plain verb: nos levantamos, os levantáis.\n\nMany reflexives take a preposition rather than a direct object, and that preposition often carries meaning in English that surprises you:\n\nacostarse a las once (to bed at eleven) · ducharse con agua fría\nlevantarse de madrugada (get up at dawn)\n\nYou can spot a reflexive by the pronoun sitting in front of the verb. If you see me, te, se, nos or os before a verb, look for a reflexive.",
      },
    ],
    quiz: {
      id: "ch2-reflexivos-quiz",
      title: "Reflexivos quiz",
      passThreshold: 0.8,
      questions: [
        ...["yo", "tu", "el", "nosotros", "vosotros", "ellos"].map((p) => conj("levantarse", p)),
        { type: "fill", prompt: "Nosotros ___ (acostarse) tarde.", answer: "nos acostamos" },
        { type: "fill", prompt: "Ellos ___ (quedarse) en casa.", answer: "se quedan" },
        pick("Why do él and ellos both use 'se'?", "Spanish does not mark gender on the pronoun", [
          "It is a spelling mistake",
          "They are different words",
          "Ellos is singular in this form",
        ]),
        pick("Which is correct?", "nos acostamos", ["nos acostámos", "acostamos nos", "nos acostamoses"]),
      ],
    },
  },
  {
    id: "ch2-querer-poder-extras",
    order: 6,
    title: "Verbos con infinitivo",
    subtitle: "ir a and tener que: plans and obligations",
    sections: [
      {
        type: "words",
        title: "The two phrases",
        note: "Both take the infinitive, unchanged — never conjugated.",
        wordIds: [word("ir-a"), word("tener-que"), word("querer-decir")],
      },
      {
        type: "text",
        title: "Plans, obligations, and offers",
        body: "Spanish uses the infinitive for things you have not done yet. There are no 'will' or 'must' endings on the verb:\n\nir a + infinitive — I'm going to, I'll\n\tVoy a estudiar. (I'm going to study.)\n\tVamos a ir. (We're going to go.)\n\ntener que + infinitive — I have to, I must\n\tTengo que trabajar. (I have to work.)\n\tTienes que venir. (You have to come.)\n\nTwo more worth learning:\n\nquerer decir — to mean\n\t¿Qué quieres decir? (What do you mean?)\n\npoder + infinitive — to be able to, can\n\t¿Puedes ayudarme? (Can you help me?)\n\nNote the word order: the auxiliary goes in front, the infinitive stays bare. Tener is conjugated, but estudiar never is.\n\nThere is also hay que — 'you have to', impersonal, for rules that apply to everyone:\n\nHay que pagar. (You have to pay.)",
      },
    ],
    quiz: {
      id: "ch2-verbos-infinito-quiz",      title: "Verbos con infinitivo quiz",
      passThreshold: 0.8,
      questions: [
        fill("Voy ___ estudiar español.", "a"),
        fill("Tengo ___ trabajar hoy.", "que"),
        fill("¿Qué quieres ___?", "decir"),
        pick("Which is correct?", "Vamos a ir", ["Vamos ir", "Vamos ir a", "Ir vamos a"]),
        pick(
          "How do you say 'you have to pay' as a general rule?",
          "Hay que pagar",
          ["Tienes que pagarte", "Hay que a pagar", "Vas a pagar"],
        ),
      ],
    },
  },
  {
    id: "ch2-lectura-cafe",
    order: 7,
    title: "Lectura: en el café",
    subtitle: "querer, poder and saber in conversation",
    sections: [
      {
        type: "story",
        title: "En el café",
        note: "Three high-frequency verbs in a single exchange.",
        storyId: story("st-poder-decir").id,
      },
    ],
    quiz: {
      id: "ch2-lectura-cafe-quiz",
      title: "Reading comprehension",
      passThreshold: 0.75,
      questions: story("st-poder-decir").questions,
    },
  },
  {
    id: "ch2-lectura-rutina",
    order: 8,
    title: "Lectura: la rutina",
    subtitle: "Reflexive verbs across every persona",
    sections: [
      {
        type: "story",
        title: "La rutina",
        note: "Every reflexive persona appears in this text: me, se, nos, ellos.",
        storyId: story("st-reflexivos").id,
      },
    ],
    quiz: {
      id: "ch2-lectura-rutina-quiz",
      title: "Reading comprehension",
      passThreshold: 0.75,
      questions: story("st-reflexivos").questions,
    },
  },
  {
    id: "ch2-saberes",
    order: 9,
    title: "Ver y decir",
    subtitle: "Two verbs with no usable pattern",
    source: {
      kind: "generated",
      generator: "verbDrill",
      args: { verbId: "ver" },
      extraQuestions: [
        conj("decir", "tu"),
        conj("decir", "el"),
        pick("How do you say 'you all (Spain) see'?", "veis", [
          "veéis",
          "veréis",
          "veís",
        ]),
        pick(
          "Which is the correct vosotros form of decir?",
          "decís",
          ["decéis", "deciís", "decís"],
        ),
      ],
    },
  },
  {
    id: "ch2-repaso",
    order: 10,
    title: "Repaso",
    subtitle: "Chapter 2 mixed drill",
    sections: [
      {
        type: "text",
        title: "What you now know",
        body: "• querer, decir, poder, saber — the big four\n• hacer, dar, poner — doing and giving\n• venir, salir — motion\n• ver — spelled out, no pattern\n• Reflexives with me / te / se / nos / os\n• ir a + infinitive for plans, tener que for obligations\n\nThis quiz mixes conjugating them with using them.",
      },
    ],
    quiz: {
      id: "ch2-repaso-quiz",
      title: "Chapter 2 review",
      passThreshold: 0.8,
      questions: [
        conj("querer", "yo"),
        conj("querer", "ellos"),
        conj("decir", "yo"),
        conj("decir", "nosotros"),
        conj("poder", "tu"),
        conj("poder", "el"),
        conj("venir", "tu"),
        conj("saber", "yo"),
        conj("hacer", "yo"),
        conj("salir", "yo"),
        conj("levantarse", "yo"),
        conj("acostarse", "ellos"),
        fill("Voy ___ ir.", "a"),
        fill("Tenemos ___ trabajar.", "que"),
        pick("How do you say 'they stay home'?", "se quedan", [
          "se queda",
          "quedan se",
          "se quedanes",
        ]),
      ],
    },
  },
];

chapter.lessons = lessons as never;
chapter.status = "published";

chapter.lessons.forEach((l: { id: string; order: number }, i: number) => {
  l.order = i + 1;
});

await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log(`chapter-2 lessons: ${chapter.lessons.length}, status: ${chapter.status}`);
