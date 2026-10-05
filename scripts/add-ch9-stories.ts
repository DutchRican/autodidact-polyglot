/**
 * One-off content edit: Chapter 9's three long readings.
 *
 * Longer than anything earlier in the course and glossed far less, which is the
 * point of the chapter: the learner is meant to work meaning out of context
 * rather than out of a popup. Two of the three comprehension questions are in
 * English, because chapter 9's second lesson is about register and switching is
 * part of the practice.
 *
 * Run with: bun scripts/add-ch9-stories.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

if (pack.stories.some((s: { id: string }) => s.id === "st-el-ultimo-bus")) {
  console.log("already present");
  process.exit(0);
}

const stories = [
  {
    id: "st-el-ultimo-bus",
    title: "El último autobús",
    titleTranslations: { en: "The last bus" },
    glossary: ["de-repente", "mientras-tanto", "al-final", "sostener", "correr"],
    text: [
      "El último autobús de la noche sale a las once y media, y no espera a",
      "nadie. Marta lo sabe, y por eso baja a la parada un cuarto de hora antes",
      "de la hora que le conviene.",
      "",
      "Aquel día, sin embargo, se quedó hablando con un hombre mayor que",
      "esperaba el mismo autobús. Hablaron de sus nietos, del barrio, de lo",
      "caro que estaba todo. De pronto el hombre miró el reloj y se puso de pie.",
      "",
      "Nos vamos. El último pasa en tres minutos.",
      "",
      "Mientras tanto, Marta comprendió que había perdido el autobús. Salió",
      "corriendo y llegó cuando el coche ya estaba arrancando. El conductor la",
      "miró y no dijo nada. Tampoco dijo nada el hombre.",
      "",
      "Al final, Marta llegó a casa a las doce menos cuarto. Pensó que había",
      "tenido suerte, y luego pensó que no: para haberlo tenido, había tenido que",
      "perder el autobús primero.",
      "",
      "Nunca se lo contó a nadie. No porque le importara el hombre, sino porque",
      "no sabía explicar lo que había sentido al subir. No era alegría, y no era",
      "tristeza. Era otra cosa, y no tenía nombre.",
    ].join("\n"),
    questions: [
      {
        type: "choice",
        prompt: "¿Por qué baja Marta antes de tiempo?",
        options: [
          { value: "Porque el último autobús no espera a nadie", correct: true },
          { value: "Porque suele encontrar a alguien", correct: false },
          { value: "Porque llega demasiado temprano", correct: false },
          { value: "Porque no tiene reloj", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "¿Por qué se levanta el hombre de golpe?",
        options: [
          { value: "Porque el último autobús pasa en tres minutos", correct: true },
          { value: "Porque el coche ya había arrancado", correct: false },
          { value: "Porque Marta no había llegado", correct: false },
          { value: "Porque quiere terminar la conversación", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "How does Marta feel at the end of the story?",
        options: [
          { value: "She cannot name what she felt", correct: true },
          { value: "She is simply happy about the evening", correct: false },
          { value: "She is angry with the driver", correct: false },
          { value: "She never thinks about it again", correct: false },
        ],
      },
    ],
  },
  {
    id: "st-el-rio",
    title: "¿Abrir el río?",
    titleTranslations: { en: "Open the river?" },
    glossary: ["sostener", "matizar", "en-cambio", "rio", "compuerta"],
    text: [
      "Hay una compuerta sobre el río, y desde hace veinte años no se abre. En",
      "el pueblo hay dos opiniones, y las dos llevan razón en parte.",
      "",
      "Los que sostienen que hay que abrirla dicen que el agua está subiendo y",
      "que dentro de dos años el valle se inundará. Añaden que abrirla es barata",
      "y que nadie tendrá que pagar por ello.",
      "",
      "Los que se oponen dicen que la compuerta está vieja, que abrirla cuesta",
      "mucho y que, una vez abierta, no hay forma de cerrar el río otra vez. En",
      "cambio, proponen dejar que el río siga su curso en lugar de construir",
      "más.",
      "",
      "El asunto lleva veinte años sin resolverse. En cada reunión alguien",
      "afirma que la vez anterior se llegó a un acuerdo, y alguien recuerda que",
      "no. El acuerdo, si existió, no está escrito en ningún papel.",
      "",
      "Es posible que la mejor respuesta sea ninguna de las dos. Es posible",
      "también que sea la de los segundos, y que veinte años de reuniones hayan",
      "sido justo el tiempo necesario.",
    ].join("\n"),
    questions: [
      {
        type: "choice",
        prompt: "¿Qué quieren los del primer grupo?",
        options: [
          { value: "Abrir la compuerta para que no se inunde el valle", correct: true },
          { value: "Dejar que el río siga su curso", correct: false },
          { value: "Reconstruir la compuerta vieja", correct: false },
          { value: "Esperar otros veinte años", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "¿Cuál es el argumento del segundo grupo?",
        options: [
          { value: "Que abrirla es caro y no se puede volver a cerrar", correct: true },
          { value: "Que el agua está subiendo", correct: false },
          { value: "Que el acuerdo estaba escrito", correct: false },
          { value: "Que el valle se inundará en dos años", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "What does the text suggest about the disagreement?",
        options: [
          { value: "Both sides are partly right and neither has won", correct: true },
          { value: "The second group is clearly right", correct: false },
          { value: "The first group has more support", correct: false },
          { value: "The village has stopped caring", correct: false },
        ],
      },
    ],
  },
  {
    id: "st-como-hacer-sopa",
    title: "Cómo hacer sopa de verduras",
    titleTranslations: { en: "How to make vegetable soup" },
    glossary: ["permitir", "anadir", "fuego", "prisa"],
    text: [
      "Esta es una receta que funciona en cualquier cocina y no necesita",
      "ningún ingrediente raro.",
      "",
      "Primero, las verduras: un puerro, dos zanahorias, una cebolla y un poco de",
      "apio. Puedes añadir otra zanahoria si quieres que quede más dulce.",
      "",
      "Segundo, el caldo. Con un litro de agua basta. Si tienes un hueso con",
      "caldo, mejor; si no, con un dado.",
      "",
      "Ponlo todo en una olla grande. Añade sal, pero poca: siempre se puede",
      "añadir más después, y quitarla ya no es posible.",
      "",
      "Deja que hierva y luego baja el fuego. Cocina despacio una hora. Si",
      "tienes prisa, media hora, pero la sopa será peor. El fuego rápido no",
      "debe hervir: si hierve, la verdura se deshace.",
      "",
      "Cuando esté hecha puedes triturarla. No es obligatorio, y mucha gente",
      "prefiere los trozos.",
      "",
      "Este es el orden. Si lo inviertes, el resultado es una sopa clara, porque",
      "has cocido las verduras antes de que tengan sabor.",
      "",
      "Por último, la sal. Prueba siempre antes de servir.",
    ].join("\n"),
    questions: [
      {
        type: "choice",
        prompt: "¿Cuánto tiempo debe cocer a fuego lento?",
        options: [
          { value: "Una hora", correct: true },
          { value: "Diez minutos", correct: false },
          { value: "Medio día", correct: false },
          { value: "Hasta que hierva", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "¿Por qué no debe hervir fuerte?",
        options: [
          { value: "Porque la verdura se deshace", correct: true },
          { value: "Porque se pierde la sal", correct: false },
          { value: "Porque el caldo se quema", correct: false },
          { value: "Porque hay que triturar", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "¿Qué dice el texto sobre la sal?",
        options: [
          { value: "Que conviene poner poca al principio", correct: true },
          { value: "Que hay que añadirla al final", correct: false },
          { value: "Que no hace falta probarla", correct: false },
          { value: "Que se quita si sobra", correct: false },
        ],
      },
    ],
  },
];

for (const story of stories) {
  if (pack.stories.some((s: { id: string }) => s.id === story.id)) continue;
  for (const id of story.glossary) {
    if (!pack.words.some((w: { id: string }) => w.id === id)) {
      throw new Error(`unknown glossary word "${id}" in ${story.id}`);
    }
  }
  pack.stories.push(story);
}

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`stories now ${pack.stories.length}`);
