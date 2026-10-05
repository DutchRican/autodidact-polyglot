/**
 * One-off content edit: the Chapter 7 reading.
 *
 * Written in the preterite with a preterite/perfect contrast, using only
 * vocabulary chapter 7 teaches: empresa, el jefe, el trabajo, cliente.
 *
 * Run with: bun scripts/add-ch7-stories.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

if (pack.stories.some((s: { id: string }) => s.id === "st-primer-dia")) {
  console.log("already present");
  process.exit(0);
}

const glossary = ["empresa", "el-jefe", "cliente", "el-trabajo"];
for (const id of glossary) {
  if (!pack.words.some((w: { id: string }) => w.id === id)) {
    throw new Error(`unknown glossary word "${id}"`);
  }
}

const story = {
  id: "st-primer-dia",
  title: "El primer día",
  titleTranslations: { en: "The first day" },
  glossary,
  text: [
    "El lunes pasado empecé en un trabajo nuevo. La empresa está en un edificio",
    "pequeño, cerca de la estación. Mi jefe se llama Ricardo y lleva diez años",
    "en la empresa.",
    "",
    "Llegué a las ocho y media. Una chica me trajo un café y me explicó dónde",
    "estaba la sala. Al principio no conocía a nadie, pero al mediodía ya había",
    "hablado con cuatro personas.",
    "",
    "El trabajo es bastante sencillo. Atiendo a los clientes, contesto el",
    "teléfono y escribo los correos. No es el trabajo que había imaginado, pero",
    "paga bien y el equipo es simpático.",
    "",
    "A las seis terminé y me fui a casa. En el tren pensé que esto puede",
    "funcionar.",
  ].join("\n"),
  questions: [
    {
      type: "choice",
      prompt: "¿Cuándo empezó el trabajo?",
      options: [
        { value: "El lunes pasado", correct: true },
        { value: "Hace diez años", correct: false },
        { value: "Ayer por la mañana", correct: false },
        { value: "El mes que viene", correct: false },
      ],
    },
    {
      type: "choice",
      prompt: "¿Qué hace en el trabajo?",
      options: [
        {
          value: "Atiende a los clientes y contesta el teléfono",
          correct: true,
        },
        { value: "Escribe los correos de la empresa", correct: false },
        { value: "Trabaja con el jefe", correct: false },
        { value: "Coge el tren a las ocho", correct: false },
      ],
    },
    {
      type: "choice",
      prompt: "¿Qué le gusta del trabajo?",
      options: [
        { value: "Porque paga bien y el equipo es simpático", correct: true },
        { value: "Porque es el trabajo que había imaginado", correct: false },
        { value: "Porque ya conoce a cuatro personas", correct: false },
        { value: "Porque termina a las ocho", correct: false },
      ],
    },
  ],
};

pack.stories.push(story);
await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`added ${story.id}`);
