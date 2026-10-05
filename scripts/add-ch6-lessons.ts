/**
 * One-off content edit: Chapter 6's ten lessons on everyday life.
 *
 * Run with: bun scripts/add-ch6-lessons.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const chapter = f.chapters.find((c) => c.id === "chapter-6");
if (!chapter) throw new Error("chapter-6 missing");
if (chapter.lessons.length) throw new Error("chapter-6 already has lessons");

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
const PAST = ["preterite", "imperfect"];

const lessons: unknown[] = [
  {
    id: "ch6-comidas",
    order: 1,
    title: "Las comidas",
    subtitle: "The meals of the day, and when they happen",
    sections: [
      {
        type: "conjugation",
        title: "desayunar, almorzar, cenar",
        note: "One verb per meal. almorzar changes its stem; the other two are regular.",
        verbIds: ["desayunar", "almorzar"],
        tenses: [PRES],
      },
      {
        type: "words",
        title: "The four parts of the day",
        note: "Spanish names meals by the time of day rather than by a single word for breakfast, lunch, dinner, supper.",
        wordIds: [
          word("desayuno"),
          word("almuerzo"),
          word("cena"),
          word("merienda"),
          word("manana3"),
          word("tarde2"),
          word("noche2"),
        ],
      },
      {
        type: "comparison",
        title: "Meals and times",
        note: "Naming the meal says what it is. Naming it with the verb says what you do at that hour, and in Spanish you drop the article.",
        leftLabel: "as a noun",
        rightLabel: "as a verb",
        labelsLang: "en",
        groups: [
          {
            title: "Breakfast",
            left: "El desayuno es a las ocho.",
            leftTranslation: "Breakfast is at eight.",
            right: "Desayuno a las ocho.",
            rightTranslation: "I have breakfast at eight.",
            note: "With a time, drop the article and just use the verb.",
          },
          {
            title: "Lunch",
            left: "El almuerzo es a las dos.",
            leftTranslation: "Lunch is at two.",
            right: "Almuerzo a las dos.",
            rightTranslation: "I have lunch at two.",
          },
          {
            title: "The afternoon snack",
            left: "La merienda es a las cinco.",
            leftTranslation: "The snack is at five.",
            right: null,
            note: "Merienda is also a verb — meriendas — but in the singular it is nearly always the noun. It is the light meal between lunch and dinner, and few people outside Spain meet it.",
          },
          {
            title: "Dinner",
            left: "La cena es a las nueve.",
            leftTranslation: "Dinner is at nine.",
            right: "Ceno a las nueve.",
            rightTranslation: "I have dinner at nine.",
            note: "Cenar is a regular verb: ceno, cenas, cena, cenamos, cenáis, cenan.",
          },
        ],
      },
      {
        type: "text",
        title: "Why Spanish has four words for meals",
        body: "English collapses the day into three meals. Spanish names them by when they happen, and the names are useful because they tell you the hour.\n\nDesayuno. Breakfast, and by extension the morning. Also la mañana, which is the same part of the day.\n\nAlmuerzo. Lunch, and by extension the early afternoon.\n\nMerienda. The mid-afternoon snack. This is the one that catches people: merienda can be a coffee and a pastry, or it can be the meal you have instead of a formal dinner. It is not a formal word, and outside Spain and Latin America most learners never meet it.\n\nCena. Dinner, but note the trap. In Spain cena is at nine or ten in the evening. In Latin America la comida is the main evening meal, at eight or so, and cena is lighter. The words moved; the times stayed.\n\nTwo phrases worth knowing whole:\n\ntener hambre — to be hungry\n\ntener sueño — to be sleepy\n\nNeither takes an article, and neither uses estar. Desayuno porque tengo hambre. Ceno porque tengo sueño.",
      },
    ],
    quiz: {
      id: "ch6-comidas-quiz",
      title: "Meals quiz",
      passThreshold: 0.8,
      questions: [
        conj("desayunar", PRES, "yo"),
        conj("almorzar", PRES, "yo"),
        conj("almorzar", PRES, "tu"),
        conj("almorzar", PRES, "ellos"),
        pick("How do you say 'I have breakfast at eight'?", "Desayuno a las ocho", [
          "El desayuno es a las ocho",
          "Desayuno el ocho",
          "Estoy desayuno a ocho",
        ]),
        pick("What time is merienda?", "A las cinco, roughly", [
          "A las ocho de la mañana",
          "A las dos",
          "A las diez de la noche",
        ]),
        pick("Why is merienda unfamiliar to many learners?", "It is an informal word, used mostly in Spain and Latin America", [
          "It does not exist",
          "It is a written word only",
          "It is a children's word",
        ]),
        fill("Desayuno porque ___ (tener) hambre.", "tengo"),
        fill("Ceno porque ___ (tener) sueño.", "tengo"),
      ],
    },
  },
  {
    id: "ch6-comida-vocab",
    order: 2,
    title: "La comida",
    subtitle: "Food, drink, and what is on the table",
    sections: [
      {
        type: "words",
        title: "Lo básico",
        wordIds: [
          word("pan"),
          word("queso"),
          word("carne"),
          word("pollo"),
          word("arroz"),
          word("leche"),
          word("huevo"),
        ],
      },
      {
        type: "words",
        title: "Fruta y verdura",
        note: "Chapter 1 covered a few. These are the ones you will actually be asked for.",
        wordIds: [word("fruta"), word("verdura"), word("postre")],
      },
      {
        type: "text",
        title: "Two articles worth memorising",
        body: "You already know the pattern: nouns ending in -o are masculine, nouns ending in -a are feminine, and the article matches.\n\nel queso, la carne, el pollo, la verdura.\n\nTwo nouns break it, and both are worth learning now rather than meeting them in a shop.\n\nLa leche. Feminine, but the singular takes el because of the pronounced e at the end. El leche. Only in the plural does it become normal: las leches.\n\nEl agua. Feminine noun, masculine article, same reason. El agua. But because it is feminine it takes an adjective in the feminine: el agua fría, not *el agua frío. And if you add another noun it becomes las aguas, which then agrees: las aguas limpias.\n\nThe rule behind both: a singular noun ending in a pronounced -e takes el in the singular, whatever its gender. Plural la is unaffected.\n\nFor ordering food, you will not go far with grammar. You point, or you say lo mismo, y otra vez.",
      },
    ],
    quiz: {
      id: "ch6-comida-vocab-quiz",
      title: "Food vocabulary quiz",
      passThreshold: 0.75,
      questions: [
        fill("___ leche", "La"),
        fill("___ agua fría", "El"),
        fill("___ (leche, plural) las leches", "Las"),
        pick("Why does la leche take el in the singular?", "A singular noun ending in a pronounced e takes el", [
          "It is a masculine noun",
          "Milk is always masculine",
          "There is no rule",
        ]),
        pick("Why is it el agua fría and not *el agua frío?", "Agua is feminine, so the adjective is feminine", [
          "Adjectives are always feminine",
          "Fresco has no feminine form",
          "Agua is masculine",
        ]),
        pick("How do you say 'cheese'?", "el queso", ["la queso", "los queso", "el quesillo"]),
        pick("How do you say 'the meat'?", "la carne", ["el carne", "los carne", "la carnero"]),
      ],
    },
  },
  {
    id: "ch6-restaurante",
    order: 3,
    title: "En el restaurante",
    subtitle: "Ordering, and asking for what you want politely",
    sections: [
      {
        type: "words",
        title: "In the restaurant",
        wordIds: [
          word("camarero"),
          word("camarera"),
          word("cuenta"),
          word("menu"),
          word("propina"),
          word("bebida"),
          word("mesa"),
        ],
      },
      {
        type: "comparison",
        title: "How firm you sound",
        note: "All four order the same soup. Naming the dish alone is already polite; the verb is what adds force, and the conditional takes it back off. Chapter 4's conditional does the softening.",
        leftLabel: "just naming it",
        rightLabel: "with a verb",
        labelsLang: "en",
        groups: [
          {
            title: "Neutral",
            left: "La sopa, por favor.",
            leftTranslation: "The soup, please.",
            right: null,
            note: "No verb at all. This is the normal way to order in Spain and it does not sound blunt.",
          },
          {
            title: "With querer",
            left: null,
            right: "Quiero la sopa, por favor.",
            rightTranslation: "I want the soup, please.",
            note: "Correct and common. Slightly more assertive than naming the dish.",
          },
          {
            title: "With the conditional",
            left: null,
            right: "Me gustaría la sopa.",
            rightTranslation: "I would like the soup.",
            note: "The safest choice with someone you do not know.",
          },
          {
            title: "With poder, conditional too",
            left: null,
            right: "¿Podría traerme la sopa?",
            rightTranslation: "Could you bring me the soup?",
            note: "Note the pronoun after the verb: podría traerme, not *podría me traer.",
          },
        ],
      },
      {
        type: "text",
        title: "The whole conversation",
        body: "A full exchange, so you can see where each phrase sits.\n\n— Buenas noches. ¿Qué va a tomar? (Good evening. What are you having?)\n— Para mí, una sopa y el pescado. ¿Y usted?\n— El pollo con arroz, por favor. Y un agua.\n— Muy bien. Un momento.\n\nNote the first question. Qué va a tomar is not what are you drinking, it is what are you having, and it covers the whole meal. The verb is ir, in the third person, because Spanish makes no distinction between you and usted here. Compare usted va and tú vas.\n\nThen the bill. La cuenta, por favor. Not la factura, which is the invoice, and never el cuenta.\n\nAnd the tip. La propina is optional in Spain and expected in much of Latin America, usually around ten per cent. If you leave it, you say gracias por la propina, or simply gracias.\n\nOne phrase to recognise but not use yourself. Buen provecho is said to someone else about their meal. If someone says it to you, that means they think you are eating well.",
      },
    ],
    quiz: {
      id: "ch6-restaurante-quiz",
      title: "Restaurant quiz",
      passThreshold: 0.75,
      questions: [
        pick("How do you ask for the bill politely?", "La cuenta, por favor", [
          "La factura, por favor",
          "El cuenta, por favor",
          "Las cuentas, por favor",
        ]),
        pick("What does 'qué va a tomar' ask?", "What are you having", [
          "What is your name",
          "Where are you sitting",
          "What time is it",
        ]),
        pick("Which is the most polite way to order?", "Me gustaría la sopa", [
          "La sopa será",
          "Quiero la sopa ya",
          "Yo soup la sopa",
        ]),
        pick("Who says 'buen provecho'?", "The person who is not eating", [
          "The person eating",
          "The waiter, always",
          "Nobody says it",
        ]),
        fill("___ va a tomar?", "Qué"),
        fill("___ propina. (about ten per cent)", "diez"),
      ],
    },
  },
  {
    id: "ch6-tiendas",
    order: 4,
    title: "Las tiendas",
    subtitle: "Where things are sold, and what each shop is for",
    sections: [
      {
        type: "words",
        title: "Shops",
        note: "Every one of these is a place you will walk into, and each sells one family of things.",
        wordIds: [
          word("mercado"),
          word("supermercado"),
          word("panaderia"),
          word("fruteria"),
          word("carniceria"),
          word("tienda"),
          word("quiosco"),
        ],
      },
      {
        type: "comparison",
        title: "What each shop sells",
        leftLabel: "shop",
        rightLabel: "sells",
        labelsLang: "en",
        groups: [
          {
            title: "Bread",
            left: "la panadería",
            right: "pan, bollos, pasteles",
            note: "bollo is a sweet bun, not a bread roll. pan is bread.",
          },
          {
            title: "Fruit",
            left: "la frutería",
            right: "fruta y verdura",
          },
          {
            title: "Meat",
            left: "la carnicería",
            right: "carne y pollo",
          },
          {
            title: "Everything",
            left: "el supermercado",
            right: "todo",
            note: "Supermarket. The -o ending tells you it is masculine.",
          },
          {
            title: "Everything, informally",
            left: "el mercado",
            right: "todo, and food stalls",
            note: "Market. Also used for any kind of market, including a stock exchange.",
          },
        ],
      },
      {
        type: "text",
        title: "Saying where something is",
        body: "Chapter 5 gave you estar for location. Applying it to shops produces the two questions you actually need.\n\nWhere is the bakery?\n\n— ¿Dónde está la panadería?\n— Está en la esquina. (It is on the corner.)\n\nWhere do they sell bread?\n\n— ¿Dónde venden pan?\n— En la panadería.\n\nNote the difference. Dónde está takes a place and answers with a place. Dónde venden takes a thing and answers with a place. The verb changes because the subject does.\n\nFor inside a shop, two more prepositions worth knowing:\n\nEstá al lado de. It is next to.\n\nEstá enfrente de. It is opposite.\n\nAnd to say a shop sells something, Spanish prefers vender rather than tener. Venden pan, not tienen pan. Tener is for what you personally own.",
      },
    ],
    quiz: {
      id: "ch6-tiendas-quiz",
      title: "Shops quiz",
      passThreshold: 0.8,
      questions: [
        pick("How do you say 'the bakery'?", "la panadería", [
          "la panaderia",
          "el panadería",
          "las panadería",
        ]),
        pick("How do you ask 'where is the bakery'?", "¿Dónde está la panadería?", [
          "¿Dónde está el panadería?",
          "¿Dónde panadería?",
          "Dónde la panadería está?",
        ]),
        pick("How do you say 'they sell bread'?", "Venden pan", ["Tienen pan", "Son pan", "Están pan"]),
        pick("What does the quiosco sell?", "Small things: newspapers, snacks, cigarettes", [
          "Only meat",
          "Only bread",
          "Nothing, it is closed",
        ]),
        pick("Which is masculine?", "el supermercado", ["la supermercado", "los supermercado", "un supermercado"]),
        fill("La panadería ___ al lado de la escuela.", "está"),
        fill("En la frutería ___ fruta y verdura.", "venden"),
      ],
    },
  },
  {
    id: "ch6-comprar",
    order: 5,
    title: "Comprar y pagar",
    subtitle: "Prices, quantity, and how you hand over money",
    sections: [
      {
        type: "conjugation",
        title: "traer, pagar, encontrar, costar",
        note: "Three of these change their stem as well as their yo form. Both changes are shown.",
        verbIds: ["traer", "pagar", "encontrar", "costar"],
        tenses: [PRES],
      },
      {
        type: "words",
        title: "Money",
        wordIds: [
          word("precio"),
          word("euro"),
          word("dinero"),
          word("caro"),
          word("barato"),
          word("cambio"),
          word("efectivo"),
          word("tarjeta"),
          word("rebaja"),
        ],
      },
      {
        type: "comparison",
        title: "Expensive and cheap",
        leftLabel: "word",
        rightLabel: "sentence",
        labelsLang: "en",
        groups: [
          {
            title: "Expensive",
            left: "caro",
            leftTranslation: "expensive",
            right: "Es caro.",
            rightTranslation: "It is expensive.",
            note: "Caro changes with gender and number: cara, caros, caras.",
          },
          {
            title: "Cheap",
            left: "barato",
            leftTranslation: "cheap",
            right: "Es barato.",
            rightTranslation: "It is cheap.",
            note: "Barato changes the same way: barata, baratos, baratas.",
          },
          {
            title: "How much",
            left: "¿Cuánto cuesta?",
            right: "Cuesta cuatro euros.",
            rightTranslation: "It costs four euros.",
            note: "Cuesta is singular. Plural: ¿Cuánto cuestan? Cuestan cuatro euros.",
          },
          {
            title: "Price with a number",
            left: "¿Cuál es el precio?",
            right: "El precio es cuatro euros.",
            note: "Formal, and common on price tags.",
          },
        ],
      },
      {
        type: "text",
        title: "Asking and paying",
        body: "Two questions cover nearly every shop.\n\nHow much is it? ¿Cuánto cuesta? Note the singular cuesta for one thing. Plural cuestan.\n\nDo you have this? ¿Tiene esto? Note the usted form tiene, which is what you use with a shopkeeper.\n\nFor an exact amount, Spanish uses the same structure as everything else: verb, number, noun.\n\nDos kilos de naranjas. (Two kilos of oranges.)\n\nCuatro cajas de leche. (Four boxes of milk.)\n\nThe plural noun with a number stays singular. Un kilo de naranjas, not *un kilo de naranja.\n\nPaying. You say the amount you are handing over and ask for change:\n\n— Sesenta euros, por favor. ¿Tiene cambio?\n— Sí, aquí tiene.\n\nPaying by card: Pago con tarjeta. Paying in cash: Pago en efectivo.\n\nAnd a very common one you will hear: es un regalo. It is a gift. If someone says that as they hand you something, do not pay.",
      },
    ],
    quiz: {
      id: "ch6-comprar-quiz",
      title: "Shopping quiz",
      passThreshold: 0.75,
      questions: [
        conj("traer", PRES, "yo"),
        conj("pagar", PRES, "yo"),
        conj("encontrar", PRES, "tu"),
        conj("costar", PRES, "yo"),
        conj("costar", PRES, "el"),
        pick("How do you say 'how much is it'?", "¿Cuánto cuesta?", [
          "¿Cuánto cuestan?",
          "¿Cuánto es?",
          "¿Qué cuesta?",
        ]),
        pick("Which is correct?", "Dos kilos de naranjas", [
          "Dos kilos de naranja",
          "Dos kilos de naranajas",
          "Dos kilo de naranjas",
        ]),
        pick("How do you say 'I pay in cash'?", "Pago en efectivo", [
          "Pago en efectivo dinero",
          "Pago efectivo",
          "Pago con efectivo",
        ]),
        pick("What does 'es un regalo' tell you?", "Do not pay", [
          "Pay double",
          "Ask for a receipt",
          "It is on sale",
        ]),
        fill("Sesenta euros, por favor. ¿Tiene ___?", "cambio"),
      ],
    },
  },
  {
    id: "ch6-clima",
    order: 6,
    title: "El clima",
    subtitle: "The weather, in more detail",
    sections: [
      {
        type: "conjugation",
        title: "The weather verbs",
        note: "llover and nevar are third person only. hacer carries temperature.",
        verbIds: ["llover", "nevar", "hacer"],
        tenses: [PRES, "preterite", "imperfect"],
      },
      {
        type: "words",
        title: "Weather words",
        wordIds: [
          word("viento"),
          word("lluvia"),
          word("nieve"),
          word("nublado"),
          word("soleado"),
          word("helado"),
          word("calido"),
        ],
      },
      {
        type: "comparison",
        title: "Weather, and the two verbs behind it",
        leftLabel: "weather",
        rightLabel: "verb",
        labelsLang: "en",
        groups: [
          {
            title: "Temperature",
            left: "Hace calor. Hace frío.",
            leftTranslation: "It is hot. It is cold.",
            right: "hacer",
            note: "Never *está calor. The weather takes hacer.",
          },
          {
            title: "Rain",
            left: "Llueve.",
            right: "llover",
            note: "Third person only. You cannot say *lluevo outside the table.",
          },
          {
            title: "Snow",
            left: "Neva.",
            right: "nevar",
          },
          {
            title: "Wind",
            left: "Hace viento.",
            right: "hacer",
            note: "Not *está viento.",
          },
          {
            title: "Cloud",
            left: "Está nublado.",
            right: "estar",
            note: "A state, so estar. Compare con hace for temperature.",
          },
          {
            title: "Sun",
            left: "Hace sol.",
            right: "hacer",
            note: "Two words, not one. There is no single word for sunny that takes estar in the everyday sense.",
          },
        ],
      },
      {
        type: "text",
        title: "Talking about weather",
        body: "Asking is the same question from chapter 5, with the stress moved to the end.\n\n¿Qué tiempo hace? — What is the weather like?\n\nAnswering takes two halves, and they use different verbs.\n\nHace frío y está nublado. It is cold and cloudy.\n\nHace calor y hace sol. It is hot and sunny.\n\nLlueve, pero no hace frío. It is raining, but it is not cold.\n\nNote that weather is very often about you. Está bien para salir means it is fine for going out, which is a question about plans rather than meteorology.\n\nThe temperature pattern is worth knowing. Hace calor in the afternoon, hace frío por la noche. Inland Spain has exactly this shape: hot afternoons and cold nights. The coast is milder, and hace bueno means pleasant rather than merely good.\n\nTwo useful phrases for complaining and predicting:\n\nHace un frío horrible. It is horribly cold.\n\nVa a hacer frío. It is going to be cold. Va a plus an infinitive, from chapter 4.",
      },
    ],
    quiz: {
      id: "ch6-clima-quiz",
      title: "Weather quiz",
      passThreshold: 0.75,
      questions: [
        conj("llover", PRES, "el"),
        conj("nevar", PRES, "el"),
        conj("hacer", PRES, "el"),
        conj("hacer", "preterite", "el"),
        pick("Which is correct?", "Hace frío y está nublado", [
          "Está frío y hace nublado",
          "Hace frío y hace nublado",
          "Tiene frío y está nublado",
        ]),
        pick("How do you say 'it is going to be cold'?", "Va a hacer frío", [
          "Va a estar frío",
          "Hace frío va",
          "Va a tener frío",
        ]),
        pick("What does 'hace bueno' mean?", "It is pleasant", [
          "It is good",
          "It is expensive",
          "It must be done",
        ]),
        pick("Which verb does the weather never use for temperature?", "estar", ["hacer", "tener", "llevar"]),
        fill("Llueve, ___ no hace frío.", "pero"),
        fill("Está bien ___ (preposition) salir.", "para"),
      ],
    },
  },
  {
    id: "ch6-rutina",
    order: 7,
    title: "La rutina diaria",
    subtitle: "A whole day, in order",
    sections: [
      {
        type: "conjugation",
        title: "The verbs of a day",
        note: "Most are reflexive, which is why the pronoun matters more than the ending.",
        verbIds: ["despertarse", "ducharse", "acostarse", "quedarse"],
        tenses: [PRES],
      },
      {
        type: "words",
        title: "Time of day",
        wordIds: [
          word("manana3"),
          word("tarde2"),
          word("noche2"),
          word("pronto"),
          word("todavia2"),
          word("siempre2"),
        ],
      },
      {
        type: "text",
        title: "How to tell a story about your day",
        body: "You have all the pieces now. Here is the pattern, and it is the one you will use most often.\n\nMe despierto a las siete. (I get up at seven.)\n\nMe ducho enseguida. (I shower right away.)\n\nDesayuno café con leche. (I have coffee with milk for breakfast.)\n\nTrabajo hasta las seis. (I work until six.)\n\nVuelvo a casa. (I get home.)\n\nCeno y me acuesto a las once. (I have dinner and go to bed at eleven.)\n\nFour things make this sound Spanish rather than a word-for-word English translation.\n\nFirst, reflexivity. Me despierto, not *despierto. The pronoun is doing the work here, not the ending.\n\nSecond, omission. You can drop the pronoun when it is obvious. Trabajo hasta las seis needs no me, because the person is the subject.\n\nThird, time goes before the verb when the time is the new information. A las seis vuelvo. Vuelvo a las seis. Both work, but the second buries the time.\n\nFourth, contrast. Antes (+) did one thing, ahora (+) does another. Antes vivía en el campo; ahora vivo en la ciudad.\n\nAnd for anything you have not done yet, chapter 4's future. Mañana voy a trabajar.",
      },
    ],
    quiz: {
      id: "ch6-rutina-quiz",
      title: "Daily routine quiz",
      passThreshold: 0.8,
      questions: [
        conj("despertarse", PRES, "yo"),
        conj("ducharse", PRES, "tu"),
        conj("acostarse", PRES, "nosotros"),
        fill("___ despierto a las siete.", "Me"),
        fill("___ ducho enseguida.", "Me"),
        pick("Which sentence is correct?", "A las seis vuelvo a casa", [
          "Vuelvo a casa a las seis sólo",
          "Vuelvo casa a las seis",
          "A las seis vuelvo casa",
        ]),
        pick("How do you say 'I work until six'?", "Trabajo hasta las seis", [
          "Trabajo hasta la seis",
          "Hasta las seis trabajo la",
          "Trabajó hasta las seis",
        ]),
        pick("How do you say 'I used to live in the country'?", "Antes vivía en el campo", [
          "Antes viví en el campo",
          "Antes vivía en el campo sí",
          "Antes yo vivía el campo",
        ]),
      ],
    },
  },
  {
    id: "ch6-lectura-mercado",
    order: 8,
    title: "Lectura: el mercado del sábado",
    subtitle: "Shopping, quantities, and prices",
    sections: [
      {
        type: "story",
        title: "El mercado del sábado",
        note: "Note the plurals: Spanish keeps a noun singular after a number.",
        storyId: story("st-el-mercado").id,
      },
    ],
    quiz: {
      id: "ch6-lectura-mercado-quiz",
      title: "Reading comprehension",
      passThreshold: 0.75,
      questions: story("st-el-mercado").questions,
    },
  },
  {
    id: "ch6-lectura-restaurante",
    order: 9,
    title: "Lectura: en el restaurante",
    subtitle: "A full exchange, with conditional politeness",
    sections: [
      {
        type: "story",
        title: "En el restaurante",
        note: "Every line here is one you could use yourself, with the tense changed.",
        storyId: story("st-en-el-restaurante").id,
      },
    ],
    quiz: {
      id: "ch6-lectura-restaurante-quiz",
      title: "Reading comprehension",
      passThreshold: 0.75,
      questions: story("st-en-el-restaurante").questions,
    },
  },
  {
    id: "ch6-repaso",
    order: 10,
    title: "Repaso",
    subtitle: "Chapter 6 mixed drill",
    sections: [
      {
        type: "text",
        title: "What you now know",
        body: "Meals are named by time of day, not just by what they are, which tells you the hour without saying it.\n\nTwo nouns break the article rule: la leche and el agua, both because of a pronounced final e.\n\nOrdering runs from neutral to conditional, and the conditional is the safe choice with strangers.\n\nShops are gendered by their ending, and where they are is estar plus a preposition.\n\nPrices use the verb cuesta, and Spanish keeps the noun singular after a number.\n\nWeather splits between hacer for temperature and the weather verbs for rain and snow.\n\nA day is told with reflexives, time placed before the verb when it is the news, and antes against ahora for contrast.",
      },
    ],
    quiz: {
      id: "ch6-repaso-quiz",
      title: "Chapter 6 review",
      passThreshold: 0.8,
      questions: [
        conj("almorzar", PRES, "yo"),
        conj("encontrar", PRES, "tu"),
        conj("servir", PRES, "el"),
        conj("costar", PRES, "el"),
        conj("traer", PRES, "yo"),
        conj("despertarse", PRES, "yo"),
        pick("How do you say 'I have lunch at two'?", "Almuerzo a las dos", [
          "El almuerzo es a las dos",
          "Almuerzo el dos",
          "Estoy almuerzo a dos",
        ]),
        pick("Which is correct?", "La leche está fría", [
          "El leche está fría",
          "La leche está frío",
          "Los leche está fría",
        ]),
        pick("How do you say 'the bill, please'?", "La cuenta, por favor", [
          "La cuenta por favor sí",
          "El cuenta, por favor",
          "Las cuentas, por favor",
        ]),
        pick("How do you say 'three kilos of apples'?", "Tres kilos de manzanas", [
          "Tres kilos de manzana",
          "Tres kilo de manzanas",
          "Tres kilos las manzanas",
        ]),
        pick("How do you say 'it is windy'?", "Hace viento", ["Está viento", "Tiene viento", "Es viento"]),
        fill("Me ___ a las siete. (I get up)", "despierto"),
        fill("___ (querer) la sopa, por favor.", "Quiero"),
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
console.log(`chapter-6 lessons: ${chapter.lessons.length}, status: ${chapter.status}`);
