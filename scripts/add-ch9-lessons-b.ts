/**
 * One-off content edit: Chapter 9 lessons 6-10.
 *
 * Sequencing connectors, narration in time, the three long readings, and a
 * review. Lessons 1-5 landed in scripts/add-ch9-lessons-a.ts.
 *
 * Run with: bun scripts/add-ch9-lessons-b.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const chapter = pack.chapters.find((c: { id: string }) => c.id === "chapter-9");
if (!chapter) throw new Error("chapter-9 missing");
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

const PRET = "preterite";
const IMPF = "imperfect";

const bus = story("st-el-ultimo-bus");
const rio = story("st-el-rio");
const sopa = story("st-como-hacer-sopa");

const lessons: unknown[] = [
  {
    id: "ch9-conectores",
    order: 6,
    title: "Conectores de narración",
    subtitle: "Ordering events without repeating tenses",
    sections: [
      {
        type: "words",
        title: "Sequencing words",
        wordIds: [
          word("de-repente"),
          word("al-final"),
          word("mientras-tanto"),
          word("en-cambio"),
          word("en-cuanto"),
          word("a-medida-que"),
          word("ahora-bien"),
        ],
      },
      {
        type: "comparison",
        title: "What each one signals",
        leftLabel: "connector",
        rightLabel: "signals",
        labelsLang: "en",
        groups: [
          {
            title: "A jump in time",
            left: "de repente",
            right: "an interruption",
            note: "No time passes and the subject can change. The most common way to start a new beat.",
          },
          {
            title: "Overlapping time",
            left: "mientras tanto",
            right: "two things at once",
            note: "Both clauses are imperfect. If either is preterite, the overlap is broken.",
          },
          {
            title: "Coming after",
            left: "al final",
            right: "the end of a sequence",
            note: "Usually the preterite. Al final llegó means the last event completed.",
          },
          {
            title: "Contrast",
            left: "en cambio",
            right: "the other side",
            note: "Compares two facts, so both sides are usually perfect tenses.",
          },
          {
            title: "Ongoing change",
            left: "a medida que",
            right: "both sides imperfect",
            note: "Two processes running together, neither complete. The opposite of en cuanto.",
          },
        ],
      },
      {
        type: "text",
        title: "Connectors are tenses in disguise",
        body:
          "A connector is not decoration. It tells you which tense to reach for, and that is why chapter 8's list was mostly about argument while this one is about time.\n\nDe repente and al final are preterite connectors. De repente el hombre miró el reloj: one complete action, no time passed. Al final Marta llegó a casa: another complete action, and it ends a sequence.\n\nMientras tanto and a medida que are imperfect connectors, because both sides of them describe states rather than events. Mientras tanto, Marta comprendió... is the awkward one: the understanding is a preterite event inside an imperfect frame, and Spanish is quite happy with that, because the frame is what the connector is describing and the event is what happened inside it.\n\nEn cuanto is the exception, and the useful one. En cuanto marco el reloj, el hombre se puso de pie: the first clause is an imperfect that will be completed later, the second is a preterite that completed it. That asymmetry is the whole meaning of en cuanto, and it is also why it needs the imperfect rather than the preterite.\n\nThe practical rule. If the connector describes a situation, use imperfect. If it describes a boundary, use preterite. De repente is a boundary. Mientras tanto is a situation.\n\nOne more worth having, because it changes the feel of a whole text: ahora bien. It means now then, and it marks a speaker changing position. It never appears in a story and almost always appears in an argument.",
      },
    ],
    quiz: {
      id: "ch9-conectores-quiz",
      title: "Sequencing connectors quiz",
      passThreshold: 0.8,
      questions: [
        pick("Which connector introduces an interruption?", "de repente", [
          "mientras tanto",
          "al final",
          "en cambio",
        ]),
        fill("___ final Marta llegó a casa.", "Al"),
        pick("Which connector needs imperfect on both sides?", "a medida que", [
          "en cuanto",
          "al final",
          "de repente",
        ]),
        fill("Mientras ___ el hombre esperaba, Marta hacía lo mismo.", "tanto"),
        pick("Where does ahora bien appear?", "In an argument, when the speaker changes position", [
          "In a recipe, between steps",
          "In a diary, before an event",
          "Only in questions",
        ]),
        pickOpts("En cuanto se followed by", [
          "an imperfect clause, then a preterite",
          "two preterite clauses",
          "two subjunctive clauses",
          "a conditional clause",
        ]),
      ],
    },
  },
  {
    id: "ch9-narrar",
    order: 7,
    title: "Narrar en el tiempo",
    subtitle: "Backdrop and event, which is the whole trick",
    sections: [
      {
        type: "conjugation",
        title: "The two past tenses side by side",
        note: "Same verbs, same personae. Only the tense changes, and the tense decides whether the reader sees a scene or a list.",
        verbIds: [verb("venir"), verb("decir"), verb("dormir"), verb("ser")],
        tenses: [PRET, IMPF],
      },
      {
        type: "comparison",
        title: "Backdrop, then event",
        note: "The imperfect is the room the preterite happens in. Take the room away and the event has no meaning.",
        leftLabel: "imperfect",
        rightLabel: "preterite",
        labelsLang: "en",
        groups: [
          {
            title: "Setting",
            left: "Marta bajó a la parada un cuarto de hora antes.",
            leftTranslation: null,
            right: "Marta perdió el autobús.",
            note: "One is background and the other is what happened. Both are past; only one of them is the story.",
          },
          {
            title: "Repeated habit",
            left: "Hablaban de sus nietos.",
            right: "Hablaron de sus nietos.",
            note: "Same verb, same words. The imperfect says it went on; the preterite says it finished.",
          },
          {
            title: "Being, not doing",
            left: "Era las once y media.",
            right: "Fue las once y media.",
            note: "Spanish uses era even for a single completed time. This is the one place the imperfect looks wrong and is not.",
          },
          {
            title: "Age",
            left: "Cuando era niña, no le gustaba leer.",
            right: null,
            note: "A past state with no end point. There is no preterite version of this sentence that means the same thing.",
          },
        ],
      },
      {
        type: "text",
        title: "How a scene is built",
        body:
          "The bus story is about 180 words and every one of them is either a room or something happening in it. That is not a coincidence; that is how long text is built.\n\nThe room comes first and is nearly always imperfect: el último autobús sale a las once y media. Marta lo sabe, y por eso baja a la parada antes de la hora que le conviene. Both of those are states, and both are the setup.\n\nThen the event: de pronto el hombre miró el reloj y se puso de pie. Two preterites, one gesture. The reader feels the scene stop.\n\nThen the interruption: mientras tanto, Marta comprendió que había perdido el autobús. Note what happened. The connector is imperfect, and the verb inside it is a preterite. The frame is a situation, and the understanding is an event inside it, and Spanish lets you say both in one sentence.\n\nThen the chase: salió corriendo y llegó cuando el coche ya estaba arrancando. Salió and llegó are both preterite and both are events, so there is no signal that they are complete except the preterite itself. That is what the preterite is for.\n\nThe last paragraph has no preterite at all. Pensó, y luego pensó, no sabía, no tenía. Everything is either imperfect or a pluperfect, and the paragraph is entirely inside Marta's head. The bus has not stopped being the subject of the story; the camera has simply moved.\n\nThe practical test. Read a past-tense paragraph and ask whether you could replace the verb with being there. Era cinco minutos de las once: yes, a room. Miró el reloj: no, a boundary. That single question settles almost every case.",
      },
    ],
    quiz: {
      id: "ch9-narrar-quiz",
      title: "Narration quiz",
      passThreshold: 0.8,
      questions: [
        conj("venir", PRET, "yo"),
        conj("venir", IMPF, "yo"),
        conj("decir", PRET, "ellos"),
        conj("ser", IMPF, "nosotros"),
        pickOpts("Marta perdió el autobús is", [
          "preterite, because it is a completed event",
          "imperfect, because it happened in the past",
          "subjunctive, because nobody is sure",
          "conditional, because it may not have happened",
        ]),
        pickOpts("Hablaban de sus nietos vs Hablaron de sus nietos", [
          "ongoing vs finished",
          "formal vs informal",
          "first person vs third person",
          "spoken vs written",
        ]),
        fill("Cuando ___ (ser) niña, le gustaba leer.", "era"),
        pickOpts("For a time, Spanish uses era even when...", [
          "the event is complete",
          "the subject is plural",
          "the sentence is negative",
        ]),
      ],
    },
  },
  {
    id: "ch9-lectura-cuento",
    order: 8,
    title: "Lectura larga: un cuento",
    subtitle: "El último autobús",
    sections: [
      {
        type: "story",
        title: "El último autobús",
        note:
          "Five glosses for 180 words, against about twenty for a chapter 5 story. Nothing is explained, and you are expected to follow it anyway.",
        storyId: bus.id,
      },
      {
        type: "text",
        title: "What the ending is doing",
        body:
          "The story is built so that its last line is the only one you could not have guessed.\n\nThe setup is a plan, and a plan makes a reader expect a result. Marta goes early on purpose, so we are waiting to find out whether that was sensible. It turns out she met a man, and they talked, and the bus went without her. That is the event, and it is disappointing in the ordinary way.\n\nThen the last paragraph turns it. She got home, and she thinks she was lucky, and then decides she was not: to have been lucky she would first have had to have missed the bus. That is the writer rearranging the story after the fact, and it is the only time in 180 words that a conclusion is stated.\n\nThe final two sentences refuse to name the feeling at all. It was not happiness and it was not sadness. That is not the writer being lazy; it is the writer saying the feeling is new to her, which is why she never told anyone.\n\nAnd she did not tell anyone, the text says, not because the man mattered but because she could not explain it. So the story's subject turns out not to be the bus at all.",
      },
    ],
    quiz: {
      id: "ch9-lectura-cuento-quiz",
      title: "Reading comprehension: the bus",
      passThreshold: 0.75,
      questions: bus.questions,
    },
  },
  {
    id: "ch9-lectura-textos",
    order: 9,
    title: "Lectura larga: argumento y receta",
    subtitle: "Dos textos que no cuentan una historia",
    sections: [
      {
        type: "story",
        title: "¿Abrir el río?",
        note: "An argument. Nobody is a narrator with a secret; the subject is how two sides talk.",
        storyId: rio.id,
      },
      {
        type: "story",
        title: "Cómo hacer sopa de verduras",
        note: "Instructions, where the reader is meant to follow the order and nothing else.",
        storyId: sopa.id,
      },
      {
        type: "text",
        title: "Three texts, three shapes",
        body:
          "These three are the same length and nothing else is the same, which is the useful part.\n\nA story moves forward and hides things. An argument sits still and weighs things, and its structure is the two sides rather than the events. An instruction has no opinion at all, and its structure is the order of steps.\n\nThe river text is the clearest example of the argument shape. The opening states the situation and says outright that both sides are partly right, which is a narrator telling you in advance not to take a side. Each side then gets a paragraph, and in each the writer uses a different level of commitment: the first group says, the second group says but adds a objection, and the narrator closes by suggesting the answer might be neither. Note that the whole thing happens in the present tense. Nothing in an argument happened; it is being conducted.\n\nThe recipe is the opposite and harder to read, because there is nothing to hold on to. Its only structure is the order, and the order is the meaning. Salt goes in early and little, because you can add more and you cannot take it out. That sentence is the recipe's argument, and it is hidden in a cooking instruction.\n\nIf you can tell which shape you are in, you can read all three. If you cannot, everything runs together and all three feel equally hard.",
      },
    ],
    quiz: {
      id: "ch9-lectura-textos-quiz",
      title: "Reading comprehension: river and soup",
      passThreshold: 0.75,
      questions: [...rio.questions, ...sopa.questions],
    },
  },
  {
    id: "ch9-repaso",
    order: 10,
    title: "Repaso",
    subtitle: "Chapter 9 mixed drill",
    sections: [
      {
        type: "text",
        title: "What you now know",
        body:
          "Chapter 9 was about reading rather than grammar, so there is no new conjugation to remember. There are five habits instead.\n\nYou can read a suffix and know the kind of word before you know the meaning. -ción and -dad make feminine nouns, -oso makes an adjective, -mente makes an adverb, -ero makes a person or a shop. That alone stops you stopping.\n\nYou know a prefix is worth less than a suffix, and you know which two to trust: in- and sub-.\n\nYou know a connector is a tense in disguise. De repente and al final take the preterite; mientras tanto and a medida que take the imperfect; en cuanto takes both, imperfect then preterite.\n\nYou know the imperfect is the room and the preterite is what happens in it, and you can tell which one you have by asking whether you could have been there.\n\nAnd you know that in longer text the point is usually the part nobody says.\n\nThree words to end on, because they do most of the work in all three readings. Escribir means to write and is the most neutral word for a text. Leer means to read, and only for written things. Contar means to tell, and only for a story somebody says. Chapter 3 gave you the first two in a lesson about reading; chapter 9 has spent 180 words each on a text you read, a text you are told, and a text nobody is telling you anything.",
      },
      {
        type: "words",
        title: "The chapter in twelve words",
        wordIds: [
          word("implicito"),
          word("formal"),
          word("suf-oso"),
          word("inutil"),
          word("puede-que"),
          word("de-repente"),
          word("correr"),
          word("llegar"),
        ],
      },
    ],
    quiz: {
      id: "ch9-repaso-quiz",
      title: "Chapter 9 review",
      passThreshold: 0.8,
      questions: [
        conj("venir", PRET, "tu"),
        conj("venir", IMPF, "tu"),
        pick("Which suffix always makes a feminine noun?", "-ción", ["-oso", "-mente", "-ero"]),
        pick("Which prefix is most reliable?", "in-", ["des-", "con-", "super-"]),
        pick("De repente goes with which tense?", "preterite", [
          "imperfect",
          "subjunctive",
          "conditional",
        ]),
        pick("Mientras tanto goes with which tense?", "imperfect", [
          "preterite",
          "subjunctive",
          "future",
        ]),
        fill("___ que sea verdad.", "Puede"),
        fill("___ puedes salir: no lo permite la ley.", "No"),
        fill("___ final se fue.", "Al"),
        pickOpts("Contar means", [
          "to tell a story",
          "to read silently",
          "to write down",
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
