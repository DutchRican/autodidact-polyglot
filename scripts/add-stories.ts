/**
 * One-off content edit: a short reading story for each Chapter 1 lesson, built
 * from that lesson's own vocabulary and verbs, plus the new dates lesson.
 *
 * Run with: bun scripts/add-stories.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const chapter = f.chapters[0];

const existingStories = new Set(f.stories.map((s) => s.id));
const haveWords = new Set(f.words.map((w) => w.id));

// Nouns the stories need, so their glossary popovers actually resolve.
const needed = [
  ["tienda", "la tienda", "the shop", "noun", "f"],
  ["euro", "el euro", "the euro", "noun", "m"],
  ["precio", "el precio", "the price", "noun", "m"],
  ["bicicleta", "la bicicleta", "the bicycle", "noun", "f"],
  ["fruta", "la fruta", "the fruit", "noun", "f"],
  ["verdura", "la verdura", "the vegetable", "noun", "f"],
  ["pescado", "el pescado", "the fish", "noun", "m"],
  ["comida", "la comida", "the meal / food", "noun", "f"],
  ["clase", "la clase", "the class", "noun", "f"],
  ["estudiar", "estudiar", "to study", "verb", undefined],
  ["profesor", "el profesor", "the teacher", "noun", "m"],
  ["medico", "el médico", "the doctor", "noun", "m"],
  ["asiento", "el asiento", "the seat", "noun", "m"],
] as const;

let added = 0;
for (const [id, value, en, pos, gender] of needed) {
  if (haveWords.has(id)) continue;
  f.words.push({ id, value, translations: { en }, pos, ...(gender ? { gender } : {}) });
  haveWords.add(id);
  added++;
}

type Q =
  | { type: "choice"; prompt: string; promptLang?: string; options: [string, boolean][] }
  | { type: "fill"; prompt: string; promptLang?: string; answer: string; accept?: string[] };

type Story = {
  id: string;
  title: string;
  titleTranslations: { en: string };
  text: string;
  glossary: string[];
  questions: Q[];
};

const choice = (prompt: string, options: [string, boolean][], promptLang?: string): Q => ({
  type: "choice",
  prompt,
  promptLang,
  options: options.map(([value, correct]) => ({ value, correct })),
});

const stories: Story[] = [
  {
    id: "st-saludos",
    title: "El primer encuentro",
    titleTranslations: { en: "The first meeting" },
    glossary: ["hola", "gracias", "por-favor", "adios"],
    text: `— Buenos días. Me llamo Nora. ¿Cómo estás?
— Muy bien, gracias. Me llamo Luis.
— Encantado, Luis. ¿De dónde eres?
— Soy de Sevilla, pero ahora vivo en Madrid. ¿Y tú?
— Soy de Lima. Vivo aquí desde hace dos años.
— Qué bien. ¿Hablas español con tus amigos?
— Sí, hablo español todos los días. A veces hablo inglés también.
— Muy bien. Adiós, Luis.
— Adiós, Nora. Hasta luego.`,
    questions: [
      choice("¿De dónde es Luis?", [
        ["Es de Sevilla.", false],
        ["Es de Madrid.", true],
        ["Es de Lima.", false],
        ["Es de Perú.", false],
      ]),
      choice("¿Cómo se dice 'very well' en la conversación?", [
        ["Muy bien", true],
        ["Muy mal", false],
        ["Un poco", false],
        ["No sé", false],
      ]),
      { type: "fill", prompt: "Vivo en Madrid. Yo ___ (ser) de Sevilla.", answer: "soy" },
    ],
  },
  {
    id: "st-numeros",
    title: "En la tienda",
    titleTranslations: { en: "At the shop" },
    glossary: ["tienda", "euro"],
    text: `— Buenos días. ¿Cuántas botas quiere?
— Dos, por favor. ¿Cuánto cuestan?
— Cuestan ochenta euros.
— Bien. Y quiero una mochila azul también.
— La mochila cuesta cincuenta euros. Todo son ciento treinta euros.
— Perfecto. Y una bolsa, por favor.
— Aquí tiene. ¡Buenas tardes!`,
    questions: [
      choice("¿Cuántas botas quiere?", [
        ["Dos", true],
        ["Tres", false],
        ["Ocho", false],
        ["Cincuenta", false],
      ]),
      choice("¿Cuánto cuestan las botas?", [
        ["Ochenta euros", true],
        ["Cincuenta euros", false],
        ["Ciento treinta euros", false],
        ["Doscientos euros", false],
      ]),
      { type: "fill", prompt: "La mochila cuesta cincuenta euros. Todo ___ ciento treinta euros.", answer: "son" },
    ],
  },
  {
    id: "st-colores",
    title: "La bicicleta nueva",
    titleTranslations: { en: "The new bicycle" },
    glossary: ["bicicleta", "rojo", "azul"],
    text: `Ana tiene una bicicleta nueva. La bicicleta es azul y el asiento es negro.
— ¿De qué color es tu bicicleta? —pregunta su amigo.
— Azul —responde Ana—. Antes era roja, pero ahora es azul.— ¿Y el casco?
— El casco es amarillo. Y las luces son blancas.
Ana está muy feliz. Su bicicleta es bonita y las ruedas son negras.`,
    questions: [
      choice("¿De qué color es la bicicleta de Ana?", [
        ["Azul", true],
        ["Roja", false],
        ["Negra", false],
        ["Blanca", false],
      ]),
      choice("¿De qué color era antes?", [
        ["Roja", true],
        ["Azul", false],
        ["Amarilla", false],
        ["Blanca", false],
      ]),
      choice("¿De qué color son las ruedas?", [
        ["Negras", true],
        ["Rojas", false],
        ["Blancas", false],
        ["Amarillas", false],
      ]),
    ],
  },
  {
    id: "st-hablar",
    title: "En la clase",
    titleTranslations: { en: "In the classroom" },
    glossary: ["clase", "estudiar", "profesor"],
    text: `En la clase de español hay doce estudiantes. Todos hablan un poco.
La profesora se llama Elena y habla muy rápido.
— Buenos días —dice ella—. Hoy estudiamos los verbos.
— Yo estudio español todos los días —dice Marta—. Estudio dos horas.
— Nosotros estudiamos juntos —dicen Pedro y Ana—. Ellos estudian en la biblioteca.
— ¿Dónde estudias tú, Pablo?
— Estudio en casa. Y a veces estudio en la biblioteca.
— Muy bien. Hablad español en la clase, por favor.`,
    questions: [
      choice("¿Cuántos estudiantes hay en la clase?", [
        ["Doce", true],
        ["Dos", false],
        ["Veinte", false],
        ["Cien", false],
      ]),
      choice("¿Dónde estudian Pedro y Ana?", [
        ["Juntos", true],
        ["En la biblioteca", false],
        ["En casa", false],
        ["No estudian", false],
      ]),
      { type: "fill", prompt: "Nosotros ___ (hablar) español en la clase.", answer: "hablamos" },
      { type: "fill", prompt: "Ellos ___ (estudiar) en la biblioteca.", answer: "estudian" },
    ],
  },
  {
    id: "st-comer-vivir",
    title: "La comida",
    titleTranslations: { en: "The meal" },
    glossary: ["comida", "fruta", "verdura"],
    text: `Carlos vive en una casa pequeña pero bonita. Todos los días come bien.
— ¿Qué comes, Carlos?
— Como verduras y fruta. Y como pan con queso.
— ¿Dónde vives?
— Vivo cerca del parque. Mi hermana vive en el centro y ella come en restaurantes.
— ¿Qué come tu hermana?
— Ella come pescado y bebe café. Nosotros comemos en casa.
— ¿Y tus amigos?
— Mis amigos comen en la cafetería. Todos comemos bien.`,
    questions: [
      choice("¿Qué come Carlos?", [
        ["Verduras y fruta", true],
        ["Pescado", false],
        ["Café", false],
        ["Nada", false],
      ]),
      choice("¿Dónde vive Carlos?", [
        ["Cerca del parque", true],
        ["En el centro", false],
        ["En un restaurante", false],
        ["En la cafetería", false],
      ]),
      { type: "fill", prompt: "Carlos ___ (vivir) cerca del parque.", answer: "vive" },
      { type: "fill", prompt: "Nosotros ___ (comer) en casa.", answer: "comemos" },
    ],
  },
  {
    id: "st-irregulares",
    title: "La familia",
    titleTranslations: { en: "The family" },
    glossary: ["familia", "perro", "casa"],
    text: `Mi familia es grande. Somos cinco: mi madre, mi padre, mi hermana, mi hermano y yo.
Mi padre es profesor y mi madre es médica. Mi hermana está en la escuela y mi hermano está en casa.
Nosotros tenemos un perro. El perro es pequeño y blanco.
— ¿Dónde está tu padre? —pregunta mi madre.
— Está en el trabajo. Siempre está allí.
— ¿Y tus amigos?
— Mis amigos están en el parque. Van allí todos los días.
Mi familia es feliz.`,
    questions: [
      choice("¿De qué color es el perro?", [
        ["Pequeño y blanco", true],
        ["Negro y grande", false],
        ["Rojo", false],
        ["No hay perro", false],
      ]),
      choice("¿Dónde está el padre?", [
        ["En el trabajo", true],
        ["En la escuela", false],
        ["En el parque", false],
        ["En casa", false],
      ]),
      { type: "fill", prompt: "Nosotros ___ (tener) un perro.", answer: "tenemos" },
      { type: "fill", prompt: "Mi padre ___ (ser) profesor.", answer: "es" },
    ],
  },
  {
    id: "st-fechas",
    title: "La cita",
    titleTranslations: { en: "The appointment" },
    glossary: ["cumpleanos", "hora"],
    text: `— ¿Cuándo es tu cumpleaños, Elena?
— Es el quince de marzo. Este año es el tres de marzo.
— ¿A qué hora es la fiesta?
— Empieza a las ocho y media de la noche.
— Perfecto. Yo llego a las ocho menos cuarto.
— ¿Y tu hermano?
— Mi hermano llega a las nueve en punto. Siempre llega tarde.
— Bueno. Nos vemos el quince de marzo.`,
    questions: [
      choice("¿Cuándo es el cumpleaños de Elena?", [
        ["El quince de marzo", true],
        ["El tres de marzo", false],
        ["El ocho de marzo", false],
        ["El quince de junio", false],
      ]),
      choice("¿A qué hora empieza la fiesta?", [
        ["A las ocho y media", true],
        ["A las ocho menos cuarto", false],
        ["A las nueve en punto", false],
        ["A las tres", false],
      ]),
      { type: "fill", prompt: "La fiesta empieza a las ocho ___ (media) de la noche.", answer: "y" },
    ],
  },
];

for (const story of stories) {
  if (existingStories.has(story.id)) throw new Error(`duplicate story id: ${story.id}`);
}
f.stories.push(...stories);

// Sanity: every glossary id must exist, or validation will reject the pack.
const wordIds = new Set(f.words.map((w) => w.id));
for (const story of stories) {
  for (const id of story.glossary) {
    if (!wordIds.has(id)) throw new Error(`story ${story.id}: unknown glossary word "${id}"`);
  }
}

await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log(`stories: ${f.stories.length} (+${stories.length}), words +${added}`);
