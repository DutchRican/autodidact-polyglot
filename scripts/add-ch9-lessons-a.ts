/**
 * One-off content edit: Chapter 9 lessons 1-5.
 *
 * Lesson 1 inference, 2 register, 3 suffixes, 4 prefixes, 5 modals.
 * Lessons 6-10 land in scripts/add-ch9-lessons-b.ts.
 *
 * Conjugation sections are deliberately few: this chapter's work is reading,
 * and chapter 8 already covered the mood. Modals get one small table because
 * poder and deber are the two verbs a learner needs for inference.
 *
 * Run with: bun scripts/add-ch9-lessons-a.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const chapter = pack.chapters.find((c: { id: string }) => c.id === "chapter-9");
if (!chapter) throw new Error("chapter-9 missing");
if (chapter.lessons.length) throw new Error("chapter-9 already has lessons");

const word = (id: string) => {
  if (!pack.words.some((w: { id: string }) => w.id === id)) throw new Error(`unknown word "${id}"`);
  return id;
};
const verb = (id: string) => {
  if (!pack.verbs.some((v: { id: string }) => v.id === id)) throw new Error(`unknown verb "${id}"`);
  return id;
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
/** Same thing, with the correct option written first inside one array. */
const pickOpts = (prompt: string, options: string[]): Q => ({
  type: "choice",
  prompt,
  options: options.map((value, i) => ({ value, correct: i === 0 })),
});

const PRES = "present";
const SUBJ = "subjunctive";

