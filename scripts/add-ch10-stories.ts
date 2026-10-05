/**
 * One-off content edit: chapter 10's three timed readings.
 *
 * These are the only stories in the course with an empty glossary. Chapter 10's
 * lesson 8 sets the exercise: read at speed, with nothing to help, and see how
 * much is already there. Every other story has between 4 and 5 glosses.
 *
 * They are also deliberately different in kind, because that is the skill being
 * tested: a text that narrates, a text that explains a process, and a text that
 * argues. Chapter 9's three readings had the same spread, and the thing that
 * made them harder was the absence of the glosses.
 *
 * Run with: bun scripts/add-ch10-stories.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

if (pack.stories.some((s: { id: string }) => s.id === "st-la-turna-de-noche")) {
  console.log("already present");
  process.exit(0);
}

const stories = [
  {
    id: "st-la-turna-de-noche",
    title: "La turna de noche",
    titleTranslations: { en: "The night shift" },
    glossary: [],
    text: [
      "El obrero lleva doce años entrando a las diez de la noche y saliendo a",
      "las seis de la mañana, y ya no recuerda qué día es.",
      "",
      "Al principio lo contaba. Los lunes, la sirena del puerto le recordaba que",
      "era lunes, y eso bastaba. Después dejaron de bastarle.",
      "",
      "El primer mes contaba los coches que pasaban por la avenida. El segundo",
      "mes contaba las luces. Al final del tercero ya no contaba nada y miraba",
      "la pantalla del portátil sin verla, esperando las seis.",
      "",
      "Su mujer dice que habla poco. Él dice que no, que habla mucho, que en",
      "catorce años no ha tenido una conversación que no fuera sobre el",
      "dormitorio o la factura. Ella dice que eso no es hablar. Los dos tienen",
      "razón, que es una manera educada de decir que no.",
      "",
      "El jueves pasado, a las cuatro de la mañana, se quedó mirando la puerta",
      "cerrada de la sala de máquinas y pensó que hacía diez años que no",
      "miraba. Diez años sin mirar. Después soltó una risa corta, solo, y",
      "siguió trabajando.",
      "",
      "A las seis precise. Se lavó la cara, firmó, salió. El sol estaba",
      "apenas saliendo y los contenedores parecían nuevos. Caminó hasta la",
      "parada y, sin decidirlo, se paró a mirar el mar un minuto. Largo, para",
      "él.",
    ].join("\n"),
    questions: [
      {
        type: "choice",
        prompt: "¿Cómo cuenta el obrero el tiempo?",
        options: [
          { value: "Al principio contaba cosas, y al final ya no cuenta nada", correct: true },
          { value: "Siempre ha usado un reloj exacto", correct: false },
          { value: "Cuenta los días hasta su cumpleaños", correct: false },
          { value: "Nunca ha sabido qué día es", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "¿Qué quiere decir «eso bastaba»?",
        options: [
          { value: "Que la sirena le bastaba para saberlo", correct: true },
          { value: "Que la sirena era demasiado fuerte", correct: false },
          { value: "Que ya no llega a las diez", correct: false },
          { value: "Que las luces no le dejaban dormir", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "What does the writer mean by «los dos tienen razón, que es una manera educada de decir que no»?",
        options: [
          { value: "They agree about the facts but not about what counts as talking", correct: true },
          { value: "They are both being polite to the reader", correct: false },
          { value: "They are both wrong", correct: false },
          { value: "They argue about it constantly", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "¿Por qué se para a mirar el mar?",
        options: [
          { value: "Porque para él es mucho tiempo y no está acostumbrado", correct: true },
          { value: "Porque espera a alguien", correct: false },
          { value: "Porque ha terminado el turno antes de tiempo", correct: false },
          { value: "Porque no encuentra la parada", correct: false },
        ],
      },
    ],
  },
  {
    id: "st-por-que-la-cola",
    title: "Por qué hay cola en la panadería",
    titleTranslations: { en: "Why there is a queue at the bakery" },
    glossary: [],
    text: [
      "Hay una panadería en la esquina que tiene casi siempre cola, y hay otra",
      "a cuatro calles que no tiene nunca. La diferencia cuesta tres céntimos.",
      "",
      "La primera hace pan todos los días a las cuatro de la mañana. La segunda",
      "llama a un proveedor y lo recibe a las nueve, ya hecho, en LAritmo",
      "apropiado para un local que cierra a las dos.",
      "",
      "Esto parece un negocio peor, y lo es, durante las tres primeras horas",
      "del día. Después cambia. El que llega a las siete encuentra las barras",
      "que hizo un panadero, no una máquina. El que llega a las siete a la otra",
      "panadería encuentra el estante vacío y se va.",
      "",
      "El dueño de la primera ha calculado mal durante veinte años y bien",
      "durante los cinco últimos, y lo sabe. Dice que la gente no viene a",
      "comprar pan, viene a no tener que decidir.",
      "",
      "Su ayudante más joven le dijo una vez que eso no era una panadería, era",
      "una fábrica. El dueño dijo que sí, y que por eso funcionaba.",
      "",
      "Hay una cola los lunes que no existe los martes, y no tiene que ver con",
      "el pan. Los lunes el sitio de al lado cierra, y quien iba allí acaba",
      "aquí.",
    ].join("\n"),
    questions: [
      {
        type: "choice",
        prompt: "¿Por qué la segunda panadería está vacía por la mañana?",
        options: [
          { value: "Porque recibe el pan ya hecho y a las siete aún no ha llegado", correct: true },
          { value: "Porque es más cara", correct: false },
          { value: "Porque solo hace pan los lunes", correct: false },
          { value: "Porque cierra al mediodía", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "¿Qué quiere decir «la gente no viene a comprar pan, viene a no tener que decidir»?",
        options: [
          { value: "Que el valor está en que no haya que elegir", correct: true },
          { value: "Que la gente viene por el precio", correct: false },
          { value: "Que nadie sabe qué pan quiere", correct: false },
          { value: "Que el dueño decide por ellos", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "What does the last paragraph add to the explanation?",
        options: [
          { value: "Something else, not the bread, is what brings people in on Mondays", correct: true },
          { value: "The bakery is closed on Tuesdays", correct: false },
          { value: "The baker runs out of flour on Mondays", correct: false },
          { value: "The queue is caused by the weather", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "¿Qué admite el dueño?",
        options: [
          { value: "Que se ha equivocado durante mucho tiempo y ahora acierta", correct: true },
          { value: "Que nunca ha entendido su negocio", correct: false },
          { value: "Que la segunda panadería es mejor", correct: false },
          { value: "Que no le gusta el pan que hace", correct: false },
        ],
      },
    ],
  },
  {
    id: "st-lo-que-no-se-dijo",
    title: "Lo que no se dijo",
    titleTranslations: { en: "What was not said" },
    glossary: [],
    text: [
      "Mi abuelo hablaba poco y escribía menos, y cuando escribía",
      "eran cartas de cuatro líneas que no decían nada y costaban dos horas",
      "de pensar.",
      "",
      "Una vez le pregunté por qué no hablaba más. Me dijo que hablar mucho es",
      "fácil, y que hablar poco bien es un oficio. Le pedí un ejemplo. Se",
      "quedó mirando la mesa un rato largo y luego dijo: tú nunca has",
      "preguntado por qué quiero que vengas el domingo. Yo tampoco.",
      "",
      "No supe qué decir, y no dije nada, y a él le valió. Ahí está el oficio:",
      "el silencio no es la ausencia de la palabra, es el uso de la palabra",
      "justo cuando no hace falta.",
      "",
      "Murió en agosto. En su cajón había ocho cartas sin enviar, y mi madre no",
      "las quiso leer y yo no supe si leerlas. Siguen ahí.",
      "",
      "Ahora cuando hablo poco, alguien dice que estoy enfadado. No es eso.",
      "Es que estoy buscando la frase, y la frase no ha llegado, y no quiero",
      "decir la que ha llegado porque la que ha llegado no sirve.",
    ].join("\n"),
    questions: [
      {
        type: "choice",
        prompt: "¿Qué dice el abuelo que es un oficio?",
        options: [
          { value: "Hablar poco bien", correct: true },
          { value: "Escribir cartas largas", correct: false },
          { value: "Esperar en silencio", correct: false },
          { value: "Hacer preguntas", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "¿Qué le pregunta el nieto?",
        options: [
          { value: "Por qué no habla más", correct: true },
          { value: "Por qué escribe tan poco", correct: false },
          { value: "Qué quiere decir con «oficio»", correct: false },
          { value: "Por qué vive lejos", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "What do the eight unread letters show about the story?",
        options: [
          { value: "The silence he practised was also silence he could not break", correct: true },
          { value: "He was too lazy to finish them", correct: false },
          { value: "His family did not value them", correct: false },
          { value: "They were written by the narrator instead", correct: false },
        ],
      },
      {
        type: "choice",
        prompt: "¿Por qué la gente cree que el narrator está enfadado?",
        options: [
          { value: "Porque hablar poco parece enfadarse, y él no lo está", correct: true },
          { value: "Porque no contesta", correct: false },
          { value: "Porque está esperando una respuesta", correct: false },
          { value: "Porque habla del abuelo", correct: false },
        ],
      },
    ],
  },
];

for (const story of stories) {
  if (pack.stories.some((s: { id: string }) => s.id === story.id)) continue;
  pack.stories.push(story);
}

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`stories now ${pack.stories.length}`);
