/**
 * One-off content edit: Chapter 4's ten lessons on the future and conditional,
 * and publish it.
 *
 * Run with: bun scripts/add-ch4-lessons.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const chapter = f.chapters.find((c) => c.id === "chapter-4");
if (!chapter) throw new Error("chapter-4 missing");
if (chapter.lessons.length) throw new Error("chapter-4 already has lessons");

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
const pick = (prompt: string, right: string, wrong: string[], promptLang?: string): Q => ({
  type: "choice",
  prompt,
  promptLang,
  options: [right, ...wrong].map((value, i) => ({ value, correct: i === 0 })),
});

const FUT = "future";
const COND = "conditional";

const lessons: unknown[] = [
  {
    id: "ch4-futuro-regular",
    order: 1,
    title: "El futuro regular",
    subtitle: "One set of endings for every verb",
    sections: [
      {
        type: "conjugation",
        title: "hablar, comer, vivir",
        note: "Look at the ending column and ignore the verb: all three patterns share it completely.",
        verbIds: ["hablar", "comer", "vivir"],
        tenses: [FUT],
      },
      {
        type: "text",
        title: "The future attaches to the infinitive",
        body: "This is the one place in Spanish where the ending goes onto the whole infinitive:\n\nhablar + é = hablaré\ncomer + é = comeré\nvivir + é = viviré\n\nThat is why the future of hablar is hablaré and not hablé — hablé is the preterite, which you already know. The two look almost identical and mean completely different things:\n\nHablé con ella. (I spoke to her. Done, in the past.)\nHablaré con ella. (I will speak to her. Later.)\n\nThe endings, for all three patterns:\n\n-é · -ás · -á · -emos · -éis · -án\n\nhablaré, hablarás, hablará, hablaremos, hablaréis, hablarán\ncomeré, comerás, comerá, comeremos, comeréis, comerán\nviviré, vivirás, vivía, viviremos, viviréis, vivirán\n\nTwo things to watch. First, el and ellos have the same form (hablará / hablarán), unlike the present where él is habla. Second, there is no irregular yo form in the future at all — unlike the present, where half the verbs have one.",
      },
    ],
    quiz: {
      id: "ch4-futuro-regular-quiz",
      title: "Futuro regular quiz",
      passThreshold: 0.8,
      questions: [
        conj("hablar", FUT, "yo"),
        conj("hablar", FUT, "tu"),
        conj("hablar", FUT, "el"),
        conj("hablar", FUT, "nosotros"),
        conj("hablar", FUT, "ellos"),
        conj("comer", FUT, "yo"),
        conj("comer", FUT, "ellos"),
        conj("vivir", FUT, "yo"),
        pick("What is the future of hablar, yo?", "hablaré", ["hablé", "hablré", "hablaró"]),
        pick("Why do él and ellos share a form in the future?", "Spanish does not mark the difference", [
          "It is a mistake",
          "Ellos has no future",
          "Él does not have a future",
        ]),
      ],
    },
  },
  {
    id: "ch4-futuro-irregular",
    order: 2,
    title: "Nueve verbos irregulares",
    subtitle: "tener→tendré, poder→podré, decir→diré",
    source: {
      kind: "generated",
      generator: "verbDrill",
      args: { verbId: "tener", tenses: FUT, questionTense: FUT },
      extraQuestions: [
        conj("poder", FUT, "yo"),
        conj("hacer", FUT, "yo"),
        conj("decir", FUT, "yo"),
        conj("salir", FUT, "yo"),
        conj("venir", FUT, "yo"),
        conj("poner", FUT, "yo"),
        conj("saber", FUT, "yo"),
        conj("querer", FUT, "yo"),
        pick("Which is the future of hacer?", "haré", ["hacé", "haréé", "haceé"]),
        pick("How many verbs have an irregular future stem?", "Nine", ["Three", "Sixteen", "None"]),
        pick(
          "What do all nine irregular verbs do to their stem?",
          "They shorten it by dropping the infinitive ending",
          ["They add an accent", "They change ar to er", "They drop the first letter"],
        ),
        fill("___ (salir) mañana a las ocho.", "Saldré"),
        fill("___ (decir) la verdad.", "Diré"),
      ],
    },
  },
  {
    id: "ch4-planes",
    order: 3,
    title: "Planes: ir a vs. el futuro",
    subtitle: "Two ways to say the same thing",
    sections: [
      {
        type: "words",
        title: "Talking about plans",
        note: "These all point forwards in time.",
        wordIds: [
          word("los-planes"),
          word("vacaciones"),
          word("dentro-de"),
          word("la-semana-que-viene"),
          word("el-proximo-ano"),
          word("quizas"),
        ],
      },
      {
        type: "text",
        title: "Two futures for one meaning",
        body: "Spanish has two ways to talk about the future, and the difference is small.\n\nir a + infinitive — for plans you have already made\n\tVoy a estudiar. (I'm going to study.)\n\tVamos a ir a la playa. (We're going to go to the beach.)\n\nel futuro — for predictions, promises, or the plain future\n\tVa a llover. (It is going to rain. / It will rain.)\n\tEstudiaré más. (I will study more.)\n\nIn conversation the difference is often nil: 'I will come' can beiré or voy a ir. Use whichever sounds better, and default to ir a for arrangements:\n\nVoy a llamar al médico. (I'm going to call the doctor. — decided)\n\t\t\t\tLlamaré al médico. (I will call the doctor. — promised)\n\nAdverbs of likelihood sit neatly here:\n\nSeguro que llamaré. (I will definitely call.)\n\t\t\t  Probablemente llamaré. (I will probably call.)\n\t\t\t  Quizá llame. (Maybe I'll call.)\n\nNotice quizá usually takes the conditional — 'maybe I'll call' as a guess, not a plan. You'll meet that in lesson 4.",
      },
    ],
    quiz: {
      id: "ch4-planes-quiz",
      title: "Plans quiz",
      passThreshold: 0.8,
      questions: [
        fill("Voy ___ estudiar esta noche.", "a"),
        fill("Mañana ___ llamar al médico. (I will call)", "llamaré"),
        pick("Which is a prediction rather than a plan?", "Va a llover", [
          "Voy a llevar paraguas",
          "Vamos a salir ahora",
          "Voy a comprar un paraguas",
        ]),
        pick("How do you say 'we will go'?", "Iremos", ["Iremos a", "Vamos ir", "Iremos de"]),
        fill("Seguro que ___ llamar. (I will definitely call)", "llamaré"),
        pick(
          "Which time expression points furthest into the future?",
          "dentro de un año",
          ["ahora mismo", "hace dos años", "el mes pasado"],
        ),
      ],
    },
  },
  {
    id: "ch4-condicional",
    order: 4,
    title: "El condicional",
    subtitle: "Would, could, should — and being polite",
    sections: [
      {
        type: "conjugation",
        title: "hablar, tener, poder",
        note: "Same stems as the future, different endings. There are no irregular conditionals at all.",
        verbIds: ["hablar", "tener", "poder", "ir"],
        tenses: [COND],
      },
      {
        type: "text",
        title: "The most useful tense you have not met",
        body: "The conditional does one job very well: it softens a sentence. Spanish uses it where English uses 'would', 'could', 'should' and 'may'.\n\n¿Podrías abrirme la puerta? (Could you open the door?)\n\t\t\t\t\t\t\tMe gustaría un café. (I would like a coffee.)\n\t\t\t\t\t\t\tDeberías descansar. (You should rest.)\n\t\t\t\t\t\t\tVamos a la playa, ¿verdad? — Sí, preferiría no ir. (I'd rather not go.)\n\nThe endings are identical for every pattern:\n\n-ía · -ías · -ía · -íamos · -íais · -ían\n\nhablaría, hablarías, hablaría, hablaríamos, hablaríais, hablarían\n\nTwo notes on form. él and ellos share again (hablaría / hablarían). And the conditional has no irregular verbs whatsoever — poder is podría, not *poderia, and ir is iría.\n\nUnlike the future, the conditional is not a tense about the future. It is a mood for attitude: what you would do, could do, should do, might do. That is why it turns up in the next lesson inside if-clauses, where it does its real work.",
      },
    ],
    quiz: {
      id: "ch4-condicional-quiz",
      title: "Condicional quiz",
      passThreshold: 0.8,
      questions: [
        conj("hablar", COND, "yo"),
        conj("hablar", COND, "nosotros"),
        conj("tener", COND, "yo"),
        conj("poder", COND, "tu"),
        conj("ir", COND, "ellos"),
        pick("How do you say 'I would like a coffee'?", "Me gustaría un café", [
          "Me gustaré un café",
          "Me gustaría de un café",
          "Me gustaría el un café",
        ]),
        pick("Which conditional is correct?", "podría", ["podria", "podréía", "podria sí"]),
        pick(
          "What does the conditional express?",
          "Attitude: what you would, could or should do",
          ["Only what happens later", "Only past habits", "Only commands"],
        ),
      ],
    },
  },
  {
    id: "ch4-si",
    order: 5,
    title: "Si + condicional",
    subtitle: "The if-clause English speakers get wrong",
    sections: [
      {
        type: "text",
        title: "Two kinds of if",
        body: "English splits its if-clauses in two: 'if it rains, I will stay' (real) and 'if I had money, I would travel' (unreal, past). Spanish does not. It uses the same shape for both, and the difference is only which tense goes in the if-clause.\n\nREAL — the if-clause is present, the result is conditional:\n\nSi llueve, no saldremos. (If it rains, we won't go out.)\nSi no vienes, iré solo. (If you don't come, I'll go alone.)\n\nHYPOTHETICAL — the if-clause is imperfect, the result is conditional:\n\nSi tuviera dinero, viajaría. (If I had money, I would travel.)\n\t\t\t\t\t\t\t\tSi fuera más tarde, me iría a casa. (If it were later, I would go home.)\n\nThis is the part that feels strange at first: 'if I had money' in English uses had, but Spanish uses tuviera — the imperfect. You already know the imperfect from chapter 3, so you are equipped.\n\nA few shapes worth knowing:\n\nsi no — if not: Si no llueve, iremos.\ncuando — when (also takes the two tenses): Cuando llegue, te llamo.\n\t\t\t\t\t\t\t\t\t\t\t\t\t\tCuando era niño, jugaba fuera.\nmientras — while: Mientras esperamos, hablamos.\na menos que — unless: Iré a menos que llueva.\n\nAnd one asymmetry to watch: Spanish has no 'if + would'. The would part goes in the main clause, never after si.",
      },
      {
        type: "text",
        title: "A pattern to steal",
        body: "The hypothetical form is enormously useful for anything you would like but cannot have:\n\nMe gustaría viajar más. (I would like to travel more.)\nSi pudiera, viajaría más. (If I could, I would travel more.)\n\nViviría en el campo. (I would live in the countryside.)\nSi viviera en el campo, no trabajaría tanto. (If I lived in the countryside, I wouldn't work so much.)\n\nNotice that the verb being conditionalised changes between the two sentences. Si + imperfect is not a fixed phrase with one verb; it pairs with whatever verb the sentence is about.",
      },
    ],
    quiz: {
      id: "ch4-si-quiz",
      title: "Si-clauses quiz",
      passThreshold: 0.8,
      questions: [
        pick("'If it rains, we won't go out.' Which is correct?", "Si llueve, no saldremos", [
          "Si lloverá, no saldremos",
          "Si llovía, no saldremos",
          "Si llueve, no salimos",
        ]),
        pick("'If I had money, I would travel.' Which is correct?", "Si tuviera dinero, viajaría", [
          "Si tengo dinero, viajaré",
          "Si tendría dinero, viajaré",
          "Si tuviera dinero, viajaré",
        ]),
        pick(
          "In a real if-clause, which tense goes after si?",
          "Present",
          ["Imperfect", "Conditional", "Future"],
        ),
        pick("How do you say 'if not'?", "si no", ["no si", "sin si", "si nunca"]),
        pick("Which sentence is right?", "Cuando llegue, te llamo", [
          "Cuando llegaré, te llamo",
          "Cuando llegara, te llamé",
          "Cuando llegue, te llamaré",
        ]),
        fill("___ tuviera tiempo, aprendería a tocar la guitarra.", "Si"),
        fill("Iré a la playa ___ (a menos que) llueva.", "a menos que", [
          "a menos que",
          "a menos",
        ]),
      ],
    },
  },
  {
    id: "ch4-hacer-y-otros",
    order: 6,
    title: "Hacer, deber y otras palabras",
    subtitle: "The verbs that surround time and necessity",
    sections: [
      {
        type: "words",
        title: "Hacer with time",
        wordIds: [word("hace-dos-anos"), word("cuanto-hace"), word("hace-falta"), word("ahora-mismo")],
      },
      {
        type: "text",
        title: "Hacer does three unrelated jobs",
        body: "One of the most useful verbs in Spanish, doing three jobs that have nothing to do with each other.\n\n1. 'ago', with a period of time. Note it is not a verb form you conjugate — hacer stays as it is.\n\n\tHace dos años que no lo veo. (I haven't seen him for two years.)\n\t\t\t\t\t\t\tHace mucho calor. (It's very hot.)\n\t\t\t\t\t\t\tHace falta. (It is needed.)\n\t\t\t\t\t\t\t¿Cuánto hace que esperas? (How long have you been waiting?)\n\n2. as a light verb: hacer + noun, meaning to do or make something.\n\n\tHacer la cena. (To make dinner.)\n\t\tHacer ejercicio. (To exercise.)\n\t\tHacer un viaje. (To take a trip.)\n\n3. periphrasis for near-future obligation, like hay que.\n\n\tHay que pagar. (One has to pay.)\n\t\t\t\t\tVa a hacer falta. (It is going to be needed.)\n\t\t\t\t\tHaces falta. (You are needed.)\n\nAnd a fourth verb doing a similar job, deber:\n\n\tTienes que ir. (You have to go.)\n\t\t\t\tDebes ir. (You must go.)\n\t\t\t\tDeberías ir. (You should go. — conditional, softer)\n\t\t\t\t\t\t\t\t\tDebo ir. (I must go.)",
      },
    ],
    quiz: {
      id: "ch4-hacer-quiz",
      title: "Hacer y otros quiz",
      passThreshold: 0.75,
      questions: [
        fill("___ dos años que no lo veo.", "Hace"),
        fill("___ falta llamar al médico.", "Hay"),
        pick("How do you say 'I haven't seen him for two years'?", "Hace dos años que no lo veo", [
          "Hía dos años no le veo",
          "Hace dos años no lo veo",
          "Estaba dos años no le veo",
        ]),
        pick("How do you say 'you should rest'?", "Deberías descansar", [
          "Debes a descansar",
          "Debes descansarías",
          "Debía descansar",
        ]),
        pick("Which is a light verb use of hacer?", "Hacer ejercicio", [
          "Hacer la calle",
          "Hacer dos años",
          "Hacer falta",
        ]),
      ],
    },
  },
  {
    id: "ch4-vocabulario",
    order: 7,
    title: "Palabras del futuro",
    subtitle: "Time, uncertainty, and making arrangements",
    sections: [
      {
        type: "words",
        title: "Tiempo",
        wordIds: [
          word("la-semana-que-viene"),
          word("el-mes-que-viene"),
          word("el-proximo-ano"),
          word("dentro-de"),
          word("ahora-mismo"),
        ],
      },
      {
        type: "words",
        title: "Certeza",
        note: "These sit in front of a future or conditional form.",
        wordIds: [
          word("seguro-que"),
          word("quizas"),
          word("tal-vez"),
          word("ojala"),
          word("sin-embargo"),
          word("a-menos-que"),
        ],
      },
      {
        type: "words",
        title: "Planes",
        wordIds: [
          word("reservar"),
          word("alquilar"),
          word("decidir"),
          word("esperar"),
          word("creer"),
          word("cambiar"),
        ],
      },
    ],
    quiz: {
      id: "ch4-vocabulario-quiz",
      title: "Future vocabulary quiz",
      passThreshold: 0.75,
      questions: [
        fill("___ la semana que viene = next week", "la"),
        pick("Which means 'maybe'?", "quizás", ["ojalá", "sin embargo", "dentro de"]),
        pick("Which means 'I hope'?", "ojalá", ["seguro que", "tal vez", "a menos que"]),
        fill("___ falta. (It is needed)", "Hace"),
        pick("How do you say 'to book a table'?", "Reservar una mesa", [
          "Reservar de una mesa",
          "La mesa reservar",
          "Reservar la mesa a",
        ]),
      ],
    },
  },
  {
    id: "ch4-lectura-planes",
    order: 8,
    title: "Lectura: los planes",
    subtitle: "The future, and one subjunctive-sized hole",
    sections: [
      {
        type: "story",
        title: "Los planes",
        note: "Note the last two sentences: the speaker describes two possible futures with if-clauses.",
        storyId: story("st-planes").id,
      },
    ],
    quiz: {
      id: "ch4-lectura-planes-quiz",
      title: "Reading comprehension",
      passThreshold: 0.75,
      questions: story("st-planes").questions,
    },
  },
  {
    id: "ch4-lectura-sube",
    order: 9,
    title: "Lectura: ¿podrías abrirme?",
    subtitle: "The conditional in real conversation",
    sections: [
      {
        type: "story",
        title: "¿Podrías abrirme?",
        note: "Nearly every request here uses the conditional, and so does the if-clause.",
        storyId: story("st-sube").id,
      },
    ],
    quiz: {
      id: "ch4-lectura-sube-quiz",
      title: "Reading comprehension",
      passThreshold: 0.75,
      questions: story("st-sube").questions,
    },
  },
  {
    id: "ch4-repaso",
    order: 10,
    title: "Repaso",
    subtitle: "Chapter 4 mixed drill, all five tenses",
    sections: [
      {
        type: "text",
        title: "What you now know",
        body: "• The regular future: one set of endings for every pattern\n• The nine irregular future stems: tendré, podré, haré, diré, saldré, vendré, pondré, sabré, querré\n• ir a + infinitive for plans, the future for predictions\n• The conditional, fully regular, and the most useful verb form for politeness\n• Real if-clauses: si + present, result in the conditional\n• Hypothetical if-clauses: si + imperfect, result in the conditional\n• hacer for 'ago', as a light verb, and in periphrasis\n\nYou now have all five tenses. The next chapter stops adding tenses and deals with the hardest pair in the language.",
      },
    ],
    quiz: {
      id: "ch4-repaso-quiz",
      title: "Chapter 4 review",
      passThreshold: 0.8,
      questions: [
        conj("hablar", FUT, "yo"),
        conj("hablar", COND, "yo"),
        conj("comer", FUT, "el"),
        conj("vivir", COND, "nosotros"),
        conj("tener", FUT, "yo"),
        conj("tener", COND, "yo"),
        conj("poder", FUT, "yo"),
        conj("hacer", FUT, "yo"),
        conj("decir", FUT, "yo"),
        conj("ir", COND, "yo"),
        conj("ser", FUT, "yo"),
        conj("dormir", FUT, "yo"),
        conj("levantarse", FUT, "yo"),
        pick("'If I had money' — which is correct?", "Si tuviera dinero, viajaría", [
          "Si tengo dinero, viajaré",
          "Si tendría dinero, viajaré",
          "Si tuviera dinero, viajaré",
        ]),
        pick("Which is a plan?", "Voy a llamar", ["Llamaré", "Llamé", "Llamaba"]),
        pick("How do you say 'I would like'?", "Me gustaría", [
          "Me gustaré",
          "Me gustara",
          "Me gusté",
        ]),
        fill("___ falta. (It is needed)", "Hace"),
      ],
    },
  },
];

// Guard against a corrupted token slipping into a heading.
for (const lesson of lessons as Array<{ id: string; title: string; subtitle?: string }>) {
  for (const field of [lesson.title, lesson.subtitle]) {
    if (field && /[_\u0000-\u001f]/.test(field)) {
      throw new Error(`lesson ${lesson.id} has a malformed ${field === lesson.title ? "title" : "subtitle"}`);
    }
  }
}

chapter.lessons = lessons as never;
chapter.status = "published";
chapter.lessons.forEach((l: { order: number }, i: number) => {
  l.order = i + 1;
});

for (const lesson of chapter.lessons as Array<{ id: string; quiz?: { id: string } }>) {
  if (lesson.quiz) lesson.quiz.id = `${lesson.id}-quiz`;
}

await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log(`chapter-4 lessons: ${chapter.lessons.length}, status: ${chapter.status}`);
