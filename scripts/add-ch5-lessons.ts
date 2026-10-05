/**
 * One-off content edit: Chapter 5's ten lessons on ser vs estar.
 *
 * The central contrast is rendered with the `comparison` section rather than
 * prose: a table lines the two verbs up side by side, which is the part a
 * learner actually reads and which paragraphs cannot do.
 *
 * Run with: bun scripts/add-ch5-lessons.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const chapter = f.chapters.find((c) => c.id === "chapter-5");
if (!chapter) throw new Error("chapter-5 missing");
if (chapter.lessons.length) throw new Error("chapter-5 already has lessons");

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

const PRES = "present";
const ALL_TENSES = [PRES, "preterite", "imperfect", "future", "conditional"];

const lessons: unknown[] = [
  {
    id: "ch5-ser",
    order: 1,
    title: "Ser, otra vez",
    subtitle: "The half of the pair you already know",
    sections: [
      {
        type: "conjugation",
        title: "ser",
        note: "Same irregular table as chapter 1, now across all five tenses.",
        verbIds: ["ser"],
        tenses: ALL_TENSES,
      },
      {
        type: "comparison",
        title: "ser or estar? The full picture",
        note:
          "One table, both verbs, every category. Read down the ser column first, then across each row.",
        leftLabel: "ser",
        rightLabel: "estar",
        groups: [
          {
            title: "Identity",
            left: "Soy Ana.",
            leftTranslation: "I am Ana.",
            right: null,
            note: "Who you are. estar cannot say this at all.",
          },
          {
            title: "Origin",
            left: "Es de Perú.",
            leftTranslation: "She is from Peru.",
            right: null,
            note: "Where you are from. Note estar is used for location, but not this.",
          },
          {
            title: "Profession",
            left: "Es profesora.",
            leftTranslation: "She is a teacher.",
            right: null,
          },
          {
            title: "Classification",
            left: "La mesa es de madera.",
            leftTranslation: "The table is wooden.",
            right: null,
            note: "What a thing is made of or classified as.",
          },
          {
            title: "Time",
            left: "Es martes. Son las cinco.",
            leftTranslation: "It is Tuesday. It is five o'clock.",
            right: null,
          },
          {
            title: "Exact location",
            left: null,
            right: "El libro está en la mesa.",
            rightTranslation: "The book is on the table.",
            note: "Where a movable thing is right now.",
          },
          {
            title: "Condition",
            left: null,
            right: "La puerta está rota.",
            rightTranslation: "The door is broken.",
            note: "The result of something that happened.",
          },
          {
            title: "Mood",
            left: null,
            right: "Estoy cansado.",
            rightTranslation: "I am tired.",
            note: "How you are doing, not who you are.",
          },
        ],
      },
      {
        type: "text",
        title: "Two rules that settle most sentences",
        body: "Rule one, identity. If the sentence could be answered with a name, a place, or a job, it wants ser. Soy Ana. Es de Lima. Es médico.\n\nRule two, time. If you could put today, right now, or at the moment in front of it, it wants estar. Estoy en casa. Estoy cansado. Está cerrado.\n\nNeither verb is the default. Spanish does not use estar because it is closer to English, and it does not use ser as a catch-all. Choosing between them is a judgement about what the sentence is claiming, which is why this is the chapter where people get stuck.",
      },
    ],
    quiz: {
      id: "ch5-ser-quiz",
      title: "Ser quiz",
      passThreshold: 0.8,
      questions: [
        conj("ser", PRES, "yo"),
        conj("ser", PRES, "el"),
        conj("ser", PRES, "ellos"),
        conj("ser", "preterite", "yo"),
        conj("ser", "imperfect", "yo"),
        conj("ser", "conditional", "yo"),
        pick("How do you say 'I am Ana'?", "Soy Ana", ["Estoy Ana", "Tengo Ana", "Voy Ana"]),
        pick("How do you say 'she is from Peru'?", "Es de Perú", [
          "Está de Perú",
          "Está en Perú",
          "Tiene de Perú",
        ]),
        pick("How do you say 'it is Tuesday'?", "Es martes", ["Está martes", "Va martes"]),
        pick(
          "How do you say 'the table is wooden'?",
          "La mesa es de madera",
          ["La mesa está de madera", "La mesa tiene de madera", "La mesa va de madera"],
        ),
      ],
    },
  },
  {
    id: "ch5-estar",
    order: 2,
    title: "Estar",
    subtitle: "Where things are and how they are going",
    sections: [
      {
        type: "conjugation",
        title: "estar",
        note: "Fully irregular, and shaped differently from ser in the past.",
        verbIds: ["estar"],
        tenses: ALL_TENSES,
      },
      {
        type: "words",
        title: "Adjectives for estar",
        note: "None of these describe what something is. All describe how it is going.",
        wordIds: [
          word("contento"),
          word("triste"),
          word("cansado"),
          word("preocupado"),
          word("enfadado"),
          word("enfermo"),
          word("nervioso"),
          word("tranquilo"),
        ],
      },
      {
        type: "text",
        title: "What estar adds",
        body: "estar covers four things, and none of them is identity.\n\nLocation. El libro está en la mesa. La librería está en la calle.\n\nCondition. La puerta está rota. El café está frío.\n\nMood. Estoy contento. Está triste.\n\nProgress. Estoy comiendo. Está trabajando.\n\nThat last one has no English equivalent. Spanish marks an action in progress with estar plus a gerund, where English needs an auxiliary: I am eating, you are working. The gerund is the -ando and -iendo forms, added straight onto the infinitive.\n\ncomer → comiendo, hablar → hablando, dormir → durmiendo, pedir → pidiendo\n\nNote the spelling rule for the -er and -ir gerunds. Drop the e or the final vowel of the infinitive, then add -iendo. That is why it is yendo and not *iendo, and why dormir gives durmiendo rather than *dormiendo.\n\nLocative estar also has an irregular form worth learning now, because it carries a preposition: está de vacaciones, está de viaje. The same está covers both being at a place and being on holiday.",
      },
    ],
    quiz: {
      id: "ch5-estar-quiz",
      title: "Estar quiz",
      passThreshold: 0.8,
      questions: [
        conj("estar", PRES, "yo"),
        conj("estar", PRES, "tu"),
        conj("estar", PRES, "el"),
        conj("estar", PRES, "ellos"),
        conj("estar", "preterite", "yo"),
        conj("estar", "imperfect", "yo"),
        pick("How do you say 'I am tired'?", "Estoy cansado", [
          "Soy cansado",
          "Tengo cansado",
          "Es cansado",
        ]),
        pick("How do you say 'the door is broken'?", "La puerta está rota", [
          "La puerta es rota",
          "La puerta está rota es",
          "La puerta es estar rota",
        ]),
        pick("How do you say 'I am eating'?", "Estoy comiendo", [
          "Estoy comer",
          "Soy comiendo",
          "Tengo comiendo",
        ]),
        pick("How do you say 'the book is on the table'?", "El libro está en la mesa", [
          "El libro es en la mesa",
          "El libro está la mesa",
          "El libro es la mesa",
        ]),
      ],
    },
  },
  {
    id: "ch5-ubicacion",
    order: 3,
    title: "La ubicación",
    subtitle: "Where things are, and the one rule that catches everyone",
    sections: [
      {
        type: "comparison",
        title: "Location: which verb",
        leftLabel: "ser",
        rightLabel: "estar",
        groups: [
          {
            title: "A country",
            left: "España está en Europa.",
            leftTranslation: "Spain is in Europe.",
            right: null,
            note: "Works with ser too: Europa está en España. Both are fine.",
          },
          {
            title: "A city",
            left: null,
            right: "Madrid está en el centro.",
            rightTranslation: "Madrid is in the centre.",
            note: "Also accepts ser: Madrid es en el centro.",
          },
          {
            title: "A building",
            left: null,
            right: "La fábrica está en el barrio nuevo.",
            rightTranslation: "The factory is in the new neighbourhood.",
            note: "Once you point inside a place, estar is the natural choice.",
          },
          {
            title: "A room",
            left: null,
            right: "Las llaves están encima.",
            rightTranslation: "The keys are on top.",
            note: "Movable things always take estar.",
          },
          {
            title: "Here and there",
            left: null,
            right: "Estamos aquí. Está allí.",
            rightTranslation: "We are here. It is there.",
            note: "Aquí and allí only ever take estar.",
          },
        ],
      },
      {
        type: "text",
        title: "The distinction, in one question",
        body: "Ask yourself whether the location is a permanent fact about a place, or a temporary position of a thing.\n\nPermanent fact about a place, so either works and estar is more common. España está en Europa.\n\nTemporary position of a thing, so estar is the only option. El libro está en la mesa.\n\nThe trap is that big places blur this. Madrid está en el centro sounds right, and so does Madrid es en el centro. Both are accepted. But Mi casa está en Madrid cannot become Mi casa es en Madrid, because a house is not a location, it is a thing sitting at one.\n\nWhen in doubt with a building or an object, use estar. It is never wrong for an exact position.",
      },
      {
        type: "words",
        title: "Places",
        wordIds: [
          word("la-ciudad"),
          word("el-pais"),
          word("la-caja"),
          word("la-puerta"),
          word("el-mapa"),
        ],
      },
    ],
    quiz: {
      id: "ch5-ubicacion-quiz",
      title: "Location quiz",
      passThreshold: 0.8,
      questions: [
        pick("Which is correct?", "Mi casa está en Madrid", [
          "Mi casa es en Madrid",
          "Mi casa está en el Madrid",
          "Mi casa es Madrid en",
        ]),
        pick("How do you say 'the keys are on top'?", "Las llaves están encima", [
          "Las llaves son encima",
          "Las llaves están el encima",
          "Las llaves son en encima",
        ]),
        pick("How do you say 'Spain is in Europe'?", "España está en Europa", [
          "España es en Europa",
          "España está Europa",
          "En Europa está España es",
        ]),
        pick("Which verb does aquí always take?", "estar", ["ser", "tener", "deber"]),
        fill("___ aquí. (We are here)", "Estamos"),
        fill("___ (estar) las llaves?", "Dónde están", ["dónde están", "donde estan"]),
      ],
    },
  },
  {
    id: "ch5-condicion",
    order: 4,
    title: "La condición",
    subtitle: "The same adjective, two meanings",
    sections: [
      {
        type: "comparison",
        title: "Adjectives that change meaning",
        note:
          "Swapping the verb swaps the meaning. Learn these as pairs, not as separate words.",
        leftLabel: "ser",
        rightLabel: "estar",
        groups: [
          {
            title: "aburrido",
            left: "Es aburrido.",
            leftTranslation: "He is boring.",
            right: "Está aburrido.",
            rightTranslation: "He is bored.",
            note: "The single most important pair in the language.",
          },
          {
            title: "listo",
            left: "Es listo.",
            leftTranslation: "He is clever. (Spain) He is ready. (Latin America)",
            right: "Está listo.",
            rightTranslation: "He is ready.",
            note: "Regional split: listo means clever in Spain and ready in Latin America.",
          },
          {
            title: "simpático",
            left: "Es simpático.",
            leftTranslation: "He is friendly.",
            right: "Está simpático.",
            rightTranslation: "He is being nice to you.",
            note: "Character against behaviour.",
          },
          {
            title: "interesante",
            left: "Es interesante.",
            leftTranslation: "It is interesting.",
            right: "Estás interesante.",
            rightTranslation: "You look interesting.",
            note: "What the thing has, against what you make of it.",
          },
          {
            title: "sabroso",
            left: "Es sabroso.",
            leftTranslation: "The food is good.",
            right: "Está sabroso.",
            rightTranslation: "It tastes good right now.",
          },
        ],
      },
      {
        type: "text",
        title: "What does not change",
        body: "Most adjectives mean the same with either verb, and Spanish does not care which you pick.\n\nEs simpático and está simpático. Both work. Es alto and está alto. Both fine.\n\nOnly a handful genuinely flip meaning, and the table above lists them. Learn those as pairs and stop worrying about the rest.\n\nThere is also a group where the adjective itself changes shape with estar, and this is a real trap:\n\nLa puerta está rota. → La puerta está rota. The adjective is the same.\n\nBut compare:\n\nEstá aburrido. He is bored now.\nSe aburre. He gets bored.\n\nEs aburrido. He is boring.\n\nThe first pair differs only by verb. The second differs by verb and by adjective form, and neither is interchangeable with the other.",
      },
    ],
    quiz: {
      id: "ch5-condicion-quiz",
      title: "Condition quiz",
      passThreshold: 0.75,
      questions: [
        pick("'He is bored' (right now) is which?", "Está aburrido", [
          "Es aburrido",
          "Tiene aburrido",
          "Es aburro",
        ]),
        pick("'He is boring' (in general) is which?", "Es aburrido", [
          "Está aburrido",
          "Tiene aburrido",
          "Está aburrir",
        ]),
        pick("'He is ready' is which?", "Está listo", ["Es listo", "Tiene listo", "Es estar listo"]),
        pick("Which means 'you look interesting'?", "Estás interesante", [
          "Eres interesante",
          "Tienes interesante",
          "Estás interesante es",
        ]),
        pick("'The food is good' — which works?", "Es sabroso", [
          "Están sabroso",
          "Es sabrosos",
          "Tener sabroso",
        ]),
        pick(
          "Which adjective does NOT change meaning between the two verbs?",
          "alto",
          ["aburrido", "listo", "interesante"],
        ),
      ],
    },
  },
  {
    id: "ch5-verbos-cambian",
    order: 5,
    title: "Verbos que cambian",
    subtitle: "When the meaning comes from the action, not the state",
    sections: [
      {
        type: "conjugation",
        title: "acordarse, olvidarse, aburrirse, despertarse",
        note: "Regular in the present, apart from acordarse and despertarse, which change their stem.",
        verbIds: ["acordarse", "olvidarse", "aburrirse", "despertarse"],
        tenses: [PRES],
      },
      {
        type: "comparison",
        title: "Quality against process",
        note: "An adjective tells you what something is like. A verb tells you what happens.",
        leftLabel: "adjective",
        rightLabel: "verb",
        groups: [
          {
            title: "Bored",
            left: "Es aburrido.",
            leftTranslation: "He is boring. (a property)",
            right: "Se aburre.",
            rightTranslation: "He gets bored. (something happens)",
          },
          {
            // Paired with "Bored" above: same verb divertirse either way, but
            // the adjective says the person is amusing and the reflexive says
            // he is having a good time. An unrelated verb here (se despierta)
            // would contrast nothing, because it names a different event.
            title: "Amusing",
            left: "Es divertido.",
            leftTranslation: "He is amusing. (a property)",
            right: "Se divierte.",
            rightTranslation: "He enjoys himself. (something happens)",
          },
          {
            title: "Remembering",
            left: null,
            right: "Me acuerdo de ella.",
            rightTranslation: "I remember her.",
            note: "acordarse always takes de. The de is not optional.",
          },
          {
            title: "Forgetting",
            left: null,
            right: "Me olvidé de la cita.",
            rightTranslation: "I forgot the appointment.",
            note: "olvidarse also takes de. Me acuerdo la cita is not a sentence.",
          },
        ],
      },
      {
        type: "text",
        title: "Why this distinction is useful",
        body: "The adjective describes a state. The verb describes an event.\n\nEs aburrido says people find him dull, full stop. No change, no story.\n\nSe aburre says something happened. He was fine, then he got bored. That is a narrative, and it is why chapter 3's two past tenses become natural here.\n\nEstaba aburrido toda la tarde. He was bored all afternoon. A state, all day.\n\nSe aburrió después de comer. He got bored after lunch. An event, one point in time.\n\nTwo verbs worth pairing deliberately:\n\nacordarse and olvidarse are opposites and both take de. Me acuerdo de la cita. Me olvidé de la cita.\n\naburrirse and despertarse are not opposites but pair naturally, because they describe a change of state in someone. One happens to you, the other brings you back.",
      },
    ],
    quiz: {
      id: "ch5-verbos-cambian-quiz",
      title: "Changing verbs quiz",
      passThreshold: 0.8,
      questions: [
        conj("acordarse", PRES, "yo"),
        conj("acordarse", PRES, "tu"),
        conj("olvidarse", PRES, "yo"),
        conj("aburrirse", PRES, "ellos"),
        conj("despertarse", PRES, "yo"),
        fill("Me ___ de ella. (I remember her)", "acuerdo"),
        fill("Me ___ de la cita. (I forgot)", "olvidé", ["olvidé", "olvide"]),
        pick("How do you say 'he gets bored'?", "Se aburre", [
          "Es aburrido",
          "Está aburrido",
          "Es aburre",
        ]),
        pick("Which sentence is correct?", "Me acuerdo de ella", [
          "Me acuerdo la ella",
          "Me acuerdo ella",
          "Acuerdo de la ella",
        ]),
        pick("'He was bored all afternoon' is which tense?", "Estaba aburrido", [
          "Se aburrió",
          "Estará aburrido",
          "Estuvo aburrido toda la tarde",
        ]),
      ],
    },
  },
  {
    id: "ch5-tener",
    order: 6,
    title: "Tener hambre, sueño, miedo",
    subtitle: "Not 'to be' at all",
    sections: [
      {
        type: "words",
        title: "What you have",
        note: "These never take ser or estar. They take tener.",
        wordIds: [
          word("hambre"),
          word("sueno"),
          word("sed"),
          word("miedo"),
          word("razon"),
          word("ganas"),
          word("fiebre"),
        ],
      },
      {
        type: "comparison",
        title: "Which verb for which state",
        leftLabel: "ser / estar",
        rightLabel: "tener",
        groups: [
          {
            title: "Hungry",
            left: null,
            right: "Tengo hambre.",
            rightTranslation: "I am hungry.",
            note: "Not *estoy hambre, and never soy hambre.",
          },
          {
            title: "Sleepy",
            left: null,
            right: "Tengo sueño.",
            rightTranslation: "I am sleepy.",
          },
          {
            // estar can say this one: está asustado is standard. Leaving it null
            // claimed Spanish has no estar form for fear, which is not true.
            title: "Afraid",
            left: "Está asustado.",
            leftTranslation: "He is frightened, right now.",
            right: "Tengo miedo.",
            rightTranslation: "I am afraid.",
            note: "Both are correct. tener miedo is the ordinary, neutral way to say you are afraid of something; estar asustado is more vivid and points at how someone looks or feels at this moment.",
          },
          {
            title: "Right",
            left: null,
            right: "Tienes razón.",
            rightTranslation: "You are right.",
          },
          {
            title: "In the mood",
            left: null,
            right: "Tengo ganas de comer.",
            rightTranslation: "I feel like eating.",
            note: "ganas always takes de before an infinitive.",
          },
          {
            title: "Hungry versus tired",
            left: "Estoy cansado.",
            leftTranslation: "I am tired.",
            right: "Tengo sueño.",
            rightTranslation: "I am sleepy.",
            note: "These are genuinely different. Cansado is a mood; sueño is a physical urge to sleep.",
          },
        ],
      },
      {
        type: "text",
        title: "Two families of state",
        body: "Spanish sorts physical and mental states across two verbs, and English collapses both into be.\n\nPhysical and involuntary, with tener. Tengo hambre. Tengo sed. Tengo sueño. Tengo miedo. Tengo fiebre.\n\nMood and condition, with estar. Estoy cansado. Estoy contento. Estoy enfermo.\n\nThe overlap is where mistakes happen, because several states could belong to either family. The differences are real but small:\n\ntengo hambre — I am hungry. A physical need.\n\nestoy hambriento — I am starving. A state of being, more dramatic.\n\ntengo sueño — I am sleepy. The urge.\n\nestoy cansado — I am tired. The condition after the fact.\n\nYou can be tired without being sleepy, and the two words say so. The same split runs through miedo and anxiety.\n\nThe other use of tener is with nouns in general, where English also uses have. Tengo un perro. Tengo veinte años. Tengo prisa. Tengo razón.",
      },
    ],
    quiz: {
      id: "ch5-tener-quiz",
      title: "Tener quiz",
      passThreshold: 0.75,
      questions: [
        fill("___ hambre. (I am hungry)", "Tengo"),
        fill("___ sueño. (I am sleepy)", "Tengo"),
        fill("___ (estar) cansado. (I am tired)", "Estoy"),
        pick("How do you say 'you are right'?", "Tienes razón", [
          "Estás razón",
          "Eres razón",
          "Tienes la razón está",
        ]),
        pick("How do you say 'I feel like eating'?", "Tengo ganas de comer", [
          "Tengo ganas comer",
          "Estoy ganas de comer",
          "Tengo ganas a comer",
        ]),
        pick(
          "'I'm hungry' vs 'I'm starving' — which pairs with estar?",
          "Estoy hambriento",
          ["Estoy hambre", "Tengo hambriento", "Soy hambriento"],
        ),
        pick("Which is a physical need rather than a mood?", "Tengo sueño", [
          "Estoy contento",
          "Estoy triste",
          "Estoy nervioso",
        ]),
      ],
    },
  },
  {
    id: "ch5-hacer-tiempo",
    order: 7,
    title: "El tiempo y el clima",
    subtitle: "Weather, which leans on hacer",
    sections: [
      {
        type: "conjugation",
        title: "llover and nevar",
        note: "Both are only used in the third person in practice: llueve, nieva.",
        verbIds: ["llover", "nevar", "hacer"],
        tenses: [PRES, "preterite", "imperfect"],
      },
      {
        type: "words",
        title: "Weather",
        wordIds: [
          word("la-nube"),
          word("la-tormenta"),
          word("calor"),
          word("frio"),
          word("hace-falta"),
        ],
      },
      {
        type: "comparison",
        title: "Which verb describes the weather",
        leftLabel: "hacer",
        rightLabel: "estar / llover",
        groups: [
          {
            title: "Hot or cold",
            left: "Hace calor.",
            leftTranslation: "It is hot.",
            right: null,
            note: "Never *está calor. The weather uses hacer.",
          },
          {
            title: "Cold",
            left: "Hace frío.",
            leftTranslation: "It is cold.",
            right: null,
          },
          {
            title: "Raining",
            left: null,
            right: "Llueve.",
            rightTranslation: "It is raining.",
            note: "llover and nevar are whole verbs, not hacer.",
          },
          {
            title: "Snowing",
            left: null,
            right: "Neva.",
            rightTranslation: "It is snowing.",
          },
          {
            // Cloudiness is a state, so it takes estar. It was filed under hacer
            // here, which put an estar construction in the wrong column and had
            // the note contradicting the row.
            title: "Cloudy",
            left: null,
            right: "Está nublado.",
            rightTranslation: "It is cloudy.",
            note: "A state, so estar. hacer has no form for it: not *hace nublado. Compare Está nublado with Hace frío, same day, same estar/hacer split.",
          },
          {
            // The reverse case: sun is not a state, so it goes with hacer.
            title: "Sunny",
            left: "Hace sol.",
            leftTranslation: "It is sunny.",
            right: null,
            note: "Two words, not an adjective. *Está soleado is not the everyday form.",
          },
        ],
      },
      {
        type: "text",
        title: "Weather, and how you ask",
        body: "Spanish divides weather between hacer for temperature and the weather verbs for precipitation.\n\nHace calor. Hace frío. Hace buen tiempo. Hace mal tiempo.\n\nLlueve. Nieva. Está nublado. Está soleado.\n\nThe verbs llueve and nieva look odd in the table because Spanish only uses the third person. You say llueve, never lluevo. This is the same in English when you say it rains, never it rains.\n\nTo ask the weather, take the third person singular and move the stress one syllable to the end:\n\nLlueve. → ¿Llueve? (five syllables to six, stress to the end)\n\nNeva. → ¿Neva?\n\nMaking it windy or sunny:\n\nHace viento. It is windy.\n\nHace sol. It is sunny. Note the two words, not one sunny. And note there is no accent on sol here, because sol alone means sun, the thing in the sky. When it is sunny you say hace sol.\n\nA typical answer to ¿Qué tiempo hace?:\n\n Hace frío y está nublado. (It is cold and cloudy.)",
      },
    ],
    quiz: {
      id: "ch5-tiempo-quiz",
      title: "Weather quiz",
      passThreshold: 0.75,
      questions: [
        fill("___ calor. (It is hot)", "Hace"),
        fill("___ frío. (It is cold)", "Hace"),
        pick("How do you say 'it is raining'?", "Llueve", ["Lluvo", "Está lloviendo", "Tiene lluvia"]),
        pick("How do you ask 'is it raining'?", "¿Llueve?", ["¿Lluvo?", "¿Está llueve?", "¿Tiene lluvia?"]),
        pick("How do you say 'it is windy'?", "Hace viento", [
          "Está viento",
          "Tiene viento",
          "Es viento",
        ]),
        pick("How do you say 'it is sunny'?", "Hace sol", ["Está sol", "Es sol", "Tiene sol"]),
        pick("'It is cloudy' takes which verb?", "estar", ["ser", "hacer", "tener"]),
        fill("¿Qué tiempo ___? (What is the weather like?)", "hace", ["hace"]),
      ],
    },
  },
  {
    id: "ch5-lectura-fabrica",
    order: 8,
    title: "Lectura: la fábrica",
    subtitle: "ser and estar in a real story",
    sections: [
      {
        type: "story",
        title: "La fábrica",
        note: "Watch which verb each sentence reaches for, and why.",
        storyId: story("st-la-fabrica").id,
      },
    ],
    quiz: {
      id: "ch5-lectura-fabrica-quiz",
      title: "Reading comprehension",
      passThreshold: 0.75,
      questions: story("st-la-fabrica").questions,
    },
  },
  {
    id: "ch5-lectura-mal-dia",
    order: 9,
    title: "Lectura: un mal día",
    subtitle: "A day told entirely with estar and tener",
    sections: [
      {
        type: "story",
        title: "Un mal día",
        note:
          "Almost every sentence here uses either estar or tener. That is the point: neither is decoration.",
        storyId: story("st-mal-dia").id,
      },
    ],
    quiz: {
      id: "ch5-lectura-mal-dia-quiz",
      title: "Reading comprehension",
      passThreshold: 0.75,
      questions: story("st-mal-dia").questions,
    },
  },
  {
    id: "ch5-repaso",
    order: 10,
    title: "Repaso",
    subtitle: "Chapter 5 mixed drill",
    sections: [
      {
        type: "text",
        title: "What you now know",
        body: "ser for identity, origin, profession, classification, and time.\n\nestar for exact location, condition, mood, and actions in progress.\n\nThe two split on one question: is this a fact about what the thing is, or a fact about its situation right now?\n\nA handful of adjectives flip meaning between the two, and the table in lesson 4 lists every one of them.\n\nA few verbs describe a change of state rather than a state, and two of them insist on de.\n\nPhysical needs and involuntary conditions take tener, and some of them overlap with estar in a way worth knowing.\n\nWeather splits between hacer for temperature and the weather verbs for rain and snow.",
      },
    ],
    quiz: {
      id: "ch5-repaso-quiz",
      title: "Chapter 5 review",
      passThreshold: 0.8,
      questions: [
        conj("ser", PRES, "yo"),
        conj("ser", PRES, "el"),
        conj("estar", PRES, "yo"),
        conj("estar", PRES, "ellos"),
        pick("How do you say 'she is from Lima'?", "Es de Lima", [
          "Está de Lima",
          "Está en Lima",
          "Tiene de Lima",
        ]),
        pick("How do you say 'the shop is closed'?", "La tienda está cerrada", [
          "La tienda es cerrada",
          "La tienda está cierre",
          "La tienda es cierre",
        ]),
        pick("'He is boring' is which?", "Es aburrido", ["Está aburrido", "Se aburre", "Tiene aburrido"]),
        pick("'He gets bored' is which?", "Se aburre", ["Es aburrido", "Está aburrido", "Es aburre"]),
        pick("How do you say 'I am hungry'?", "Tengo hambre", ["Estoy hambre", "Soy hambre", "Tengo el hambre"]),
        pick("How do you say 'it is cold'?", "Hace frío", ["Está frío", "Es frío", "Tiene frío"]),
        pick("How do you say 'the keys are here'?", "Las llaves están aquí", [
          "Las llaves son aquí",
          "Las llaves están el aquí",
          "Las llaves es aquí",
        ]),
        fill("Me ___ de la cita. (I forgot)", "olvidé", ["olvidé", "olvide"]),
        fill("___ (tener) sueño", "Tengo"),
      ],
    },
  },
];

for (const lesson of lessons as Array<{ id: string; title: string; subtitle?: string }>) {
  for (const field of [lesson.title, lesson.subtitle]) {
    if (field && /[_\u0000-\u001f]/.test(field)) {
      throw new Error(`lesson ${lesson.id} has a malformed heading`);
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
console.log(`chapter-5 lessons: ${chapter.lessons.length}, status: ${chapter.status}`);
