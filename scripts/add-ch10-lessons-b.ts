/**
 * One-off content edit: chapter 10 lessons 6-10.
 *
 * 6 por and para, 7 ser and estar again, 8 timed reading, 9 the exam,
 * 10 what comes next. Lessons 1-5 land in scripts/add-ch10-lessons-a.ts.
 *
 * Lesson 8 is the only lesson in the course whose stories carry no glossary at
 * all, which is the exercise rather than an oversight.
 *
 * Run with: bun scripts/add-ch10-lessons-b.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const chapter = pack.chapters.find((c: { id: string }) => c.id === "chapter-10");
if (!chapter) throw new Error("chapter-10 missing");
if (chapter.lessons.length !== 5) {
  throw new Error(`expected the first 5 lessons, found ${chapter.lessons.length}`);
}

const word = (id: string) => {
  if (!pack.words.some((w: { id: string }) => w.id === id)) throw new Error(`unknown word "${id}"`);
  return id;
};
const verb = (id: string) => {
  if (!pack.verbs.some((v: { id: string }) => v.id === id)) throw new Error(`unknown verb "${id}"`);
  return id;
};
const story = (id: string) => {
  const found = pack.stories.find((s: { id: string }) => s.id === id);
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
const pickOpts = (prompt: string, options: string[]): Q => ({
  type: "choice",
  prompt,
  options: options.map((value, i) => ({ value, correct: i === 0 })),
});

const ALL_FINITE = ["present", "preterite", "imperfect", "subjunctive", "future", "conditional"];

const turna = story("st-la-turna-de-noche");
const cola = story("st-por-que-la-cola");
const noSeDijo = story("st-lo-que-no-se-dijo");

const lessons: unknown[] = [
  {
    id: "ch10-por-para",
    order: 6,
    title: "Por y para",
    subtitle: "Two prepositions that overlap in English",
    sections: [
      {
        type: "words",
        title: "The prepositions",
        wordIds: [
          word("por-que2"),
          word("para-que2"),
          word("porque"),
          word("para-que"),
          word("motivo"),
          word("proposito"),
          word("destino"),
          word("medio"),
          word("ayuda"),
          word("plazo"),
          word("debido"),
        ],
      },
      {
        type: "comparison",
        title: "The four uses that do not overlap",
        note: "por looks backwards and para looks forwards. Every pair below is that one idea, applied to a different noun.",
        leftLabel: "por",
        rightLabel: "para",
        labelsLang: "en",
        groups: [
          {
            title: "Reason",
            left: "por",
            right: null,
            note: "Gracias por venir: because you came, and the reason is behind us.",
          },
          {
            title: "Purpose",
            left: null,
            right: "para",
            note: "Esto es para ti: intended for, and the intention is ahead. Never por.",
          },
          {
            title: "Movement through",
            left: "Voy por Madrid.",
            right: "Voy para Madrid.",
            note: "The single clearest pair. por is the route, para is the destination.",
          },
          {
            title: "Deadline",
            left: "Lo necesito para el lunes.",
            right: "Lo necesito por el lunes.",
            note: "In most of Spain para: by Friday as a target. por el lunes as a duration is correct in the Caribbean.",
          },
          {
            title: "Exchange",
            left: "Te cambio el coche por la casa.",
            right: null,
            note: "por only, and it means in exchange for. No para version exists.",
          },
          {
            title: "The set phrase",
            left: "por favor, por fin, por ahora, por eso",
            right: "para siempre, para luego, para nada",
            note: "The combinations are conventional. One very common exception: por eso but para siempre.",
          },
        ],
      },
      {
        type: "text",
        title: "The four questions that settle it",
        body:
          "English collapses por and para into for, and most mistakes come from translating that word rather than asking about the noun.\n\nWhat caused it, and is the cause behind us? por. Gracias por venir, por la lluvia, por culpa de tu hermano.\n\nWho or what is it intended for? para. Esto es para ti, un regalo para ella, un plato para la sopa.\n\nIs it a route or a destination? por for the route, para for the destination. This is the one that is never ambiguous, and it is the one to fix first, because it teaches that the two are not interchangeable rather than merely different.\n\nIs it being swapped for something? por. Cambiar por. Exchange has no para form at all.\n\nThen the reflexive: parlarse,带回 volver atrás. Reflexive verbs of motion take por for going and para for coming, and the same verb flips: se acerca para aquí, se aleja por aquí. That is a fixed pair and the most reliable por/para rule in the language, because it is the one place the two are genuinely interchangeable by definition.\n\nTwo things that are not rules. Por and para both mean for in the sense of because, and they are not interchangeable: por eso because of that, para eso in order for that. And porque is neither of them; it is a conjunction and takes no preposition, which is the mistake that produces por que when you wanted the conjunction.\n\nA last asymmetry worth knowing. Por is the one that survives in negative and impersonal constructions, so no por aquí, and working por cuenta propia. Para resists both, so para nada is fixed but never nada para.",
      },
    ],
    quiz: {
      id: "ch10-por-para-quiz",
      title: "Por and para",
      passThreshold: 0.8,
      questions: [
        fill("Gracias ___ venir.", "por"),
        fill("Esto es ___ ti.", "para"),
        fill("Te cambio el coche ___ la casa.", "por"),
        fill("Lo necesito ___ el lunes.", "para"),
        fill("___ eso no lo hice.", "Por"),
        pickOpts("Voy para Madrid means", [
          "Madrid is the destination",
          "Madrid is the route",
          "I am going because of Madrid",
          "I am going through Madrid",
        ]),
        pickOpts("The reflexive pair se aleja por aquí / se acerca para aquí shows", [
          "por is the route and para the destination, in one fixed pair",
          "por and para are interchangeable",
          "por is past and para is future",
          "neither word takes a reflexive verb",
        ]),
        pickOpts("Porque is", [
          "a conjunction, and takes no preposition",
          "a short form of para que",
          "used only in questions",
          "a variant of por qué",
        ]),
        pickOpts("Which is correct?", [
          "para siempre",
          "por siempre",
          "ambos are wrong",
          "siempre para",
        ]),
      ],
    },
  },
  {
    id: "ch10-ser-estar",
    order: 7,
    title: "Ser y estar, otra vez",
    subtitle: "The grey areas, which is all that was left",
    sections: [
      {
        type: "conjugation",
        title: "Both verbs, all six tenses",
        note: "Chapter 5 taught the distinction. This is the second pass, for the cases that do not fit it.",
        verbIds: [verb("ser"), verb("estar")],
        tenses: ALL_FINITE,
      },
      {
        type: "comparison",
        title: "Where they genuinely overlap",
        note: "Not every pair has one answer. These are the ones where both are defensible and the meaning shifts.",
        leftLabel: "ser",
        rightLabel: "estar",
        groups: [
          {
            title: "By nature",
            left: "Es aburrido.",
            right: null,
            note: "A character trait. He is bored, permanently, and he always has been.",
          },
          {
            title: "Right now",
            left: null,
            right: "Está aburrido.",
            note: "A temporary state, and it will pass. The same word, opposite meaning, and the change is the news.",
          },
          {
            title: "Both, different stories",
            left: "Era listo.",
            right: "Estaba listo.",
            note: "Ser listo is a quick thinker. Estar listo is waiting for you. A real ambiguity, and the context decides which the speaker means.",
          },
          {
            title: "Getting somewhere",
            left: "La reunión es mañana.",
            right: "La reunión está mañana.",
            note: "The first is fixed by the calendar. The second means it has been moved, and is the tense of a change nobody announced.",
          },
          {
            title: "Looks",
            left: "Es rojo.",
            right: "Está rojo.",
            note: "Intrinsic colour against current colour. A red car that is red stays está rojo if it is muddy.",
          },
        ],
      },
      {
        type: "text",
        title: "What the two verbs actually contrast",
        body:
          "The version in chapter 5 is the useful one: ser for what something is, estar for how it is found. That is a memory aid, not a rule, and this chapter is where it breaks.\n\nIt breaks in three predictable places.\n\nStates with no location. Ser describes identity, origin, material and time; estar describes location, condition and result. Un reloj de oro has a material and gets ser. El reloj está roto has a condition and gets estar. There is no case where both are simply right for a condition, and that is why está aburrido and es aburrido never compete.\n\nChange of state. Something that has become gets estar, because estar is where results live. El café está frío is a cup of coffee that was hot. El café es frío is coffee made that way. Same word, and the choice tells you about the history of the cup.\n\nLocation. Estar, with almost no exceptions. Madrid está en el centro, and not es en el centro. Ser is for cities, islands and countries: Madrid es una ciudad, España es en Europa.\n\nThe genuinely ambiguous pairs, where the honest answer is that it depends. Ser listo against estar listo, as above. Ser listo means sharp; estar listo means ready. These are different words that happen to share an adjective, and the learner who treats them as one will say the wrong one.\n\nSer amigo de and estar amigo de, the friend of a friend, is another. Ser is a lasting relation; estar is being friendly today. And estar seguro de against ser seguro: sure in this moment, or a reliable person.\n\nOne practical way to choose. Ask whether the sentence could be contradicted by something happening tomorrow. Es aburrido cannot be contradicted tomorrow, because it is a claim about a person. Está aburrido can, because boredom ends. Everything else in this chapter is a detail of that one question.",
      },
    ],
    quiz: {
      id: "ch10-ser-estar-quiz",
      title: "Ser and estar",
      passThreshold: 0.8,
      questions: [
        conj("ser", "present", "yo"),
        conj("estar", "preterite", "el"),
        conj("estar", "imperfect", "nosotros"),
        fill("Es ___ (aburrido). He always has been.", "aburrido"),
        fill("___ (estar) aburrido. Solo hoy.", "Está"),
        fill("Madrid ___ (estar) en el centro.", "está"),
        fill("Madrid ___ (ser) una ciudad.", "es"),
        fill("El café está frío: el café ___ (ser) frío. Se ha enfriado.", "no es"),
        pickOpts("The test for ser over estar is", [
          "whether tomorrow could contradict the sentence",
          "whether the noun is animate",
          "whether the sentence is negative",
          "whether the verb is in the past",
        ]),
        pickOpts("Ser listo and estar listo are", [
          "different words that share an adjective: sharp, and ready",
          "the same word in two registers",
          "the polite and the informal form",
          "present and preterite of each other",
        ]),
        pickOpts("La reunión está mañana means", [
          "the meeting has been moved",
          "the meeting is fixed for tomorrow",
          "the meeting is tomorrow",
          "the meeting was tomorrow",
        ]),
      ],
    },
  },
  {
    id: "ch10-lectura-cronometrada",
    order: 8,
    title: "Lectura cronometrada",
    subtitle: "Three texts, no glossary",
    sections: [
      {
        type: "text",
        title: "How to do this one",
        body:
          "The three texts below have no glosses at all. That is the exercise, and it is the first time in the course where nothing is offered.\n\nTime yourself. Two minutes for the night-shift text, two for the bakery, one and a half for the last. If you are still translating word by word at two minutes, the point has been made and you should stop and reread.\n\nThen answer the questions without looking back, and be honest about the ones you got wrong. A wrong answer here is information about a word you do not know yet; a right answer you got by translating every word is information about a habit you want to break.\n\nWhat to expect. The night-shift text is the hardest, because it is built almost entirely from imperfects and it has no dialogue. The bakery text has numbers and money, which are slow but concrete. The last is the shortest and the most literary, and it is the one most likely to defeat you on a single phrase rather than on vocabulary.\n\nIf you get all twelve, the course has done its job. If you get eight and understood the shape of each text, that is where an intermediate reader should land, and the remaining four are a reading list rather than a failure.",
      },
      {
        type: "story",
        title: "La turna de noche",
        note: "216 words, no glosses. Narrative, with the tense contrast doing the work.",
        storyId: turna.id,
      },
      {
        type: "story",
        title: "Por qué hay cola en la panadería",
        note: "208 words, no glosses. An argument, and the last paragraph overturns the explanation.",
        storyId: cola.id,
      },
      {
        type: "story",
        title: "Lo que no se dijo",
        note: "179 words, no glosses. The shortest and the hardest: it is about silence.",
        storyId: noSeDijo.id,
      },
    ],
    quiz: {
      id: "ch10-lectura-cronometrada-quiz",
      title: "Timed reading comprehension",
      passThreshold: 0.75,
      questions: [...turna.questions, ...cola.questions, ...noSeDijo.questions],
    },
  },
  {
    id: "ch10-examen",
    order: 9,
    title: "Examen",
    subtitle: "The whole course, once, with no labels",
    sections: [
      {
        type: "text",
        title: "What this quiz is for",
        body:
          "Every other quiz in the course has told you which chapter it came from, and most have been about one thing. This one is neither.\n\nThere are no section labels. The questions are mixed across all seven tenses, both moods, the two prepositions, the pronouns and the imperative, and the order is deliberate: a tense question, then a preposition, then a pronoun, then another tense. You cannot tell which rule is being tested from the shape of the question, which is the situation you will be in when you are actually speaking.\n\nIt is longer than any other quiz and it has a higher threshold than most. Twenty-two questions, and you need eighteen.\n\nIf you fail it, do not reread this lesson. The explanations after each question name the rule, and re-reading the text without them wastes the attempt. The most useful thing you can do is find the three questions you got wrong and work out which of the seven chapters they came from. That is the diagnosis, and the course is arranged so that the chapter is one click away.\n\nOne note on difficulty. This is the hardest quiz in the course and it is meant to be. Nothing in it is trickier than material already taught; it is only less signposted. Treat a score of 14 out of 22 as a normal result for a first attempt, not as a verdict on what you have learned.",
      },
    ],
    quiz: {
      id: "ch10-examen-quiz",
      title: "Final exam",
      passThreshold: 0.8,
      questions: [
        conj("tener", "present", "yo"),
        conj("comer", "preterite", "el"),
        conj("hablar", "imperfect", "nosotros"),
        conj("querer", "subjunctive", "ellos"),
        conj("trabajar", "future", "tu"),
        conj("ir", "conditional", "nosotros"),
        conj("buscar", "imperative", "el"),
        conj("sentir", "preterite", "ellos"),
        fill("Entrego el informe ___ Marta.", "a"),
        fill("Nada ____counts: la expresión fija es «___ nada».", "para"),
        fill("Gracias ___ venir.", "por"),
        fill("Creo que ___ (ser) verdad.", "es"),
        fill("Espero que ___ (venir) mañana.", "vengan"),
        fill("Ojalá ___ (tener) tiempo.", "tenga"),
        fill("___ (leer) el libro = ___ leo.", "Lo"),
        fill("Entrego el informe ___ Marta = se lo ___ (el objeto).", "a", ["a"]),
        fill("No ___ (hablar) con ella.", "hable"),
        fill("Quiero comer el pastel = quiero comer___.", "lo"),
        pickOpts("Era las once y media is", [
          "imperfect, because a time is a state",
          "preterite, because the hour is finished",
          "future, because it is over",
          "conditional, because it is hypothetical",
        ]),
        pickOpts("Voy por Madrid means", [
          "through Madrid, on the way somewhere",
          "to Madrid, as the destination",
          "because of Madrid",
          "for Madrid",
        ]),
        pickOpts("Es aburrido against está aburrido", [
          "a permanent trait against a temporary state",
          "formal against informal",
          "singular against plural",
          "affirmative against negative",
        ]),
        pickOpts("La reunión está mañana means", [
          "the meeting has been moved",
          "the meeting is fixed for tomorrow",
          "the meeting will be tomorrow",
        ]),
        pickOpts("Se habla español is", [
          "a passive, with no agent",
          "a reflexive",
          "a substitute pronoun",
          "the imperative",
        ]),
      ],
    },
  },
  {
    id: "ch10-cierre",
    order: 10,
    title: "Cierre",
    subtitle: "What comes after this course",
    sections: [
      {
        type: "text",
        title: "Where the gaps are",
        body:
          "You have finished the course. Here is an honest account of what that leaves you able to do, and of the four things this course deliberately did not teach.\n\nWhat you can do. Conjugate any verb in any of the seven tenses, including the ones that never derive. Read a text of two hundred words with no glosses and answer questions about what the writer arranged for you to work out. Hold a short conversation about work, study, opinions, plans and stories. Read the news, which is written in the register chapter 9 taught you to recognise.\n\nWhat you cannot yet do. Follow a conversation at full speed, because that needs vocabulary rather than grammar and you have 512 words. Read a novel, which needs about four thousand. Follow a lecture, which needs the academic register and about half again as many words as you have. None of these is a grammar problem, so none of them can be fixed by more conjugation.\n\nThe four things not taught, in the order I would teach them next.\n\nThe imperfect subjunctive, which is the -ra forms: hablara, comiera. You have the present subjunctive and the whole conditional family, which between them cover most modern speech. The -ra forms appear in formal writing and in wishes about the past, and that is genuinely all.\n\nSubjunctive relatives, which is one clause and a small set of words: lo que, donde, quien, con tal de que. Lo que dices is the one you will meet first and it is not hard once you see that lo que is a noun and everything after it is a clause.\n\nSer and estar with the prepositions para and de. Estoy para las ocho, es de Madrid, volver a Madrid. Short, closed, and a common gap even at B2.\n\nAnd the vosotros you now have but have probably never spoken, which is fine until you are in Spain, where it is not fine at all.\n\nWhere to go next. Read, and read things you would read anyway. A podcast you already follow, at half speed, then at full speed, then without subtitles. One graded reader at your level, with the audio, because the ear needs as much work as the eye and gets ten times less of it. And talk to somebody, badly and often, because the tenses you are unsure of are the ones you will avoid in conversation and therefore never learn.",
      },
      {
        type: "words",
        title: "The last twelve words",
        note: "The whole course, in twelve items. Every one of these was introduced in some chapter, and the quiz below asks for all of them.",
        wordIds: [
          word("por-que2"),
          word("para-que2"),
          word("pron-me"),
          word("pron-los"),
          word("sostener"),
          word("implicito"),
          word("suf-oso"),
          word("puede-que"),
          word("de-repente"),
          word("formal"),
          word("llegar"),
          word("sugerir"),
        ],
      },
    ],
    quiz: {
      id: "ch10-cierre-quiz",
      title: "The course in twelve words",
      passThreshold: 0.8,
      questions: [
        fill("Gracias ___ venir.", "por"),
        fill("Esto es ___ ti.", "para"),
        fill("___ levanto cada día.", "Me"),
        fill("___ veo todos los días.", "Los"),
        fill("___ que es verdad.", "Puede"),
        fill("___ ___ pronto: de pronto, de repente.", "De", ["De"]),
        pickOpts("Which pair is the right one?", [
          "por siempre is wrong; para siempre is right",
          "por siempre is right; para siempre is wrong",
          "both are correct",
          "neither is correct",
        ]),
        pickOpts("What this course could not give you", [
          "vocabulary volume, and the speed of conversation",
          "the subjunctive",
          "the preterite against the imperfect",
          "object pronouns",
        ]),
        pickOpts("What to learn next, first", [
          "the imperfect subjunctive, and the -ra forms",
          "the future tense, which is already here",
          "ser and estar, which are already here",
          "more nouns",
        ]),
        pickOpts("Which of these is NOT on the not-taught list?", [
          "the imperfect subjunctive",
          "subjunctive relatives",
          "ser and estar with para and de",
          "vosotros, which chapter 10 teaches",
        ]),
      ],
    },
  },
];

for (const lesson of lessons) {
  if (chapter.lessons.some((l: { id: string }) => l.id === lesson.id)) continue;
  chapter.lessons.push(lesson);
}
chapter.lessons.sort((a: { order: number }, b: { order: number }) => a.order - b.order);

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`chapter-10 now has ${chapter.lessons.length} lessons`);