const lessons: unknown[] = [
  {
    id: "ch9-inferencia",
    order: 1,
    title: "La inferencia",
    subtitle: "Reading between the lines",
    sections: [
      {
        type: "words",
        title: "The vocabulary of reading",
        wordIds: [
          word("implicito"),
          word("explicito"),
          word("ironia"),
          word("matiz"),
          word("sostener"),
          word("afirmar"),
          word("matizar"),
        ],
      },
      {
        type: "comparison",
        title: "Said and unsaid",
        note:
          "In longer text the important information is usually the part nobody says. Both columns are true; only one of them is what the writer is doing.",
        leftLabel: "explicit",
        rightLabel: "implicit",
        labelsLang: "en",
        groups: [
          {
            title: "Plain statement",
            left: "Marta perdió el autobús.",
            leftTranslation: "Marta missed the bus.",
            right: null,
            note: "Stated outright. Rare in fiction, and its absence is usually deliberate.",
          },
          {
            title: "Action instead",
            left: null,
            right: "Marta comprendió que había perdido el autobús.",
            note: "The fact is still there, but it arrives as a conclusion she draws. The reader does the work, which is why the reader remembers it.",
          },
          {
            title: "Mood, with no adjective",
            left: null,
            right: "No era alegría, y no era tristeza.",
            note: "Twice we are told what the feeling is not, and the feeling is never named. That is the whole ending.",
          },
        ],
      },
      {
        type: "text",
        title: "Three things to look for",
        body:
          "Comprehension questions ask for facts, and facts are the easy half. The other half is what the writer arranged for you to work out.\n\nFirst, negation of the obvious. No era alegría, y no era tristeza is not a fact about Marta; it is the writer declining to name something. If a text tells you twice what a thing is not, the thing is the point.\n\nSecond, the noun that does not belong. In the bus story the driver and the grandchildren each pass through in a single sentence. Neither is what the story is about. Look for the noun that recurs, or that the last paragraph comes back to.\n\nThird, how firmly the speaker holds their position. Afirmar, sostener and matizar are three different levels of commitment, and a text that uses all three is making a point about how people argue. That is the whole of the river story: the first side afirma, the second matiza, and the narrator ends by suggesting that neither answer is right.\n\nOne practical habit. When a question says why, the answer is usually not in any single sentence. Read the paragraph before and the paragraph after, and ask what the writer needed the reader to assume.",
      },
    ],
    quiz: {
      id: "ch9-inferencia-quiz",
      title: "Inference quiz",
      passThreshold: 0.75,
      questions: [
        pickOpts("What usually tells you what a longer text is about?", [
          "The noun that recurs, or that the ending returns to",
          "The first noun of the first paragraph",
          "The longest word in the text",
          "The title",
        ]),
        pick("Which verb is the weakest form of commitment?", "matizar", [
          "afirmar",
          "sostener",
          "demostrar",
        ]),
        pickOpts("What does 'no era alegría, y no era tristeza' tell you?", [
          "That the feeling was never named",
          "That Marta was happy and sad at once",
          "That the writer could not find the word",
        ]),        fill("Cuando una pregunta dice «por qué», la respuesta no está en ___ frase.", "una"),
      ],
    },
  },
  {
    id: "ch9-registro",
    order: 2,
    title: "El registro",
    subtitle: "Formal and informal, and how to tell",
    sections: [
      {
        type: "words",
        title: "Register words",
        wordIds: [word("formal"), word("informal"), word("coloquial")],
      },
      {
        type: "comparison",
        title: "One meaning, three registers",
        leftLabel: "register",
        rightLabel: "example",
        labelsLang: "en",
        groups: [
          {
            title: "Neutral",
            left: "estilo neutro",
            right: "La reunión empieza a las nueve.",
            note: "Works anywhere. The default, and the safest place to start.",
          },
          {
            title: "Formal",
            left: "registro formal",
            right: "La sesión comienza a las nueve.",
            note: "Usted, wider vocabulary, longer sentences. News, contracts, anything signed.",
          },
          {
            title: "Colloquial",
            left: "registro coloquial",
            right: "¿La reunión empieza a las nueve, no?",
            note: "Tú, contractions, and a rising tone on the tag at the end. Two friends, a shop, a bar.",
          },
        ],
      },
      {
        type: "text",
        title: "Four tells, and they travel together",
        body:
          "You do not need a dictionary of slang to tell registers apart, because register leaves four marks and they almost always appear together.\n\nFirst, usted or tú. Es la señora is formal; eres tú is not. A shop says ¿qué desea? rather than ¿qué quieres? for exactly this reason.\n\nSecond, the mood. La reunión es a las nueve is neutral and formal, because it asserts a fact in writing. La reunión empieza a las nueve is what you would say out loud, in any register.\n\nThird, vocabulary width. Empezar is neutral; comenzar is formal; arrancar is spoken. Descansar is formal for a siesta and echar una siesta is not.\n\nFourth, sentence shape. Formal Spanish writes long subordinated sentences. Spoken Spanish splits them and uses short ones. The bus story is short sentences; the river story is long ones with commas.\n\nOne warning. These are tendencies, not rules. A shopkeeper will say llámame in a formal context, and a lawyer will say te lo mando in an informal one. What matters is consistency inside a text, not which register you chose.\n\nAnd one place where the two meet: sin embargo is fine in speech, and puesto que is not. Some forms travel between registers and some do not, and the ones that do are the ones you pick up first.",
      },
    ],
    quiz: {
      id: "ch9-registro-quiz",
      title: "Register quiz",
      passThreshold: 0.75,
      questions: [
        pick("Which is the formal verb for 'to start'?", "comenzar", [
          "empezar",
          "arrancar",
          "echar",
        ]),
        pick("Which is colloquial?", "Echar una siesta", [
          "Descansar durante la tarde",
          "Realizar una siesta",
          "Cumplir un reposo",
        ]),
        pick("Which sentence is neutral?", "La reunión empieza a las nueve", [
          "La sesión comienza a las nueve",
          "¿La reunión empieza a las nueve, no?",
          "La reunión es a las nueve",
        ]),
        fill("El registro formal usa ___ en lugar de tú.", "usted"),
        pick("Which connector works in speech?", "Sin embargo", [
          "Puesto que",
          "Dado que",
          "En consecuencia",
        ]),
      ],
    },
  },
  {
    id: "ch9-sufijos",
    order: 3,
    title: "Palabras por sufijos",
    subtitle: "-mente, -ción, -dad, -oso, -ero",
    sections: [
      {
        type: "words",
        title: "The suffixes themselves",
        wordIds: [
          word("suf-mamente"),
          word("suf-cion"),
          word("suf-dad"),
          word("suf-oso"),
          word("suf-ivo"),
          word("suf-ero"),
        ],
      },
      {
        type: "words",
        title: "Words built on them",
        note: "Every one of these you can now build something else from.",
        wordIds: [
          word("lento"),
          word("lentamente"),
          word("atencion"),
          word("habilidad"),
          word("oscuro"),
          word("peligroso"),
          word("perezoso"),
          word("tristeza"),
          word("aventura"),
          word("aventurero"),
        ],
      },
      {
        type: "comparison",
        title: "What each one does",
        leftLabel: "base",
        rightLabel: "built on it",
        labelsLang: "en",
        groups: [
          {
            title: "-mente",
            left: "lento",
            right: "lentamente",
            note: "Adverb from an adjective, and formed on the feminine whatever the adjective is: lenta + mente. Adverbs do not change after this.",
          },
          {
            title: "-ción",
            left: "atención",
            right: "la atención",
            note: "A noun for an action or a quality, and always feminine. So is -dad.",
          },
          {
            title: "-dad",
            left: "triste",
            right: "la tristeza",
            note: "Directly from the adjective, with nothing in between, and also always feminine.",
          },
          {
            title: "-oso",
            left: "oscuro",
            right: "oscuroso",
            note: "An adjective meaning full of something, or tending towards it. Dangerous, dark, lazy. Darkness of mood is not peligroso.",
          },
          {
            title: "-ero",
            left: "aventura",
            right: "el aventurero",
            note: "One who does the thing named before it, and also the shop where it happens: el panadero is the baker and the bakery.",
          },
        ],
      },
      {
        type: "text",
        title: "How far this gets you",
        body:
          "This is the most useful thing in the chapter for reading without stopping to look things up, because a suffix tells you what kind of word you are holding before you know what it means.\n\n-ción and -dad are feminine nouns. Know the suffix and you know the article, without understanding the word at all.\n\n-oso is an adjective, so it agrees with the noun beside it: un problema oscuro, una solución oscura. If a word ends that way and the noun changes gender, the suffix is the clue that it has to.\n\n-mente is an adverb, and adverbs do not change. Lento becomes lentamente once and then stays that way.\n\nTwo warnings.\n\nThe first is that the gender rule has exceptions you learn as words, not as rules: el agua and el mapa are masculine, la mano and la foto are feminine, and no suffix predicts either.\n\nThe second is that -oso does not mean one thing. It means full of something, or tending towards it. Un río peligroso is a river full of danger, not a dark river.\n\nAn exercise for this chapter. Take a page you have not read before and underline every word ending in -ción, -dad, -mente or -oso. You will have marked most of the nouns, adverbs and adjectives on the page without understanding one of them.",
      },
    ],
    quiz: {
      id: "ch9-sufijos-quiz",
      title: "Suffixes quiz",
      passThreshold: 0.8,
      questions: [
        pick("Which suffix makes an adverb?", "-mente", ["-ción", "-dad", "-ero"]),
        pick("A noun ending in -ción is", "feminine", [
          "masculine",
          "always plural",
          "never takes an article",
        ]),
        pick("Which word is built on -ero?", "aventurero", [
          "aventura",
          "aventurado",
          "aventurosamente",
        ]),
        pick("What does -oso mean?", "full of something, or tending to it", [
          "the opposite of something",
          "a person who does something",
          "done in the past",
        ]),
        fill("lento + -mente = ___", "lentamente"),
        fill("triste + -dad = ___", "tristeza"),
        pick("Which is an exception to the gender rule?", "el agua", [
          "la atención",
          "la tristeza",
          "la habilidad",
        ]),
      ],
    },
  },
  {
    id: "ch9-prefijos",
    order: 4,
    title: "Los prefijos",
    subtitle: "des-, in-, con-, sub-, super-",
    sections: [
      {
        type: "words",
        title: "The prefixes",
        wordIds: [
          word("pref-des"),
          word("pref-in"),
          word("pref-con"),
          word("pref-sub"),
          word("pref-super"),
        ],
      },
      {
        type: "words",
        title: "Words built on them",
        wordIds: [
          word("desorden"),
          word("inutil"),
          word("incorrecto"),
          word("continuo"),
          word("submarino"),
          word("superior"),
        ],
      },
      {
        type: "comparison",
        title: "What each one tends to do",
        note:
          "Tends to. Prefixes are the least reliable part of the system, and the exceptions are worth more than the rule.",
        leftLabel: "prefix",
        rightLabel: "tends to mean",
        labelsLang: "en",
        groups: [
          {
            title: "des-",
            left: "el desorden",
            right: "undoing, taking apart",
            note: "Also undoing an action, and sometimes a plain negative. Desayunar is not a negative of anything, though.",
          },
          {
            title: "in-",
            left: "inútil",
            right: "not-",
            note: "The most reliable of the five: inútil, incorrecto. The exception worth knowing is infancia, which is not a negative of anything.",
          },
          {
            title: "con-",
            left: "continuo",
            right: "with, together, completely",
            note: "Contar is to count, not to count together. Con- also makes the intensive forms: comer became conmigo.",
          },
          {
            title: "sub-",
            left: "el submarino",
            right: "under",
            note: "Usually spatial and usually exact. Submarino means under the sea and nothing else.",
          },
          {
            title: "super-",
            left: "superior",
            right: "over, above, beyond",
            note: "Often better rather than merely higher: superior means both at once.",
          },
        ],
      },
      {
        type: "text",
        title: "Prefixes are the weakest rule in the language",
        body:
          "Suffixes are close to reliable. Prefixes are not, and the reason is worth knowing before you rely on them.\n\nThe problem is that pre- and sub- and con- arrived in Spanish at different times, from Latin and then from French, and each layer kept its own habits. A prefix that looked obvious to a speaker two centuries ago often looks arbitrary now, and nobody feels the need to change it.\n\nSo learn two of the five well and distrust the rest. In- before an adjective is the one you can rely on: inútil, incorrecto, imposible. Sub- before a noun is the second: el submarino, el subterráneo.\n\nDes- is the interesting one, because it does three different jobs. It undoes something (desmontar, take apart), it reverses an action (descansar, the opposite of cansar), and it is sometimes just a negative (descubrir, which is not a negative of anything at all).\n\nOne more worth knowing, because it is not on any list: many Spanish verbs carry a prefix that has no English equivalent and no systematic meaning. Madrugar is to get up early, and there is nothing in the madrug- that means early.\n\nA useful caution for the reading chapter that follows. When you meet an unfamiliar word, check the suffix first, because the suffix is reliable. Only then look at the prefix, because the prefix may be telling you nothing.",
      },
    ],
    quiz: {
      id: "ch9-prefijos-quiz",
      title: "Prefixes quiz",
      passThreshold: 0.8,
      questions: [
        pick("Which prefix is the most reliable?", "in-", ["con-", "des-", "super-"]),
        pick("What does el submarino mean?", "under the sea", [
          "the sea",
          "over the sea",
          "not the sea",
        ]),
        pick("Which is a -oso word?", "peligroso", [
          "peligro",
          "peligrosamente",
          "peligrosidad",
        ]),
        fill("des- + montar = ___", "desmontar"),
        fill("con- + comer = ___", "conmigo"),
        pickOpts("Why are prefixes less reliable than suffixes?", [
          "They arrived at different times and kept their own habits",
          "They are only used with nouns",
          "They are always informal",
        ]),
      ],
    },
  },
  {
    id: "ch9-modales",
    order: 5,
    title: "Los verbos modales",
    subtitle: "deber, poder, and the space in between",
    sections: [
      {
        type: "words",
        title: "Modal vocabulary",
        wordIds: [
          word("obligacion"),
          word("permitir"),
          word("impedir"),
          word("puede-que"),
          word("quiza"),
          word("seguramente"),
        ],
      },
      {
        type: "conjugation",
        title: "deber and poder",
        note: "Modals are conjugated like ordinary verbs, and the form you already know is the one that matters.",
        verbIds: [verb("deber"), verb("poder"), verb("querer")],
        tenses: [PRES],
      },
      {
        type: "conjugation",
        title: "The same two after ojalá",
        note: "Chapter 8's subjunctive has no exceptions here. deber and poder are as regular in the subjunctive as in the indicative.",
        verbIds: [verb("deber"), verb("poder")],
        tenses: [SUBJ],
      },
      {
        type: "comparison",
        title: "How sure is the speaker?",
        note: "A scale, not three separate facts. Each step down is more uncertainty, not more politeness.",
        leftLabel: "form",
        rightLabel: "how sure",
        labelsLang: "en",
        groups: [
          {
            title: "Certain",
            left: "Es verdad.",
            right: "a fact, stated flat",
            note: "No modal at all. Only use this for things you would defend as fact.",
          },
          {
            title: "Probably",
            left: "Seguramente es verdad.",
            right: "almost certain",
            note: "The modal form, but a soft adverb in front of it does most of the work.",
          },
          {
            title: "Possibly",
            left: "Puede que sea verdad.",
            right: "could go either way",
            note: "Can que takes the subjunctive. It is the modal for doubt rather than for possibility about facts.",
          },
          {
            title: "Reported doubt",
            left: "No creo que sea verdad.",
            right: "somebody else doubts it",
            note: "Doubting is somebody's opinion, so the verb behind it is subjunctive. Chapter 8's rule, applied here.",
          },
        ],
      },
      {
        type: "text",
        title: "The one distinction that trips people up",
        body:
          "Poder and deber are ordinary verbs: they conjugate, and there is a full table for both. What makes them feel different is what they say about obligation.\n\nPoder splits three ways, and the split matters for inference. You can poder because you are able to: puedo, permission or capacity. You can poder because you are allowed to: no puedes, a rule. You can poder because something makes it possible: no puedes salir, it is raining.\n\nThat last one is where reading gets interesting. No puedes salir could mean a person said no, or that the weather said no, and nothing in the sentence tells you which. The reader has to look at the paragraph.\n\nDeber is simpler but has a second meaning worth knowing. Debes irte is an obligation: you must go. Debes estar enfermo is an inference: you must be ill, and the speaker is guessing from evidence. The two uses are the same verb, and only the surrounding words distinguish them.\n\nAnd a construction that is not a verb at all. Puede que takes the subjunctive and means maybe. It never changes and it has no endings, so unlike the rest of this lesson there is nothing to conjugate.\n\nOne habit for this chapter. When a text uses a modal, ask what the writer could not say directly. If the writer writes no puedes instead of no te permito, the writer is being careful, or being polite, or both.",
      },
    ],
    quiz: {
      id: "ch9-modales-quiz",
      title: "Modals quiz",
      passThreshold: 0.8,
      questions: [
        conj("deber", PRES, "yo"),
        conj("poder", PRES, "nosotros"),
        conj("deber", SUBJ, "ellos"),
        fill("No ___ (poder) salir, está lloviendo.", "puedo"),
        fill("___ que sea verdad.", "Puede"),
        fill("No creo ___ sea verdad.", "que"),
        pickOpts("In 'No puedes salir', what is ambiguous?", [
          "Whether a rule or the weather makes it impossible",
          "Who is speaking",
          "Whether it is night or day",
          "Whether the speaker wants to",
        ]),
        pickOpts("Debes estar malo means...", [
          "You must be ill (the speaker is inferring)",
          "You must be bad",
          "You owe money",
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
console.log(`chapter-9 now has ${chapter.lessons.length} lessons`);
