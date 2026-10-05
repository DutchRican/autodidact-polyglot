/**
 * One-off content edit: Chapter 8's ten lessons (opinions and connectors).
 *
 * This is the chapter that pays off the subjunctive. `ojalá` and `esperar que`
 * have appeared in a chapter 4 reading since chapter 4 shipped and were never
 * explained; lesson 1 is where that gets fixed.
 *
 * Every conjugation section pins `tenses` explicitly and includes "subjunctive"
 * only where the lesson is about the mood.
 *
 * Run with: bun scripts/add-ch8-lessons.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const chapter = pack.chapters.find((c: { id: string }) => c.id === "chapter-8");
if (!chapter) throw new Error("chapter-8 missing");
if (chapter.lessons.length) throw new Error("chapter-8 already has lessons");

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

const PRES = "present";
const SUBJ = "subjunctive";
const SUBJ_PRES = ["subjunctive"];
const SUBJ_AND_PRES = ["present", "subjunctive"];

const lessons: unknown[] = [
  {
    id: "ch8-ojala",
    order: 1,
    title: "Ojalá y el subjuntivo",
    subtitle: "The one mood you cannot build out of the indicative",
    sections: [
      {
        type: "conjugation",
        title: "hablar, tener, poder",
        note: "Same verbs you already know, in a mood you do not. The -ar and -er endings differ; -er and -ir are identical.",
        verbIds: [verb("hablar"), verb("tener"), verb("poder")],
        tenses: SUBJ_PRES,
      },
      {
        type: "words",
        title: "Mood and hope",
        wordIds: [word("duda"), word("sorpresa"), word("alegria"), word("proposito")],
      },
      {
        type: "comparison",
        title: "What changes and what does not",
        note: "The endings change. The stem usually does not, which is why the tables look familiar.",
        leftLabel: "indicative",
        rightLabel: "subjunctive",
        labelsLang: "en",
        groups: [
          {
            title: "An -ar verb",
            left: "Hablo con ella.",
            leftTranslation: "I speak to her.",
            right: "Hable con ella.",
            note: "-ar takes e, es, e, emos, éis, en in the subjunctive. The stem is untouched.",
          },
          {
            title: "An -er verb",
            left: "Tengo una pregunta.",
            leftTranslation: "I have a question.",
            right: "Tenga una pregunta.",
            note: "-er and -ir both take a, as, a, amos, áis, an.",
          },
          {
            title: "With ojalá",
            left: null,
            right: "Ojalá hable con ella.",
            note: "ojalá takes the subjunctive and nothing else. There is no indicative form of ojalá.",
          },
          {
            title: "Without ojalá",
            left: "Quiero que hable con ella.",
            right: null,
            note: "querer QUE also takes the subjunctive. Chapter 4's future is untouched by any of this.",
          },
        ],
      },
      {
        type: "text",
        title: "Why there is a second mood at all",
        body:
          "Every tense so far has one job: report what you know is true. Hablo, tengo, hablo mañana. All of those are things you can be sure of, or at least are stating flatly.\n\nThe subjunctive is for everything else. Wishes, doubts, feelings, things you want, things you are not sure of, things that are somebody else's opinion. In Spanish this is a whole second set of endings.\n\nThe endings are worth learning as one shape rather than three, because -er and -ir are identical and only -ar differs.\n\n-ar: hable, hables, hable, hablemos, habléis, hablen\n\n-er and -ir: tenga, tengas, tenga, tengamos, tengáis, tengan\n\nIf you can say \"tenga\" you can say \"pueda\", \"sepa\" and \"venga\". One set of six covers almost everything you will meet.\n\nojalá is the easiest way in, because it takes the subjunctive and nothing else, and it has an accent that stays there in every form: ojalá, ojalá viniera, ojalá no llueva.\n\nOjalá se followed by the imperfect is the tense you will see most: ojalá fuera, ojalá tuviera, ojalá pudiera. That is not the same ojalá as chapter 4's, because the verb behind it is in a past mood. For now, present subjunctive after ojalá is the useful one: ojalá entienda.\n\nTwo more to have ready. esperar QUE, from chapter 4's reading, takes the subjunctive: espero que vengas. And no creo que, which takes it too: no creo que sea verdad. Both are lesson 2.",
      },
    ],
    quiz: {
      id: "ch8-ojala-quiz",
      title: "Subjunctive basics quiz",
      passThreshold: 0.8,
      questions: [
        conj("hablar", SUBJ, "yo"),
        conj("hablar", SUBJ, "nosotros"),
        conj("tener", SUBJ, "yo"),
        conj("tener", SUBJ, "ellos"),
        conj("poder", SUBJ, "tu"),
        pick("Which is the subjunctive of 'tener'?", "tenga", [
          "tengo",
          "tengue",
          "tenga-ga",
        ]),
        pick("How do you say 'I hope she understands'?", "Ojalá entienda", [
          "Ojalá entiende",
          "Ojalá entenderá",
          "Ojalá entiendo",
        ]),
        fill("Ojalá ___ (tener) tiempo.", "tenga"),
        fill("___ (querer) que vengas.", "Quiero"),
      ],
    },
  },
  {
    id: "ch8-emocion",
    order: 2,
    title: "Emotion, doubt and expectation",
    subtitle: "The three reasons the subjunctive appears",
    sections: [
      {
        type: "conjugation",
        title: "creer, pensar, dudar",
        note: "creer and dudar are the ones that flip. pensar only changes shape, not mood.",
        verbIds: [verb("creer"), verb("pensar"), verb("dudar")],
        tenses: SUBJ_AND_PRES,
      },
      {
        type: "comparison",
        title: "Same verb, two moods, different meaning",
        note: "This is the heart of it. Whether the clause after que takes the subjunctive is what tells you who is being reported and how sure anyone is.",
        leftLabel: "indicative",
        rightLabel: "subjunctive",
        labelsLang: "en",
        groups: [
          {
            title: "My own belief",
            left: "Creo que viene.",
            leftTranslation: "I think he is coming.",
            right: null,
            note: "When you report your own belief, you are stating a fact about what you think. Indicative.",
          },
          {
            title: "Someone else's belief",
            left: null,
            right: "No creo que venga.",
            note: "Negation is what flips it. No creo que venga means I do not think he is coming.",
          },
          {
            title: "Doubt either way",
            left: "Creo que viene.",
            right: "Dudo que venga.",
            note: "dudar QUE always takes the subjunctive. Whether you doubt or not is the whole signal.",
          },
          {
            title: "Expectation",
            left: null,
            right: "Espero que venga.",
            note: "esperar QUE, from chapter 4's reading. Hope and expectation behave like doubt.",
          },
          {
            title: "Fear",
            left: null,
            right: "Tengo miedo que venga.",
            rightTranslation: null,
            note: "tener miedo DE que. The de is not optional: tengo miedo de que venga.",
          },
        ],
      },
      {
        type: "text",
        title: "The rule that is nearly a rule",
        body:
          "There is a single pattern behind almost every use, and once you see it the rest is detail.\n\nIf the main clause is about YOUR certainty, your feeling, your wish or your opinion, the clause after que takes the subjunctive.\n\nCreo que viene — I think he is coming. Your belief. Indicative, because you are reporting what you know.\n\nNo creo que venga — I do not think he is coming. Your belief, negated. Subjunctive, because now you are reporting what someone else said or what you doubt.\n\nDudo que venga. Subjunctive.\n\nEspero que venga. Subjunctive.\n\nTengo miedo de que venga. Subjunctive.\n\nMe alegro de que venga. Subjunctive.\n\nEs una pena que venga. Subjunctive.\n\nIn English all six of those are flat declaratives with no mood change at all. Spanish has to mark the shift, and it marks it with the verb.\n\nSo the practical test is short. Ask yourself: am I stating something, or am I reporting somebody's view, including my own doubt? Statement means indicative. Report means subjunctive.\n\nThree traps.\n\nThe negative can sit anywhere. No creo que venga, but also Creo que no viene — that one is indicative and means I think he is not coming. The negation matters where it sits, not merely that it exists.\n\nque is not always followed by the subjunctive. Creo que es verdad is fine, and correct: you are stating what you believe as a fact about the world. It is only when the belief itself is the subject that the mood shifts.\n\nAnd cuando means when, not because. cuando + indicative, porque + indicative. Do not carry the subjunctive across from one to the other.",
      },
    ],
    quiz: {
      id: "ch8-emocion-quiz",
      title: "Doubt and emotion quiz",
      passThreshold: 0.8,
      questions: [
        conj("creer", SUBJ, "el"),
        conj("dudar", SUBJ, "yo"),
        pick("How do you say 'I do not think he is coming'?", "No creo que venga", [
          "No creo que viene",
          "Creo que no viene",
          "No creo viene",
        ]),
        pick("How do you say 'I hope she comes'?", "Espero que venga", [
          "Espero que viene",
          "Espero la que venga",
          "Espero que válga",
        ]),
        pick("How do you say 'I am afraid he comes'?", "Tengo miedo de que venga", [
          "Tengo miedo que viene",
          "Tengo miedo de que viene",
          "Tengo el miedo que venga",
        ]),
        fill("Dudo ___ sea verdad.", "que"),
        fill("Me alegro ___ vengas.", "de que"),
      ],
    },
  },
  {
    id: "ch8-que",
    order: 3,
    title: "Que: causa, propósito, concesión",
    subtitle: "One word, three jobs",
    sections: [
      {
        type: "text",
        title: "The same word doing three things",
        body:
          "que introduces a clause. What that clause does depends entirely on the word in front of it, and this is where Spanish feels hardest to an English ear because English has three separate words.\n\nAs cause: No(work)é porque llovía. I did not work because it was raining.\n\nAs purpose: Salgo para que puedas descansar. I am going out so that you can rest.\n\nAs concession: Aunque no mattered, lo hice. Although it did not matter, I did it.\n\nThat is three jobs for one word, and the verb mood partly disambiguates. Purpose and concession lean on the subjunctive; plain cause stays indicative.\n\nSalgo para que puedas descansar. Subjunctive, because the rest is not yet a fact.\n\nSalgo porque llueve. Indicative, because the rain is.\n\nThough you can have porque + subjunctive too, and then you are reporting somebody's explanation rather than asserting your own: Dice que no viene porque está cansado. He says he is not coming because he is tired. Here the porque clause carries his reason, so it takes the subjunctive for the same reason esperar que does.\n\nThis lesson has no verb table, and that is the point. The grammar you need here is not conjugation but word choice, and the fastest way to learn it is to read the four words around the que and ask what they mean.",
      },
      {
        type: "comparison",
        title: "Three jobs, three different signals",
        leftLabel: "the connector",
        rightLabel: "its job",
        labelsLang: "en",
        groups: [
          {
            title: "Because, your own reason",
            left: "No fui porque llovía.",
            leftTranslation: "I did not go because it was raining.",
            right: "indicative",
            note: "Stating a cause you know. The clause is a fact.",
          },
          {
            title: "Because, somebody else's reason",
            left: "Dice que no vino porque estaba cansado.",
            right: "subjunctive",
            note: "Reporting a reason, so the whole clause shifts. Same word, different mood.",
          },
          {
            title: "So that",
            left: "Lo hago para que veas.",
            right: "subjunctive",
            note: "para que is always subjunctive. The purpose is by definition not yet real.",
          },
          {
            title: "In order to",
            left: "Lo hago para verlo.",
            right: "no clause",
            note: "para + infinitive is purpose without a subject. Use this when you do it yourself.",
          },
        ],
      },
    ],
    quiz: {
      id: "ch8-que-quiz",
      title: "Que quiz",
      passThreshold: 0.75,
      questions: [
        pick("How do you say 'I am going out so that you can rest'?", "Salgo para que puedas descansar", [
          "Salgo para puedes descansar",
          "Salgo porque puedes descansar",
          "Salgo que puedes descansar",
        ]),
        pick("How do you say 'I did not go because it was raining'?", "No fui porque llovía", [
          "No fui porque llueve",
          "No fui para que llovía",
          "No fui aunque llovía",
        ]),
        pick("How do you say 'so that he sees it'?", "Para que lo vea", [
          "Para lo vea",
          "Para que lo ve",
          "Por que lo vea",
        ]),
        fill("Lo hago ___ verlo. (in order to see it)", "para"),
        fill("Lo hago ___ que lo veas. (so that you see it)", "para que"),
      ],
    },
  },
  {
    id: "ch8-causa",
    order: 4,
    title: "Los conectores de causa",
    subtitle: "porque, ya que, puesto que, dado que",
    sections: [
      {
        type: "words",
        title: "Four words, one job",
        wordIds: [word("porque"), word("ya-que"), word("puesto-que"), word("dado-que")],
      },
      {
        type: "comparison",
        title: "Four ways to give a reason, by how formal they are",
        leftLabel: "connector",
        rightLabel: "how formal",
        labelsLang: "en",
        groups: [
          {
            title: "Spoken",
            left: "porque",
            right: "everyday",
            note: "The default. Works in any register, and the only one of the four that works inside a question.",
          },
          {
            title: "Neutral",
            left: "ya que",
            right: "everyday to neutral",
            note: "Slightly more formal. Common in speech, and it can start a sentence.",
          },
          {
            title: "Formal",
            left: "puesto que",
            right: "formal",
            note: "Written and business. Also the only one that works as a concession too.",
          },
          {
            title: "Formal, and causal",
            left: "dado que",
            right: "formal and strictly causal",
            note: "Given that. Emphasises that the cause is already established, so nobody argues with it.",
          },
          {
            title: "Not a cause",
            left: "por qué",
            right: "the question",
            note: "por qué carries the accent and asks a question. porque never does.",
          },
        ],
      },
      {
        type: "text",
        title: "Puesto que does two jobs",
        body:
          "The four cause connectors are interchangeable in meaning, and they differ in register and in one genuine ambiguity.\n\nporque — neutral, the one you will use most. Works at the start of a sentence, in the middle, and in a question.\n\nya que — a shade more formal. Especially natural at the start: Ya que estamos aquí, podemos hablar.\n\npuesto que — formal, common in writing and in business. And this is the interesting one: puesto que can also mean since/taking into account, so it concedes as well as causes. Puesto que no hay nadie, vámonos — since there is nobody, let us go. That reading takes the indicative, because it is stating a fact rather than reporting a belief.\n\ndado que — formal and strictly causal. It presents the cause as settled, which is why it suits written argument.\n\nTwo things people get wrong.\n\nThe accent. por qué with an accent is a question. porque without one is a conjunction. There is no correct form of porque with an accent.\n\nAnd the position. Only porque is fully free. The other three tend to go at the front of a sentence, where a comma is optional: Puesto que es tarde, nos vamos.\n\nA practical note on register. Learners who write only porque are never wrong. Learners who use puesto que in conversation sound like a contract.",
      },
    ],
    quiz: {
      id: "ch8-causa-quiz",
      title: "Cause connectors quiz",
      passThreshold: 0.75,
      questions: [
        pick("How do you ask 'why'?", "¿Por qué?", ["¿Porque?", "¿Porqué?", "¿Por que?"]),
        pick("Which is the neutral, always-safe connector?", "porque", [
          "dado que",
          "puesto que",
          "puesto cuál",
        ]),
        fill("___ estamos aquí, podemos hablar.", "Ya que"),
        fill("___ no hay nadie, vámonos. (since there is nobody)", "Puesto que"),
        fill("___ que es tarde, nos vamos. (given that it is late)", "Dado"),
      ],
    },
  },
  {
    id: "ch8-aunque",
    order: 5,
    title: "Aunque",
    subtitle: "Concession, and the subjunctive that comes with it",
    sections: [
      {
        type: "words",
        title: "Concession",
        wordIds: [word("aunque"), word("a-pesar-de-que"), word("si-bien"), word("sin-embargo"), word("no-obstante"), word("por-otra-parte")],
      },
      {
        type: "comparison",
        title: "One meaning, five shapes",
        leftLabel: "shape",
        rightLabel: "register",
        labelsLang: "en",
        groups: [
          {
            title: "Conjunction",
            left: "Aunque no me gusta, voy.",
            leftTranslation: "Although I do not like it, I am going.",
            right: "everyday",
            note: "The default. Takes the indicative for a fact, and the subjunctive for a supposition.",
          },
          {
            title: "With a noun",
            left: "A pesar de la lluvia, salí.",
            right: "neutral",
            note: "a pesar de + noun, no clause. The noun keeps its article.",
          },
          {
            title: "With a clause",
            left: "A pesar de que llovía, salí.",
            right: "neutral",
            note: "a pesar de que + clause. The verb is in the indicative when the cause is a fact you assert.",
          },
          {
            title: "Literary",
            left: "Si bien es cierto, no lo es del todo.",
            right: "formal",
            note: "si bien, and it usually sits at the start of a sentence.",
          },
          {
            title: "However",
            left: "Sin embargo, no fui.",
            right: "everyday and written",
            note: "Not a conjunction: it cannot join two clauses, it stands alone. Chapter 4's reading uses it.",
          },
        ],
      },
      {
        type: "text",
        title: "The mood does the work",
        body:
          "The single most useful thing about Spanish aunque is that the mood tells you how real the thing being conceded is.\n\nAlthough it is raining — I know it is raining. Hecho, so indicative.\n\nAunque llueva, saldré — even if it rains, I will go out. The rain is hypothetical, so subjunctive.\n\nAlthough I may be wrong — nobody is claiming to be wrong; it is being entertained. Subjunctive.\n\nThat last pair is the whole lesson. Two sentences that look identical in English differ by one letter, and the difference is whether you are asserting or supposing.\n\nEnglish handles this with a modal hedge — \"although it may be\" — where Spanish just changes the verb.\n\nA second trap. Sin embargo and no obstante are not connectors. They cannot join two clauses: *Aunque no me gusta sin embargo voy is not a sentence. They need their own clause and a full stop or a comma.\n\nAnd a third. a pesar de takes a noun, a pesar de que takes a clause, and the difference is exactly the que:\n\nA pesar de la lluvia — in spite of the rain.\n\nA pesar de que llovía — although it was raining.\n\nLeave the que out and you have a different sentence, or no sentence.",
      },
    ],
    quiz: {
      id: "ch8-aunque-quiz",
      title: "Concession quiz",
      passThreshold: 0.8,
      questions: [
        pick("How do you say 'although I do not like it, I am going'?", "Aunque no me gusta, voy", [
          "A pesar no me gusta, voy",
          "Aunque no me gusta voy",
          "A pesar de no me gusta, voy",
        ]),
        pick("Which sentence means 'even if it rains, I will go out'?", "Aunque llueva, saldré", [
          "Aunque llueve, saldré",
          "A pesar de llueve, saldré",
          "Aunque lloverá, saldré",
        ]),
        pick("How do you say 'in spite of the rain'?", "A pesar de la lluvia", [
          "A pesar de que la lluvia",
          "A pesar la lluvia",
          "A pesar de la que lluvia",
        ]),
        fill("___ embargo, no fui.", "Sin"),
        fill("A pesar ___ que llovía, salí.", "de que"),
      ],
    },
  },
  {
    id: "ch8-consecuencia",
    order: 6,
    title: "La consecuencia",
    subtitle: "por eso, así que, y lo que follows",
    sections: [
      {
        type: "words",
        title: "Consequence",
        wordIds: [word("por-eso"), word("asi-que"), word("por-lo-tanto"), word("en-consecuencia"), word("ademas")],
      },
      {
        type: "comparison",
        title: "Two of these need a conjunction and two do not",
        leftLabel: "phrase",
        rightLabel: "joins clauses?",
        labelsLang: "en",
        groups: [
          {
            title: "So that",
            left: "Así que no fui.",
            leftTranslation: "So I did not go.",
            right: "no",
            note: "así que and por eso both work alone. You cannot join two clauses with them.",
          },
          {
            title: "Therefore",
            left: "Por lo tanto, no fui.",
            right: "no",
            note: "Por lo tanto and en consecuencia are the formal pair, and also stand alone.",
          },
          {
            title: "And so",
            left: "Estaba lloviendo y así que no fui.",
            right: "no",
            note: "Watch the y: así que arrives after the conjunction, never fused to it.",
          },
          {
            title: "The exception",
            left: "Por lo que no fui.",
            right: "yes",
            note: "por lo que is different: it joins two clauses, and it means the reason, not the consequence.",
          },
        ],
      },
      {
        type: "text",
        title: "Consequence, cause, and the pair that catches people",
        body:
          "Four phrases mean so, and they are interchangeable in meaning. What differs is register and whether they can join two clauses.\n\nasí que — spoken and written. The most common of the four.\n\npor eso — spoken and written, and more emphatic than así que. Por eso no fui: I did not go *for that reason*, which implies the reason matters.\n\npor lo tanto and en consecuencia — formal. Same thing, both stand alone.\n\nNone of them joins two clauses. If you want the two clauses in one sentence, you need y: Entonces no fui. Así que no fui. Y así que no fui.\n\nThe pair that catches everyone is por eso and por lo que.\n\npor eso — consequence. No fui, por eso. I did not go, and that is the consequence.\n\npor lo que — cause, and it DOES join clauses. No fui por lo que llovía. I did not go because it was raining.\n\nSame preposition, same words, opposite meaning, and one of them takes a clause while the other takes a comma. When you see por lo, check for the que.\n\nTwo connectors that are not so at all, which is the useful thing to remember about them:\n\nademás — besides that, and it adds rather than concludes.\n\npor otra parte — on the other hand, and it introduces the opposing side of an argument. Together they are how you build both sides of a point, which is exactly what chapter 9's reading does.",
      },
    ],
    quiz: {
      id: "ch8-consecuencia-quiz",
      title: "Consequence quiz",
      passThreshold: 0.75,
      questions: [
        pick("How do you say 'so I did not go'?", "Así que no fui", [
          "Por lo que no fui",
          "Así no que fui",
          "Por eso no fui que",
        ]),
        pick("Which means 'because it was raining'?", "No fui por lo que llovía", [
          "No fui por eso llovía",
          "No fui por eso que llovía",
          "No fui por lo que no llovía",
        ]),
        pick("How do you say 'on the other hand'?", "Por otra parte", [
          "Por lo tanto",
          "Por lo que",
          "Por eso",
        ]),
        fill("___ quiero decir otra cosa. (on the other hand)", "Por otra parte"),
        fill("No fui, ___ eso.", "por"),
      ],
    },
  },
  {
    id: "ch8-pasiva",
    order: 7,
    title: "La pasiva y la voz reflexiva",
    subtitle: "fue construido, se construyó",
    sections: [
      {
        type: "words",
        title: "Participles",
        note: "The passive is ser plus a participle, so these are the forms you need.",
        wordIds: [
          word("part-construido"),
          word("part-dicho"),
          word("part-hecho"),
          word("part-puesto"),
          word("part-visto"),
          word("part-escrito"),
          word("part-abierto"),
          word("part-perdido"),
          word("part-resuelto"),
        ],
      },
      {
        type: "comparison",
        title: "Three ways to say the same passive",
        leftLabel: "form",
        rightLabel: "example",
        labelsLang: "en",
        groups: [
          {
            title: "With ser",
            left: "ser + participio",
            right: "El puente fue construido en 1985.",
            note: "The formal and literary one. News, history, obituaries.",
          },
          {
            title: "With se",
            left: "se + participio",
            right: "El puente se construyó en 1985.",
            note: "The everyday one. Same meaning, and it is what you will actually hear.",
          },
          {
            title: "With tener",
            left: "tener + participio",
            right: "Tengo el informe hecho.",
            note: "Result rather than process. The report is finished, as a state.",
          },
        ],
      },
      {
        type: "text",
        title: "The participle, and the one form that changes",
        body:
          "A participle is a third kind of word form, after the infinitive and the two moods you know. Spanish has two of them, chosen by the infinitive's ending: -ado for -ar, -ido for -er and -ir. Construido, not construído, even though the infinitive is construir.\n\nMost participles are regular. Enough that you can guess one you have not seen.\n\nThe irregular ones are worth learning as words, which is why they are in the lesson above: dicho, hecho, puesto, visto, escrito, abierto, perdido, resuelto.\n\nThree passives, and the choice is register rather than meaning.\n\nser + participle is formal. News and history: El puente fue construido en 1985.\n\nse + participle is ordinary and far more common in speech. El puente se construyó en 1985. Same sentence, same meaning.\n\ntener + participio is a state rather than an event. Tengo el informe hecho means the report is done, not that somebody did it.\n\nThe trap with se + participle: the verb agrees with the subject, not with a passive. Los puentes se construyen. Puente is singular in the sentence and construyen is plural, because the subject is plural. This is the exact opposite of ser, where El puente fue construido keeps the participle agreeing with the subject too — so both agree, but for different reasons.\n\nAnd do not confuse se + participle with the impersonal se from chapter 7. Se habla inglés has no participle and no object. Se construyen los puentes has both, and the verb agrees with the subject. Chapter 7's four uses of se become five.",
      },
    ],
    quiz: {
      id: "ch8-pasiva-quiz",
      title: "Passive quiz",
      passThreshold: 0.75,
      questions: [
        pick("How do you say 'the bridge was built in 1985'?", "El puente fue construido en 1985", [
          "El puente fue construidos en 1985",
          "El puente construidos fue en 1985",
          "El puente es construido en 1985",
        ]),
        pick("Which is correct?", "Los puentes se construyen aquí", [
          "Los puentes se construye aquí",
          "Los puentes construyen se aquí",
          "Los puentes son construidos aquí",
        ]),
        pick("Which participle goes with escribir?", "escrito", [
          "escribido",
          "escribada",
          "escrita",
        ]),
        pick("How do you say 'I have the report done'?", "Tengo el informe hecho", [
          "Soy el informe hecho",
          "Tengo el informe hacer",
          "Tengo el informe hecho hoy",
        ]),
        fill("El participio de poner es ___", "puesto"),
        fill("El participio de ver es ___", "visto"),
      ],
    },
  },
  {
    id: "ch8-posicion",
    order: 8,
    title: "La posición de lo destacado",
    subtitle: "lo, la, le — putting the emphasis first",
    sections: [
      {
        type: "comparison",
        title: "Moving the pronoun to the front",
        leftLabel: "normal",
        rightLabel: "emphasised",
        labelsLang: "en",
        groups: [
          {
            title: "Direct object",
            left: "Compro el libro.",
            leftTranslation: "I buy the book.",
            right: "El libro lo compro yo.",
            note: "A direct object pronoun moved to the front for emphasis. It stays a pronoun: lo, not el libro lo.",
          },
          {
            title: "Indirect object",
            left: "Le doy el libro.",
            right: "El libro se lo doy.",
            note: "With a fronted dative you usually need the se, and the direct object moves with it.",
          },
          {
            title: "Reflexive",
            left: "Me ducho.",
            right: "Me ducho por la mañana.",
            note: "Reflexives rarely move. The emphasis goes on an added phrase instead.",
          },
          {
            title: "The pronoun never becomes a noun",
            left: null,
            right: "Lo compro hoy.",
            note: "You cannot put the noun back after fronting: *El libro lo compro el libro is not a sentence.",
          },
        ],
      },
      {
        type: "text",
        title: "What is actually going on",
        body:
          "Spanish can move a pronoun to the front of the sentence when the thing it refers to is the new information.\n\nCompro el libro. — I buy the book.\n\nEl libro lo compro. — It is the book I buy, not something else.\n\nEnglish does this with a cleft sentence or with intonation. Spanish does it by word order, and the moved pronoun stays a pronoun: lo, never el libro.\n\nWhich pronoun moves. Direct objects (lo, la, los, las) move freely. Indirect objects (chapter 7's le, les) also move, but a reflexive clitic usually cannot — Me ducho por la mañana, not *Por la mañana me ducho, which sounds wrong to a Spanish ear. Emphasise a reflexive with an added phrase instead.\n\nThe awkward case is a moved dative alongside a moved direct object, and Spanish solves it with se: El libro se lo doy. That se is not reflexive and not impersonal; it is a placeholder so the two pronouns do not collide. You will meet it again in chapter 9.\n\nOne thing this is not. It is not word order generally. Spanish is not a topic-prominent language the way Japanese is, and moving a pronoun to the front does not grant you freedom over the rest of the sentence. Compre el libro lo compro yo is not a sentence. Move the pronoun, and leave the rest where it was.",
      },
    ],
    quiz: {
      id: "ch8-posicion-quiz",
      title: "Fronting quiz",
      passThreshold: 0.75,
      questions: [
        pick("How do you say 'it is the book I buy'?", "El libro lo compro", [
          "El libro compro lo",
          "Compro el libro lo",
          "El libro lo compre",
        ]),
        pick("How do you say 'it is the book I give him'?", "El libro se lo doy", [
          "El libro le lo doy",
          "El libro lo le doy",
          "El libro doy lo le",
        ]),
        pick("Which is correct?", "Me ducho por la mañana", [
          "Por la mañana me ducho",
          "Me lavo por la mañana",
          "Por la mañana lavo me",
        ]),
        pick("Why not 'El libro lo compre el libro'?", "The pronoun cannot become a noun again", [
          "The verb is wrong",
          "The article is wrong",
          "The order is wrong",
        ]),
      ],
    },
  },
  {
    id: "ch8-lectura",
    order: 9,
    title: "Lectura: dos puntos de vista",
    subtitle: "An argument, from both sides",
    sections: [
      {
        type: "story",
        title: "Dos puntos de vista",
        note: "Every connector chapter 8 teaches appears here, and the mood shifts with the speaker's certainty.",
        storyId: story("st-dos-puntos").id,
      },
    ],
    quiz: {
      id: "ch8-lectura-quiz",
      title: "Reading comprehension",
      passThreshold: 0.75,
      questions: story("st-dos-puntos").questions,
    },
  },
  {
    id: "ch8-repaso",
    order: 10,
    title: "Repaso",
    subtitle: "Chapter 8 mixed drill",
    sections: [
      {
        type: "text",
        title: "What you now know",
        body:
          "The subjunctive has one job: the clause reports somebody's view rather than stating a fact. Creo que viene versus no creo que venga is the whole idea in two words.\n\nThe -er and -ir endings are identical, so one set of six covers most verbs. -ar is the odd one out.\n\nConnectors differ by register, not by meaning — porque, ya que, puesto que, dado que are the same job — except puesto que, which can also concede.\n\naunque changes mood to tell you whether the thing conceded is real or hypothetical, which English does with a modal hedge instead.\n\nSin embargo and por eso cannot join clauses; por lo que can, and means the opposite of por eso.\n\nAnd the passive is ser or se plus a participle, with se being the everyday one and both agreeing with the subject.",
      },
    ],
    quiz: {
      id: "ch8-repaso-quiz",
      title: "Chapter 8 review",
      passThreshold: 0.8,
      questions: [
        conj("hablar", SUBJ, "yo"),
        conj("tener", SUBJ, "nosotros"),
        conj("poder", SUBJ, "ellos"),
        conj("creer", SUBJ, "el"),
        conj("pensar", SUBJ, "tu"),
        conj("pensar", SUBJ, "nosotros"),
        pick("How do you say 'I hope it does not rain'?", "Ojalá no llueva", [
          "Ojalá no llueve",
          "Ojalá no lloverá",
          "Ojalá nunca llueva",
        ]),
        pick("How do you say 'I doubt it is true'?", "Dudo que sea verdad", [
          "Dudo que es verdad",
          "Dudo que sea la verdad",
          "Dudo de que sea verdad",
        ]),
        pick("Which means 'even if it rains'?", "Aunque llueva, saldré", [
          "Aunque llueve, saldré",
          "A pesar de llueve, saldré",
          "Si bien llueve, saldré",
        ]),
        pick("Which is the formal consequence phrase?", "Por lo tanto", [
          "Por eso",
          "Por lo que",
          "Por otra parte",
        ]),
        fill("Espero ___ vengas.", "que"),
        fill("Sin embargo, no ___ fui.", "sí"),
      ],
    },
  },
];

for (const lesson of lessons as Array<{ id: string; quiz?: { id: string } }>) {
  if (lesson.quiz) lesson.quiz.id = `${lesson.id}-quiz`;
}

chapter.lessons = lessons as never;
chapter.status = "published";
chapter.lessons.forEach((l: { order: number }, i: number) => {
  l.order = i + 1;
});
delete chapter.outline;

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`chapter-8: ${chapter.lessons.length} lessons, status ${chapter.status}`);
