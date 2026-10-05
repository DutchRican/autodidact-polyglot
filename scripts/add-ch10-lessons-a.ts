/**
 * One-off content edit: chapter 10 lessons 1-5.
 *
 * 1 past-tense decision rules, 2 all six tenses, 3 irregular verbs,
 * 4 object pronouns, 5 the imperative.
 *
 * Lessons 6-10 land in scripts/add-ch10-lessons-b.ts.
 *
 * Object pronouns and the imperative are both new to the course, so they are the
 * two lessons here with real content to teach rather than material to consolidate.
 *
 * Run with: bun scripts/add-ch10-lessons-a.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const chapter = pack.chapters.find((c: { id: string }) => c.id === "chapter-10");
if (!chapter) throw new Error("chapter-10 missing");
if (chapter.lessons.length) throw new Error("chapter-10 already has lessons");
if (chapter.outline) throw new Error("chapter-10 has an outline; drop it before writing");

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

const PAST = ["preterite", "imperfect"];
const ALL_FINITE = ["present", "preterite", "imperfect", "subjunctive", "future", "conditional"];

const lessons: unknown[] = [
  {
    id: "ch10-preterito-imperfecto",
    order: 1,
    title: "Preterite or imperfect",
    subtitle: "The decision, and what it costs to get it wrong",
    sections: [
      {
        type: "conjugation",
        title: "One verb, two tenses",
        note: "hablar in both past tenses. Nothing about the endings is hard; everything about which one to pick is.",
        verbIds: [verb("hablar"), verb("ser")],
        tenses: PAST,
      },
      {
        type: "comparison",
        title: "The same three facts, told twice",
        note: "Both accounts are true. They differ only in what the reader is asked to notice.",
        leftLabel: "imperfect",
        rightLabel: "preterite",
        labelsLang: "en",
        groups: [
          {
            title: "A state",
            left: "La casa estaba vacía.",
            right: null,
            note: "No preterite exists for a state with no boundary. She emptied the house; the house being empty is what that produced.",
          },
          {
            title: "The boundary",
            left: null,
            right: "Se mudó en marzo.",
            note: "One complete event with edges. It is the boundary the imperfect state existed inside.",
          },
          {
            title: "Habit, then the exception",
            left: "Siempre llegaba tarde.",
            right: "Ayer llegó puntual.",
            note: "The pattern holds in the imperfect and breaks once in the preterite. Breaking a pattern is what makes it visible, which is why the pair works.",
          },
          {
            title: "Aged",
            left: "Cuando era niño, le gustaba el mar.",
            right: null,
            note: "A preterite version of this means the liking stopped. That is almost never what the sentence means.",
          },
        ],
      },
      {
        type: "text",
        title: "Five questions to ask",
        body:
          "This is the decision the whole course has been building towards, and it is a decision about the narrator's attention rather than about time. Two questions settle most cases.\n\nIs there an ending? Movement happened once and finished: se mudó, llegó, cerró. Preterite. A state held: estaba, sabía, quería. Imperfect.\n\nDid it happen more than once? A habit, a background, a thing that used to be true: imperfect. If it happened once and the story cares about that one time: preterite.\n\nWhen both fit, choose the one the sentence is about. He bajó and bajó describe the same descent. The difference is whether the reader is watching the stairs or the bottom of them.\n\nAnd the one that has no substitute. Era las once y media uses the imperfect for a completed time, because the hour is a state and Spanish does not allow a state to be preterite. The same goes with ser and the ages: era niño, not fue niño, unless the child stopped being a child.\n\nThe cost of getting it wrong is specific rather than vague. A preterite where the imperfect belonged makes a habit into a single event, which throws the reader off at exactly the point the sentence was setting up. An imperfect where the preterite belonged blurs the boundary the sentence was building towards, and the next paragraph arrives before the event has landed.\n\nChapter 9's night-shift text is a fair test. El primer mes contaba, el segundo mes contaba, al final del tercero ya no contaba nada: all imperfect, and the repeated verb is doing the work. Then se quedó mirando is a preterite, and the change of tense is the change of the man.",
      },
    ],
    quiz: {
      id: "ch10-preterito-imperfecto-quiz",
      title: "Past tense decisions",
      passThreshold: 0.8,
      questions: [
        conj("hablar", "preterite", "yo"),
        conj("hablar", "imperfect", "yo"),
        conj("ser", "imperfect", "el"),
        fill("Cuando ___ (ser) niño, le gustaba el mar.", "era"),
        fill("Ayer ___ (llegar) puntual por primera vez.", "llegó"),
        fill("Siempre ___ (llegar) tarde.", "llegaba"),
        pickOpts("Era las once y media uses the imperfect because", [
          "a time is a state, and a state has no preterite in Spanish",
          "the hour had not finished yet",
          "the hour is in the past",
        ]),
        pickOpts("He bajó and bajó differ because", [
          "the reader is watching the stairs, or the bottom of them",
          "one is polite and one is not",
          "one is Spain and one is Latin America",
          "one happened in the morning",
        ]),
      ],
    },
  },
  {
    id: "ch10-seis-tiempos",
    order: 2,
    title: "The six tenses, side by side",
    subtitle: "Each one against the other five",
    sections: [
      {
        type: "conjugation",
        title: "hablar in all six finite tenses",
        note: "The same verb, the same person, six ways of placing it in time. Everything else in the course is a detail of one of these six rows.",
        verbIds: [verb("hablar")],
        tenses: ALL_FINITE,
      },
      {
        type: "comparison",
        title: "What each tense is for",
        note: "One job each. Where two overlap, the second column wins for a stated reason.",
        leftLabel: "tense",
        rightLabel: "its one job",
        labelsLang: "en",
        groups: [
          {
            title: "present",
            left: "Hablo",
            right: "Now, or habitually",
            note: "Spanish has no progressive. The present covers both, and the context decides which.",
          },
          {
            title: "preterite",
            left: "Hablé",
            right: "A finished event with an end",
            note: "Also: anything that has happened and still matters. Hablado and comido are preterite participles.",
          },
          {
            title: "imperfect",
            left: "Hablaba",
            right: "A state, a habit, a setting",
            note: "Anything ongoing at the point another event interrupts it.",
          },
          {
            title: "subjunctive",
            left: "Hable",
            right: "Somebody's view rather than a fact",
            note: "Not a time at all. Wishes, doubts, feelings, other people's opinions.",
          },
          {
            title: "future",
            left: "Hablaré",
            right: "Later, including later today",
            note: "Spanish uses it for the near future far more than English does: hablaré con ella means I will speak to her later.",
          },
          {
            title: "conditional",
            left: "Hablaría",
            right: "Hypothetical, polite, or a guess about the past",
            note: "Also the polite register: hablaría Ud. es would como would you like.",
          },
        ],
      },
      {
        type: "text",
        title: "Why the subjunctive is the odd one out",
        body:
          "Five of the six place a statement on a timeline. The subjunctive does not, and that is worth being clear about, because it is the only tense in the course whose job is not time.\n\nHablo, hablé, hablaba, hablaré, hablaría all assert. Each one can be true or false, and each one can be contradicted by a later observation. Hable cannot. Hable means somebody wants it, doubts it, or is mistaken about it, and it says nothing at all about whether it happens.\n\nThis is why the subjunctive takes so many triggers. Ojalá, esperar que, querer que, no creo que, es posible que, para que: all of them are ways of reporting that a statement belongs to someone rather than to the world. Chapter 8 built the endings; this is what they are for.\n\nThe other useful thing about this chapter is what the tense order in the tables means. Present, then the two past tenses, then the subjunctive, then the two non-finite ones. It is roughly the order the course teaches them in, and it is also the order of how much work each one does: you will use the present every day and the conditional rarely but unpleasantly often, because polite Spanish is built on it.\n\nOne practical exercise. Take any sentence you produced this week and put it through all six rows out loud. Hablo, hablé, hablaba, hable, hablaré, hablaría. Six forms, no meaning changes to work out. If a row is impossible, that is information: your sentence has a viewpoint in it somewhere.",
      },
    ],
    quiz: {
      id: "ch10-seis-tiempos-quiz",
      title: "Six tenses",
      passThreshold: 0.8,
      questions: [
        conj("hablar", "future", "yo"),
        conj("hablar", "conditional", "tu"),
        conj("hablar", "subjunctive", "nosotros"),
        pickOpts("Which tense reports somebody's view rather than a fact?", [
          "subjunctive",
          "preterite",
          "imperfect",
          "future",
        ]),
        pickOpts("Hablaré con ella means", [
          "I will speak to her later, quite possibly today",
          "I would speak to her",
          "I used to speak to her",
          "I speak to her tomorrow and every day",
        ]),
        pickOpts("Which of these is a mood, not a time?", ["subjunctive", "preterite", "future"]),
        fill("Soy profesor = ___ profesor.", "Era"),
      ],
    },
  },
  {
    id: "ch10-irregulares",
    order: 3,
    title: "Los verbos irregulares",
    subtitle: "The six that keep catching people out",
    sections: [
      {
        type: "conjugation",
        title: "ser and estar in all six",
        note: "The two verbs a learner uses most and thinks about least. Both are irregular in five of the six tenses.",
        verbIds: [verb("ser"), verb("estar"), verb("ir")],
        tenses: ALL_FINITE,
      },
      {
        type: "comparison",
        title: "Three kinds of irregularity",
        note: "Once you know which kind a verb is, you know where to look for the odd form.",
        leftLabel: "kind",
        rightLabel: "what happens",
        labelsLang: "en",
        groups: [
          {
            title: "Fully irregular",
            left: "ser",
            right: "soy, eres, es, somos, sois, son",
            note: "Nothing derivable. Also eres, which is the one form the tú of ser is used to.",
          },
          {
            title: "A stem change",
            left: "querer",
            right: "quiero, quieres... queramos",
            note: "The stem changes on tú, usted and ellos, and not on nosotros or vosotros. The same four-personae split as the subjunctive.",
          },
          {
            title: "Orthography only",
            left: "buscar",
            right: "busque, busquemos, busquen",
            note: "The stem is unchanged; a c or a g needs written qu or gu in front of e and i. No new form to memorise.",
          },
        ],
      },
      {
        type: "text",
        title: "The five checks that catch most of it",
        body:
          "The verb reference page conjugates all 74 verbs in all seven tenses, and this chapter exists so that page is trustworthy rather than merely complete.\n\nCheck one: the yo form. It is the odd one in most verbs and the only one in the others, which makes it the highest-yield thing to memorise. Tengo, hago, pongo, salgo, sé, voy. Six verbs, six forms, and they are the only ones that appear nowhere else in the paradigm.\n\nCheck two: whether the preterite is the present. Only two verbs break this, and both break it the same way. Ir has the present of ser inside it: voy, vas, va, vamos, vais, van. And haber is the reverse, taking estar in the present and ir in the past: he estado, he ido, hubo.\n\nCheck three: whether an -ir verb drops its ending in the preterite third person. Sentir, pedir, dormir, servir and seguir all give sintió, pidió, durmió, sirvió, siguió. That is the only place in the preterite where the stem moves, and it is the reason the preterite of an -ir stem changer is worth learning as a set.\n\nCheck four: whether the subjunctive plural differs from the singular. Sentir gives sienta and sintamos. Dormir gives duerma and duermamos. They are not the same kind of change and no single rule covers both, which is the single most surprising fact in the course.\n\nCheck five: whether the imperative could be derived. It could not, which is why chapter 9's subjunctive and this chapter's imperative are both derived rather than memorised. Every affirmative imperative is the present less an ending, or the subjunctive unchanged, with exactly six exceptions in 74 verbs.\n\nOne habit that settles most of it. Read the table column by column for a verb you do not know, and look for the rows where the form is not the stem plus an obvious ending. That is where irregularity lives, and there are never more than three rows per verb.",
      },
    ],
    quiz: {
      id: "ch10-irregulares-quiz",
      title: "Irregular verbs",
      passThreshold: 0.8,
      questions: [
        conj("ser", "present", "yo"),
        conj("ir", "present", "nosotros"),
        conj("tener", "preterite", "el"),
        conj("dormir", "preterite", "ellos"),
        conj("dormir", "subjunctive", "nosotros"),
        fill("Sentir, past third person: sent___", "ió"),
        fill("Haber, presente, tercera persona del singular: ___", "hay"),
        pickOpts("Which verb has the present of ser inside it?", ["ir", "haber", "estar"]),
        pickOpts("Which pair differs in kind from the other?", [
          "sentir / sintamos",
          "querer / queramos",
          "tener / tengamos",
          "poder / podamos",
        ]),
        pickOpts("Where does irregularity live?", [
          "In the rows whose form is not the stem plus an obvious ending",
          "In the nosotros row of every verb",
          "In the yo row of regular verbs",
          "In the future, which never changes",
        ]),
      ],
    },
  },
  {
    id: "ch10-pronombres",
    order: 4,
    title: "Los pronombres de objeto",
    subtitle: "me, te, se, lo, la, le, les",
    sections: [
      {
        type: "words",
        title: "The pronouns",
        wordIds: [
          word("pron-me"),
          word("pron-te"),
          word("pron-lo"),
          word("pron-la"),
          word("pron-nos"),
          word("pron-os"),
          word("pron-los"),
          word("pron-las"),
          word("dativo-le"),
          word("pron-les"),
          word("se-impersonal"),
        ],
      },
      {
        type: "comparison",
        title: "Direct and indirect",
        note: "The same verb, the same sentence, the pronoun moved. This is the one change a learner can make without learning a single new word.",
        leftLabel: "without",
        rightLabel: "with",
        labelsLang: "en",
        groups: [
          {
            title: "Direct object: the thing",
            left: "Leo el libro.",
            right: "Lo leo.",
            note: "The pronoun replaces the noun and goes in front of the verb. leo el libro and lo leo are the same fact.",
          },
          {
            title: "Direct object, feminine plural",
            left: "Leo las cartas.",
            right: "Las leo.",
            note: "The verb does not change. It is the pronoun that carries the gender and the number.",
          },
          {
            title: "Indirect object: the recipient",
            left: "Doy el libro a Marta.",
            right: "Le doy el libro.",
            note: "le stands in for a Marta, so a Marta disappears and the sentence gets shorter.",
          },
          {
            title: "Indirect to a group",
            left: "Doy el libro a los niños.",
            right: "Les doy el libro.",
            note: "And here le becomes les, which is the only difference between the two.",
          },
          {
            title: "Both at once",
            left: "Entrego el informe al jefe.",
            right: "Se lo entrego.",
            note: "Two pronouns, indirect first. This is the only place the order is fixed, and it is the exam's favourite question.",
          },
        ],
      },
      {
        type: "text",
        title: "Where the pronoun goes, and what happens with no",
        body:
          "Spanish prefers the pronoun to the noun, and unlike English it nearly always puts it in front of the conjugated verb. Lo leo, not leo lo. This is why a Spanish sentence is recognisable at a glance even when you cannot read it.\n\nThree rules for the position.\n\nBefore the conjugated verb: lo leo, le doy el libro, se lo entrego. This is the default and covers most sentences.\n\nAttached to the end when the verb is an infinitive, a gerund or an affirmative imperative: quiero comerlo, lo estoy haciendo, mándamelo. The pronoun joins on, and the accent moves if the stress has to.\n\nIn front, always, when there is a no: no lo leo, no quiero comerlo. A negative pushes the pronoun away from the infinitive, which is the opposite of the affirmative case. Compare quiero comerlo with no quiero comerlo: same verb, same pronoun, different position.\n\nAnd se, which does three unrelated jobs and is the reason Spanish pronouns are hard. Reflexive: me levanto, and the pronoun makes the verb mean something the plain form does not. Substitute: quiero el libro, no lo tengo, and se stands for el libro. Passive: se habla español, where nobody is doing the speaking and the pronoun exists only to make a passive that Spanish has no other way of building. The same four letters, three unrelated functions, and the only reliable test is what the verb does without it.\n\nThe leísmo problem, which you will meet. In Spain le is used for a woman, and a speaker may be corrected for it. Non-speakers use lo for anything, and are not corrected. Both work; the difference is regional, not grammatical, and it is one of the few places where usage and correctness come apart.",
      },
    ],
    quiz: {
      id: "ch10-pronombres-quiz",
      title: "Object pronouns",
      passThreshold: 0.8,
      questions: [
        fill("Leo el libro = ___ leo.", "Lo"),
        fill("Leo las cartas = ___ leo.", "Las"),
        fill("Doy el libro a Marta = ___ doy el libro.", "Le"),
        fill("Doy el libro a los niños = ___ doy el libro.", "Les"),
        fill("Entrego el informe al jefe = ___ lo entrego.", "Se"),
        fill("Quiero comer el pastel = quiero comer___.", "lo"),
        pickOpts("In a sentence with both, the pronouns go", [
          "indirect first: se lo entrego",
          "direct first: lo se entrego",
          "alphabetically",
          "in the order of the nouns they replace",
        ]),
        pickOpts("no quiero comerlo puts the pronoun", [
          "in front, because a negative pushes it away from the infinitive",
          "at the end, like an affirmative",
          "before no",
          "nowhere; a negative removes it",
        ]),
        pickOpts("Se habla español is", [
          "a passive, and nobody is doing the speaking",
          "a reflexive",
          "a substitute pronoun",
          "the imperative",
        ]),
      ],
    },
  },
  {
    id: "ch10-imperativo",
    order: 5,
    title: "El imperativo",
    subtitle: "The one mood with no yo, and six exceptions",
    sections: [
      {
        type: "conjugation",
        title: "hablar, tener and ser",
        note: "There is no yo row, and the dash is a fact about Spanish rather than a gap: an order to yourself is not an order.",
        verbIds: [verb("hablar"), verb("tener"), verb("ser")],
        tenses: ["imperative"],
      },
      {
        type: "comparison",
        title: "The two derivations",
        note: "Everything else in the imperative follows from these two. Six verbs in 74 do not, and they are listed below rather than left as surprises.",
        leftLabel: "personae",
        rightLabel: "comes from",
        labelsLang: "en",
        groups: [
          {
            title: "tú",
            left: "habla",
            right: "the present less its final -s",
            note: "hablas -> habla, comes -> come. Holds for every verb except the six, which is why it is worth trusting.",
          },
          {
            title: "vosotros",
            left: "hablad",
            right: "the present less its own ending",
            note: "habláis -> habl + ad. Not minus the final s: that would leave coméi.",
          },
          {
            title: "usted and ustedes",
            left: "hable",
            right: "the present subjunctive",
            note: "The polite command looks like the subjunctive because it is one.",
          },
          {
            title: "nosotros",
            left: "hablemos",
            right: "the present subjunctive",
            note: "And the friendly one: hablemos, comamos. One word separates us from strangers.",
          },
          {
            title: "The six exceptions",
            left: "sé, está, ve, ten, da, ve",
            right: "not derivable",
            note: "ser, estar, ir, tener, dar and ver. sé and dé take an accent, da and ve do not. saber is not one of them: sabe, sepa, sepamos is fully regular.",
          },
        ],
      },
      {
        type: "text",
        title: "The negative, and the pronoun",
        body:
          "The negative imperative needs no tense of its own. It is the subjunctive with a no in front, and nothing else: no hable, no comamos, no sea. Once chapter 8's subjunctive is in place, the whole negative imperative is available.\n\nThe reason is worth knowing, because it makes the affirmative stranger rather than the negative. An affirmative order asserts: you will do this. That is a statement about the world, so it takes the tense that asserts things. A negative order does not assert anything, it withdraws an assertion, and a withdrawal takes the mood that means somebody's view. Hence tú affirmative is the present and tú negative is the subjunctive, and hence the odd fact that no hables is not built from habla by adding anything.\n\nThe pronoun moves. No lo hagas, not no hazlo. This is the exception to the infinitive rule in the previous lesson, and it is worth learning as a pair: quiero comerlo and no quiero comerlo.\n\nAnd the reflexive attaches, with the accent moving with it. Levántate, not te levanta. This is the one place in the course where the reflexive pronoun goes on the end, and it is why the verb reference shows the pronoun written into the form for these eight verbs rather than prefixed to it.\n\nTwo forms worth having by heart, because they are the commonest commands in Spanish and neither is derivable: ten cuidado, and no te preocupes. The second is subjunctive plus no plus the pronoun, so it is three things you already know.\n\nOne practical note on vosotros. It is the Spain form and it is spoken constantly in Spain, so it is not optional if you are going there. It is nearly extinct in Latin America, where ustedes does both jobs. Both appear in the tables, because both are correct somewhere.",
      },
    ],
    quiz: {
      id: "ch10-imperativo-quiz",
      title: "Imperative",
      passThreshold: 0.8,
      questions: [
        conj("hablar", "imperative", "tu"),
        conj("hablar", "imperative", "nosotros"),
        conj("tener", "imperative", "vosotros"),
        conj("ser", "imperative", "tu"),
        conj("comer", "imperative", "ellos"),
        fill("No ___ (hablar) con ella.", "hable"),
        fill("No ___ (ser) tonto.", "seas"),
        fill("No lo ___ (hacer).", "hagas"),
        pickOpts("The negative imperative is", [
          "the subjunctive with no in front, and needs no tense of its own",
          "the present with no in front",
          "a separate tense the tables do not show",
          "the conditional with no in front",
        ]),
        pickOpts("sé, está, ten and da are", [
          "irregular imperatives, and none is derivable",
          "regular, and derived like the rest",
          "subjunctive forms",
          "the only irregular verbs in Spanish",
        ]),
        pickOpts("Which is NOT one of the six irregular imperatives?", [
          "saber",
          "ser",
          "estar",
          "tener",
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
