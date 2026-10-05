/**
 * One-off content edit: Chapter 7's ten lessons (work and study).
 *
 * Follows the outline committed with the chapter, and uses only vocabulary and
 * verbs this chapter adds. Every conjugation section pins `tenses` explicitly, so
 * the subjunctive does not leak into a chapter that has not taught it yet -- the
 * same guard chapters 1 and 2 have.
 *
 * Run with: bun scripts/add-ch7-lessons.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const chapter = pack.chapters.find((c: { id: string }) => c.id === "chapter-7");
if (!chapter) throw new Error("chapter-7 missing");
if (chapter.lessons.length) throw new Error("chapter-7 already has lessons");

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
const PAST = ["preterite", "imperfect"];

const lessons: unknown[] = [
  {
    id: "ch7-oficios",
    order: 1,
    title: "Los oficios",
    subtitle: "Jobs, and the two prepositions they take",
    sections: [
      {
        type: "conjugation",
        title: "trabajar, empezar, buscar",
        note: "The three you need for a first week. empezar changes its stem; buscar only on yo.",
        verbIds: [verb("trabajar"), verb("empezar"), verb("buscar")],
        tenses: [PRES],
      },
      {
        type: "words",
        title: "Trabajos",
        note: "Every one of these is a -ado or -ista noun, so the article is easy to predict.",
        wordIds: [
          word("abogado"),
          word("ingeniero"),
          word("enfermera"),
          word("panadero"),
          word("vendedor"),
          word("cociner"),
          word("traductor"),
        ],
      },
      {
        type: "comparison",
        title: "Which preposition?",
        note: "Spanish splits what English does with one preposition across two, and the split is not where you would guess.",
        leftLabel: "English",
        rightLabel: "Spanish",
        labelsLang: "en",
        groups: [
          {
            title: "Working as",
            left: "I work as a nurse.",
            right: "Trabajo de enfermera.",
            rightTranslation: null,
            note: "trabajar DE, not de + article. Never *trabajo de la enfermera.",
          },
          {
            title: "Studying for",
            left: "I study translation.",
            right: "Estudio traducción.",
            rightTranslation: null,
            note: "estudiar PARA: studying for a career. Estudio para ser traductora.",
          },
          {
            title: "Studying something",
            left: "I study medicine.",
            right: "Estudio medicina.",
            rightTranslation: null,
            note: "estudiar a + article, or nothing at all: estudio medicina, estudio la medicina.",
          },
          {
            title: "Being from",
            left: "I am from Lima.",
            right: "Soy de Lima.",
            note: "ser DE for origin. Chapter 5's estar is for where you are now, not where you are from.",
          },
        ],
      },
      {
        type: "text",
        title: "Why the prepositions split",
        body:
          "English leans on one preposition for all of this: work AS a nurse, study FOR medicine, study medicine. Spanish uses three, and the split is not along the lines you would expect.\n\ntrabajar de + profession. Trabajo de panadero. No article, ever.\n\nestudiar para + a career. Estudio para ser abogado. This is the preposition for the goal, not the subject.\n\nestudiar a + subject. Estudio a derecho, or just estudio derecho. If you say what you study with no article, Spanish reads it as the bare thing itself.\n\nser de + place, for origin. Soy de Sevilla. Chapter 5 already warned about this: estar is where you are now.\n\nOne useful contrast while you are here. trabalhar en is where you work, and it takes no profession: trabajo en una panadería. So the same sentence can carry the two together: trabajo de panadero en una panadería.",
      },
    ],
    quiz: {
      id: "ch7-oficios-quiz",
      title: "Jobs quiz",
      passThreshold: 0.8,
      questions: [
        conj("trabajar", PRES, "yo"),
        conj("empezar", PRES, "yo"),
        conj("empezar", PRES, "nosotros"),
        conj("buscar", PRES, "yo"),
        pick("How do you say 'I work as a nurse'?", "Trabajo de enfermera", [
          "Trabajo de la enfermera",
          "Soy enfermera",
          "Trabajo para enfermera",
        ]),
        pick("How do you say 'I study law'?", "Estudio derecho", [
          "Estudio para derecho",
          "Estudio de derecho",
          "Para estudio derecho",
        ]),
        fill("Estudio ___ ser abogado. (studying to be a lawyer)", "para"),
        fill("Soy ___ Sevilla.", "de"),
      ],
    },
  },
  {
    id: "ch7-lugar-trabajo",
    order: 2,
    title: "El lugar de trabajo",
    subtitle: "The office, and who is in it",
    sections: [
      {
        type: "words",
        title: "El sitio",
        note: "Chapter 5 gave you estar for location. These are the nouns it gets applied to at work.",
        wordIds: [
          word("empresa"),
          word("la-oficina"),
          word("la-reunion"),
          word("el-jefe"),
          word("jefa"),
          word("companero"),
          word("cliente"),
          word("el-sueldo"),
          word("horario"),
        ],
      },
      {
        type: "comparison",
        title: "El and la, and where the extra syllable goes",
        leftLabel: "masculine",
        rightLabel: "feminine",
        labelsLang: "en",
        groups: [
          {
            title: "The office",
            left: null,
            right: "la oficina",
            note: "There is no masculine form to put here. The noun ends in -a, so the article is la whatever else is true.",
          },
          {
            title: "The boss",
            left: "el jefe",
            right: "la jefa",
            note: "-a nouns are usually masculine even when they name a woman: el cocinero, la cocinera. The ending predicts the article, not the person.",
          },
          {
            title: "The colleague",
            left: "el compañero",
            right: "la compañera",
            note: "Same word, gendered by the person. Spanish does this everywhere.",
          },
          {
            title: "The company",
            left: null,
            right: "la empresa",
            note: "-a, so feminine. Nothing about a company is male.",
          },
        ],
      },
      {
        type: "text",
        title: "The two questions of a first day",
        body:
          "Where is it, and what is it like.\n\nWhere is the office?\n\n— ¿Dónde está la oficina?\n— Está en la tercera planta. (It is on the third floor.)\n\nWhat time do you start?\n\n— ¿A qué hora empiezas?\n— Empiezo a las nueve.\n\nNote that planta is feminine here. That is an exception to the rule, and a common one: la primera planta is the ground floor in Spain, so the first floor is la segunda planta. English and Spanish count storeys differently and the two disagree exactly once, which is where people get confused.\n\nTwo phrases worth having whole:\n\nestar de alta — to be signed on, employed\n\nestar de baja — to be signed off, on sick leave\n\nBoth use de, and both are about status rather than place. Estoy de alta desde marzo.\n\nAnd the word for the floor, which is not in this chapter: el piso is used in Spain for both storey and flat, which trips up anyone reading a Spanish letting agency.",
      },
    ],
    quiz: {
      id: "ch7-lugar-trabajo-quiz",
      title: "Workplace quiz",
      passThreshold: 0.75,
      questions: [
        pick("How do you say 'the office'?", "la oficina", [
          "el oficina",
          "los oficina",
          "la oficina de",
        ]),
        pick("How do you ask where the office is?", "¿Dónde está la oficina?", [
          "¿Dónde es la oficina?",
          "¿Dónde la oficina está?",
          "¿Dónde está el oficina?",
        ]),
        fill("___ de alta desde marzo. (signed on since March)", "Estoy"),
        fill("La oficina ___ en la tercera planta.", "está"),
        pick("Which is correct?", "La empresa es grande", [
          "La empresa está grande",
          "El empresa es grande",
          "La empresa es la grande",
        ]),
        conj("empezar", PRES, "el"),
      ],
    },
  },
  {
    id: "ch7-dativo",
    order: 3,
    title: "Los pronombres de objeto indirecto",
    subtitle: "me, te, le, nos, os, les",
    sections: [
      {
        type: "words",
        title: "The words they replace",
        wordIds: [word("dativo-le"), word("regalo"), word("favor"), word("consejo"), word("ayuda")],
      },
      {
        type: "comparison",
        title: "Where the pronoun goes",
        note: "Both columns are correct. The choice is driven by what comes after the verb, not by taste.",
        leftLabel: "with a conjugated verb",
        rightLabel: "with an infinitive",
        labelsLang: "en",
        groups: [
          {
            title: "Giving something",
            left: "Le doy el libro.",
            leftTranslation: "I give him the book.",
            right: "Voy a darle el libro.",
            rightTranslation: "I am going to give him the book.",
            note: "Before the verb when the verb is conjugated; attached to it when an infinitive or a gerund follows.",
          },
          {
            title: "A pronoun plus another pronoun",
            left: "Le doy el libro a él.",
            right: "Dóselo a él.",
            note: "When you already have one indirect object, the pronoun goes in front and the rest follows. Attached, it goes at the end and needs an accent.",
          },
          {
            title: "Reflexive-looking",
            left: "Me trae un café.",
            leftTranslation: "She brings me a coffee.",
            right: null,
            note: "me here is a dative, not a reflexive. There is no 'she is bringing'. Compare explicitly: Me trae un café — she brings me one; Se trae un café — she brings herself one.",
          },
        ],
      },
      {
        type: "text",
        title: "The hardest little idea in the chapter",
        body:
          "Spanish has three sets of pronouns and this is the one nobody expects. It marks the indirect object: the person who receives something, or the subject of a verb like gustar.\n\nme, te, le, nos, os, les.\n\nNote that it is le, not lo. You already know lo, la, los, las for the direct object. The dative is a different set with different forms, and mixing them up is the single most common error at this stage.\n\nPlacement, in two rules.\n\nBefore the conjugated verb: Le doy el libro. Le doy a él el libro.\n\nAttached to the infinitive or the gerund, at the end: Voy a darle el libro. Estoy dándole el libro.\n\nOne accent to watch. When the pronoun is attached to an infinitive, the infinitive loses its accent: hablar becomes hablarle, not hablárle. The two together form one word, and Spanish marks the stress on the whole thing.\n\nThe other half of the idea, which chapter 6 already used without naming it: gustar works backwards. Me gusta el café. Literally, coffee is pleasing to me. So the person who feels something is the dative, not the subject: Me gusta, te gusta, le gusta, nos gusta, os gusta, les gusta.\n\nThat one shift explains a lot of chapter 5 as well. Me gusta la idea is not about gustar at all; it is estar with a dative in front.",
      },
    ],
    quiz: {
      id: "ch7-dativo-quiz",
      title: "Dative pronouns quiz",
      passThreshold: 0.8,
      questions: [
        pick("How do you say 'I give him the book'?", "Le doy el libro", [
          "Lo doy el libro",
          "Le doy el libro a él",
          "El doy el libro",
        ]),
        pick("How do you say 'I am going to give her the book'?", "Voy a darle el libro", [
          "Voy a le dar el libro",
          "Doy le el libro",
          "Voy a dar le el libro",
        ]),
        pick("How do you say 'she brings me a coffee'?", "Me trae un café", [
          "Se trae un café",
          "Le trae un café",
          "Me trae el café",
        ]),
        fill("___ gusta la idea. (the idea is pleasing to me)", "Me"),
        fill("___ gusta el café. (coffee is pleasing to us)", "Nos"),
        fill("A ___ doy el libro.", "le"),
        pick("Which pronoun is right?", "les", ["los", "leses", "le"]),
      ],
    },
  },
  {
    id: "ch7-dar-preguntar",
    order: 4,
    title: "Dar, preguntar, contar, explicar",
    subtitle: "The verbs that need an indirect object",
    sections: [
      {
        type: "conjugation",
        title: "preguntar, contar, explicar",
        note: "contar changes o to ue. The other two are regular.",
        verbIds: [verb("preguntar"), verb("contar"), verb("explicar")],
        tenses: [PRES],
      },
      {
        type: "words",
        title: "What gets asked and told",
        wordIds: [
          word("pregunta"),
          word("respuesta"),
          word("informacion"),
          word("explicacion"),
          word("noticia"),
          word("ayuda"),
        ],
      },
      {
        type: "comparison",
        title: "Which preposition takes the person",
        leftLabel: "the thing",
        rightLabel: "the person",
        labelsLang: "en",
        groups: [
          {
            title: "preguntar",
            left: "Pregunto por el puesto.",
            leftTranslation: "I am asking about the post.",
            right: "Pregunto a Marta.",
            note: "preguntar POR the thing, A the person. Both are normal and they are not interchangeable.",
          },
          {
            title: "ayudar",
            left: "Ayudo con las cajas.",
            leftTranslation: "I help with the boxes.",
            right: "Ayudo a Marta.",
            note: "The a is not optional when the person is the object. Never *ayudo Marta.",
          },
          {
            title: "explicar",
            left: null,
            right: "Explico el problema a Marta.",
            note: "English reverses this. Explico algo A alguien, in that order.",
          },
          {
            title: "contar",
            left: "Cuento la historia.",
            leftTranslation: "I tell the story.",
            right: "Le cuento la historia a Marta.",
            note: "contar ALGO a alguien. You can drop the a and use a pronoun: le cuento la historia.",
          },
        ],
      },
      {
        type: "text",
        title: "The order English gets wrong",
        body:
          "Four of these verbs want the thing first and the person second, and Spanish does not move them.\n\nExplico el problema a Marta. I explain the problem to Marta.\n\nIn English you can put the person first and it still reads fine. In Spanish the verb is followed by its direct object, and the indirect object comes after that. Putting the person in the middle is not a stylistic choice; it is a different sentence.\n\nThe exception is when the person is already a pronoun. Then you can go round the front.\n\nExplico el problema a Marta. Le explico el problema.\n\nAnd when you do that, the pronoun comes before the verb rather than attached to it, because there is no infinitive to attach to.\n\nTwo more worth knowing:\n\npreguntar por is asking about something in general. Pregunto por el salary.\n\npreguntar para is asking on someone's behalf. Pregunto para Marta.\n\nThat distinction has no English equivalent and it is the difference between asking about something and asking for someone.",
      },
    ],
    quiz: {
      id: "ch7-dar-preguntar-quiz",
      title: "Dative verbs quiz",
      passThreshold: 0.75,
      questions: [
        conj("contar", PRES, "yo"),
        conj("preguntar", PRES, "tu"),
        conj("explicar", PRES, "nosotros"),
        pick("How do you say 'I explain the problem to Marta'?", "Explico el problema a Marta", [
          "Explico a Marta el problema",
          "Explico el problema Marta",
          "Explico para Marta el problema",
        ]),
        pick("How do you say 'I help Marta'?", "Ayudo a Marta", [
          "Ayudo Marta",
          "Ayudo con Marta",
          "Ayudo para Marta",
        ]),
        pick("How do you say 'I am asking about the post'?", "Pregunto por el puesto", [
          "Pregunto el puesto",
          "Pregunto a el puesto",
          "Pregunto para el puesto",
        ]),
        fill("___ cuento la historia a Marta.", "Le"),
      ],
    },
  },
  {
    id: "ch7-transmitir",
    order: 5,
    title: "Dile que / pregúntale si",
    subtitle: "Passing a message on",
    sections: [
      {
        type: "conjugation",
        title: "decir, buscar, necesitar",
        note: "decir has an irregular yo: digo.",
        verbIds: [verb("decir"), verb("buscar"), verb("necesitar")],
        tenses: [PRES],
      },
      {
        type: "comparison",
        title: "Two ways to pass a message",
        leftLabel: "the long way",
        rightLabel: "the short way",
        labelsLang: "en",
        groups: [
          {
            title: "Telling someone",
            left: "Dile a Marta que viene.",
            leftTranslation: "Tell Marta she is coming.",
            right: "Dile que viene.",
            note: "The pronoun alone is enough. Dile A Marta works too and is more emphatic.",
          },
          {
            title: "With the verb itself",
            left: "Dile a Marta que viene.",
            right: "Dile que viene.",
            note: "que introduces a whole clause. With an infinitive you do not need que: Dile que venga, not *Dile a venir.",
          },
          {
            title: "Reporting a question",
            left: "Pregúntale a Marta si viene.",
            right: "Pregúntale si viene.",
            note: "Notice the accent: pregúntale is stressed on the second syllable once the pronoun is attached.",
          },
        ],
      },
      {
        type: "text",
        title: "The accent you only need for this",
        body:
          "Three verbs of asking and telling take a little enclitic that pulls the stress onto the second syllable.\n\npreguntar — pregúntale, pregúntame\n\ndecir — dile, dígame\n\nbuscar — búscame\n\nThe accent is not decoration. Preguntale would stress the last syllable and sound wrong. With one pronoun it is compulsory; with two it becomes optional, and you will see both.\n\nOne rule worth learning properly, because it explains the whole pattern: Spanish has a stress rule that almost always puts the stress on the last syllable that can take it. An infinitive ending in -ar counts as stressed already (hablar is HÁ-blar), so nothing else can take the stress. An infinitive ending in -er or -ir is weak, so a following word can pull it: hablar MÉ, escribir A-MI-manana, ver A-SÍ.\n\nSo the same thing happens everywhere. DÍ-le-melo. MÁ-nda-me-lo. Á-bre-me-la-luz.\n\nAnd that is why the plural stresses on the final syllable and needs no accent: díganme, pregúntenle, búsquenme. When the stress lands on the last syllable of a word ending in a vowel or n, no accent is written.",
      },
    ],
    quiz: {
      id: "ch7-transmitir-quiz",
      title: "Passing a message quiz",
      passThreshold: 0.75,
      questions: [
        conj("decir", PRES, "yo"),
        conj("buscar", PRES, "yo"),
        pick("How do you say 'tell Marta she is coming'?", "Dile que viene", [
          "Dile a Marta que viene",
          "Dile que a Marta viene",
          "Di le que viene",
        ]),
        pick("How do you say 'ask Marta if she is coming'?", "Pregúntale si viene", [
          "Preguntale si viene",
          "Pregúntale que viene",
          "Pregunta le si viene",
        ]),
        pick("How do you say 'look for me'?", "Búscame", [
          "Buscame",
          "Me busca",
          "Búscame a mí",
        ]),
        fill("___ le doy el libro.", "Mañana"),
      ],
    },
  },
  {
    id: "ch7-horario",
    order: 6,
    title: "El horario",
    subtitle: "Times, durations and how often",
    sections: [
      {
        type: "words",
        title: "Time words",
        wordIds: [
          word("desde"),
          word("hasta"),
          word("cada-dia"),
          word("todo-el-dia"),
          word("fin-de-semana"),
          word("la-reunion"),
        ],
      },
      {
        type: "comparison",
        title: "Time and duration take different prepositions",
        leftLabel: "a point in time",
        rightLabel: "a stretch of time",
        labelsLang: "en",
        groups: [
          {
            title: "One moment",
            left: "Empiezo a las nueve.",
            leftTranslation: "I start at nine.",
            right: null,
            note: "For a single time, a + la + plural. A las nueve, a las ocho y media.",
          },
          {
            title: "How long",
            left: null,
            right: "Trabajo de nueve a cinco.",
            note: "de ... a, both bare. Never *de las nueve a las cinco in this sense.",
          },
          {
            title: "From and until",
            left: "Desde las nueve trabajo.",
            right: "Hasta las cinco trabajo.",
            note: "desde = from, hasta = until. Both take a + la + plural, unlike de ... a.",
          },
          {
            title: "How often",
            left: "Trabajo todos los días.",
            leftTranslation: "I work every day.",
            right: "Trabajo todo el día.",
            note: "todos los días means every day; todo el día means all day. Same los, completely different meaning.",
          },
        ],
      },
      {
        type: "text",
        title: "Which a is which",
        body:
          "Spanish has three ways to attach a time to a clause, and picking the wrong one is common enough to be worth sorting out once.\n\nA + article, for a point. A las nueve. Llego a las nueve.\n\nDe ... a, for a span. Trabajo de nueve a cinco. Llego a las nueve y me voy a las cinco.\n\nDesde and hasta, for a start or an end on their own. Trabajo desde las nueve. Trabajo hasta las cinco. Desde 2019.\n\nThe article is the tell. If both ends have las, you are naming two moments. If neither does, you are describing a continuous stretch. Llego a las nueve y salgo a las cinco is two events. Trabajo de nueve a cinco is one long one.\n\nNow the trap, and it is a genuine one. Todo el día and todos los días look almost identical and mean opposite things.\n\nTrabajo todo el día — I work all day.\n\nTrabajo todos los días — I work every day.\n\nOne is duration, the other is frequency, and the only difference is whether the article is singular or plural. Chapter 6's shopping lesson already used this pair for the same reason.\n\nFrequency, while you are here, and all of it takes todos:\n\ntodos los días, todas las semanas, todos los meses, todos los años.\n\nAnd chapter 2's siempre, nunca and a menudo slot into the same slot.",
      },
    ],
    quiz: {
      id: "ch7-horario-quiz",
      title: "Schedules quiz",
      passThreshold: 0.8,
      questions: [
        pick("How do you say 'I work nine to five'?", "Trabajo de nueve a cinco", [
          "Trabajo desde las nueve a las cinco",
          "Trabajo a las nueve a las cinco",
          "Trabajo de las nueve hasta cinco",
        ]),
        pick("How do you say 'I work all day'?", "Trabajo todo el día", [
          "Trabajo todos los días",
          "Trabajo todo el días",
          "Trabajo todos el día",
        ]),
        pick("How do you say 'I work every day'?", "Trabajo todos los días", [
          "Trabajo todo el día",
          "Trabajo todos el día",
          "Trabajo todo días",
        ]),
        fill("Trabajo ___ las nueve. (since nine)", "desde"),
        fill("Trabajo ___ las cinco. (until five)", "hasta"),
        fill("___ mayo de 2019.", "Desde"),
        fill("Empiezo ___ las nueve.", "a"),
      ],
    },
  },
  {
    id: "ch7-escuela",
    order: 7,
    title: "En la escuela",
    subtitle: "Subjects, exams and marks",
    sections: [
      {
        type: "conjugation",
        title: "estudiar, aprender, escribir",
        note: "estudiar and aprender are how you learn, and they take different objects.",
        verbIds: [verb("estudiar"), verb("aprender"), verb("escribir")],
        tenses: [PRES],
      },
      {
        type: "words",
        title: "La escuela",
        wordIds: [
          word("asignatura"),
          word("examen"),
          word("nota"),
          word("aprobado"),
          word("suspendido"),
          word("aula"),
          word("biblioteca"),
          word("carrera"),
          word("beca"),
        ],
      },
      {
        type: "comparison",
        title: "Aprender and estudiar",
        leftLabel: "aprender",
        rightLabel: "estudiar",
        labelsLang: "en",
        groups: [
          {
            title: "The object",
            left: "Aprendo français.",
            leftTranslation: "I learn French.",
            right: "Estudio français.",
            note: "Same object. The difference is the other preposition: aprender PARA, estudiar A.",
          },
          {
            title: "A skill versus a subject",
            left: "Aprendo a tocar la guitarra.",
            right: "Estudio la guitarra.",
            note: "Aprender a + infinitive for a skill you practise. Estudiar the thing for a subject at a school.",
          },
          {
            title: "Contexto",
            left: null,
            right: "Estudio medicina en la universidad.",
            note: "estudiar carries the institutional sense. aprender is the bare act, with no school implied.",
          },
          {
            title: "With a person",
            left: "Aprendo de ella.",
            right: "Estudio con Marta.",
            note: "aprender DE someone. estudiar CON someone, which is more like studying together.",
          },
        ],
      },
      {
        type: "text",
        title: "Marks, and the word everybody gets wrong",
        body:
          "The vocabulary is easy; two words in it are not.\n\naprobado and suspendido are adjectives. You are aprobado, you are suspendido. But you are also given a nota, a mark, out of ten.\n\nHe aprobado la examen — wrong twice. La examen is wrong, and á is a masculine article.\n\nHe aprobado el examen — right.\n\nSuspenso takes ser, not estar, because it is not a passing state, it is a verdict. Es(aprobado/suspendido) — and note there is no article. You do not say *está aprobado.\n\nTwo more distinctions worth having.\n\naula is the classroom in secondary school and university. clase is the lesson, the group, or the classroom in primary school. Una clase de historia is a class of history. The two words overlap more in Spain than in Latin America.\n\nAnd el carné is the word for the card that proves something, not the card itself: el carné de conducir is a driving licence, el carné de estudiante is a student card. The word you want for an identity document is el documento de identidad, or simply el DNI, which everybody uses regardless of what the paper says.\n\nWhen it comes to marks, and this trips up English speakers constantly: a mark of six is not a failure in Spain. A dos is barely passing. A diez is perfect.",
      },
    ],
    quiz: {
      id: "ch7-escuela-quiz",
      title: "School quiz",
      passThreshold: 0.75,
      questions: [
        conj("estudiar", PRES, "yo"),
        conj("aprender", PRES, "el"),
        conj("escribir", PRES, "yo"),
        pick("How do you say 'I study medicine'?", "Estudio medicina", [
          "Aprendo medicina",
          "Estudio para medicina",
          "Estudio de medicina",
        ]),
        pick("How do you say 'I am learning to play the guitar'?", "Aprendo a tocar la guitarra", [
          "Estudio a tocar la guitarra",
          "Aprendo la guitarra",
          "Estudio para la guitarra",
        ]),
        pick("Which is correct?", "He aprobado el examen", [
          "Ha aprobado la examen",
          "Está aprobado el examen",
          "Ha aprobado el examen del",
        ]),
        fill("___ suspendí el examen.", "Suspendí"),
        fill("Una clase ___ historia.", "de"),
      ],
    },
  },
  {
    id: "ch7-se-impersonal",
    order: 8,
    title: "El se impersonal",
    subtitle: "Se habla inglés. Se vive bien.",
    sections: [
      {
        type: "text",
        title: "One word, four jobs",
        body:
          "Chapter 2 introduced the reflexive se. The impersonal is a different se, or rather the same letters doing something else, and it is how Spanish says things English needs a whole auxiliary for.\n\nThe idea: the subject is nobody in particular, or everybody, or the situation itself. Spanish does not invent a dummy subject, so it reaches for se.\n\nse habla, se vive, se habla inglés\n\nIt is spoken. It is lived. English is spoken.\n\nIn English these get do, people, or nothing at all. Spanish has one word for all of it, and the verb is third person singular whether you like it or not. Se habla, never *hablan.\n\nThe other three jobs, so you can tell them apart.\n\nPassive: se construyen los puentes. The bridges are built.\n\nReflexive, which chapter 2 covered: se lava todos los días. He washes every day.\n\nAccidental: se me cayó el libro. The book fell on me. This is the one English cannot do at all, and it is everywhere. Se me olvidó, se nos cayó, se te cayó el café.\n\nThe distinguishing test is what is missing from the sentence. If there is a real subject somewhere, it is passive. If there is no subject at all, it is impersonal. If there is a pronoun doing something to someone, it is accidental.\n\nThe pronoun that surfaces in the accidental is a dative, which is why chapter 7 needed the dative first. Se me cayó is literally it fell to me.",
      },
      {
        type: "comparison",
        title: "Four uses of se, told apart by what is missing",
        leftLabel: "what the sentence has",
        rightLabel: "which se",
        labelsLang: "en",
        groups: [
          {
            title: "No subject at all",
            left: "Se habla inglés.",
            right: "impersonal",
            note: "Nobody in particular speaks English. There is no subject in the sentence to find, and the verb is singular.",
          },
          {
            title: "A real subject, and something is done to it",
            left: "Los puentes se construyen aquí.",
            right: "passive",
            note: "The bridges are built here. The subject is present and it is doing nothing, so se stands in for a passive.",
          },
          {
            title: "An accusative pronoun",
            left: "Él se lava.",
            right: "reflexive",
            note: "He washes himself. The pronoun refers back to the subject, which is chapter 2's reflexive.",
          },
          {
            title: "A dative pronoun and no subject",
            left: "Se me cayó el libro.",
            right: "accidental",
            note: "The book fell on me. English has no construction for this at all, which is why it is worth learning early.",
          },
        ],
      },
    ],
    quiz: {
      id: "ch7-se-impersonal-quiz",
      title: "Impersonal se quiz",
      passThreshold: 0.75,
      questions: [
        pick("How do you say 'English is spoken here'?", "Se habla inglés aquí", [
          "Hablan inglés aquí",
          "Se hablan inglés aquí",
          "Habla inglés aquí",
        ]),
        pick("Which sentence is passive?", "Los puentes se construyen aquí", [
          "Los puentes se construyen aquí mismo",
          "Él se construye aquí",
          "Se me construyen los puentes",
        ]),
        pick("How do you say 'the book fell on me'?", "Se me cayó el libro", [
          "Me cayó el libro",
          "Se me cayó el libro a",
          "Cayó el libro me",
        ]),
        fill("___ vive bien en España.", "Se"),
        pick("How do you say 'they wash every day'?", "Se lavan todos los días", [
          "Se lava todos los días",
          "Se lavan todo los días",
          "Se lave todos los días",
        ]),
      ],
    },
  },
  {
    id: "ch7-lectura",
    order: 9,
    title: "Lectura: el primer día",
    subtitle: "A new job, told as a story",
    sections: [
      {
        type: "story",
        title: "El primer día",
        note: "Narrated in the preterite, with two imperfects holding the background.",
        storyId: story("st-primer-dia").id,
      },
    ],
    quiz: {
      id: "ch7-lectura-quiz",
      title: "Reading comprehension",
      passThreshold: 0.75,
      questions: story("st-primer-dia").questions,
    },
  },
  {
    id: "ch7-repaso",
    order: 10,
    title: "Repaso",
    subtitle: "Chapter 7 mixed drill",
    sections: [
      {
        type: "text",
        title: "What you now know",
        body:
          "Jobs split their prepositions: trabajar de, estudiar para a career, estudiar a subject, ser de for origin.\n\nThe dative is a third set of pronouns, and it is le and not lo. It goes before a conjugated verb and attaches to an infinitive.\n\nFour verbs want the thing before the person, and Spanish will not let you reverse them.\n\nTime takes a + article for a point, de ... a for a span, and desde/hasta for one end. Todo el día is duration, todos los días is frequency.\n\nImpersonal se has no subject, and it is always singular.\n\nAnd the accidentals — se me cayó, se nos olvidó — are the one construction here that English simply does not have.",
      },
    ],
    quiz: {
      id: "ch7-repaso-quiz",
      title: "Chapter 7 review",
      passThreshold: 0.8,
      questions: [
        conj("trabajar", PRES, "yo"),
        conj("empezar", PRES, "el"),
        conj("contar", PRES, "nosotros"),
        conj("decir", PRES, "yo"),
        conj("buscar", PRES, "yo"),
        pick("How do you say 'I work as a teacher'?", "Trabajo de profesor", [
          "Trabajo de el profesor",
          "Soy de profesor",
          "Trabajo para profesor",
        ]),
        pick("How do you say 'I give her the book'?", "Le doy el libro", [
          "Lo doy el libro",
          "La doy el libro",
          "Doy le el libro",
        ]),
        pick("How do you say 'I work from nine to five'?", "Trabajo de nueve a cinco", [
          "Trabajo desde las nueve hasta las cinco",
          "Trabajo a las nueve a las cinco",
          "Trabajo entre nueve y cinco",
        ]),
        pick("Which is the accidental?", "Se nos olvidó", [
          "Nos olvidó",
          "Se olvidó nos",
          "Olvidó se nos",
        ]),
        fill("Me ___ el café. (I spilled the coffee)", "cayó"),
        fill("Aprendo ___ tocar el piano.", "a"),
        fill("Estudio ___ ser abogado.", "para"),
      ],
    },
  },
];

for (const lesson of lessons as Array<{ id: string; title: string; subtitle?: string }>) {
  if (!lesson.title.trim()) throw new Error(`lesson ${lesson.id} has no title`);
}
for (const lesson of lessons as Array<{ id: string; quiz?: { id: string } }>) {
  if (lesson.quiz) lesson.quiz.id = `${lesson.id}-quiz`;
}

chapter.lessons = lessons as never;
chapter.status = "published";
chapter.lessons.forEach((l: { order: number }, i: number) => {
  l.order = i + 1;
});
// The outline has been written, so it must go: the validator rejects a chapter
// that has both, since they would disagree.
delete chapter.outline;

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`chapter-7: ${chapter.lessons.length} lessons, status ${chapter.status}`);
