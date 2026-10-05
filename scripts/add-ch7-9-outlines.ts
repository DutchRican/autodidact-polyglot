/**
 * One-off content edit: lesson outlines for chapters 7-9.
 *
 * These are plans, not lessons. A stub Lesson would still owe a quiz, and
 * inventing quiz questions means inventing content nobody has proof-read — the
 * exact failure mode the character validator cannot catch. So each chapter gets
 * an `outline`: titles, what each lesson covers, and nothing else.
 *
 * The syllabus decisions worth flagging to a human:
 *   - dative pronouns and indirect commands land in chapter 7, because that is
 *     where giving and telling someone first comes up
 *   - the subjunctive lands in chapter 8, with ojalá, esperar que and no creo
 *     que as the three anchors. It currently appears in a chapter 4 reading
 *     (ojalá, esperar que) and is never taught, which is a real gap
 *   - word formation (prefijos and sufijos) is chapter 9, since sustained
 *     reading is where guessing from roots becomes useful
 *
 * Run with: bun scripts/add-ch7-9-outlines.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const outlines: Record<string, Array<{ title: string; subtitle?: string; covers?: string }>> = {
  "chapter-7": [
    {
      title: "Los oficios",
      subtitle: "Jobs, and the two prepositions they take",
      covers: "trabajar de, estudiar para, ser de",
    },
    {
      title: "El lugar de trabajo",
      subtitle: "The office, the classroom, and who is in them",
      covers: "oficina, empresa, reunión, jefe, sueldo, asignatura",
    },
    {
      title: "Los pronombres de objeto indirecto",
      subtitle: "me, te, le, nos, os, les",
      covers: "the dative pronouns, and where they go in the sentence",
    },
    {
      title: "Dar, preguntar, contar, explicar",
      subtitle: "The verbs that need an indirect object",
      covers: "dar, preguntar, contar, explicar + dative",
    },
    {
      title: "Dile que / pregúntale si",
      subtitle: "Asking someone to pass a message on",
      covers: "indirect commands, with and without a pronoun",
    },
    {
      title: "El horario",
      subtitle: "a las, desde, hasta, and how often",
      covers: "schedules, duration, and frequency",
    },
    {
      title: "En la escuela",
      subtitle: "Subjects, exams, and marks",
      covers: "asignatura, examen, nota, aprobado, suspender",
    },
    {
      title: "El se impersonal",
      subtitle: "Se habla inglés. Se vive bien.",
      covers: "impersonal se, and the passive it looks like",
    },
    {
      title: "Lectura: el primer día",
      subtitle: "A new job, told as a story",
      covers: "a workplace narrative, in the preterite",
    },
    { title: "Repaso", subtitle: "Chapter 7 mixed drill" },
  ],
  "chapter-8": [
    {
      title: "Ojalá y el subjuntivo",
      subtitle: "The one mood you cannot build out of the indicative",
      covers: "present subjunctive endings, ojalá",
    },
    {
      title: "Emotion, doubt and expectation",
      subtitle: "The three reasons the subjunctive appears",
      covers: "esperar que, tener miedo de que, no creer que",
    },
    {
      title: "Que: causa, purpose, concession",
      subtitle: "One word, three jobs",
      covers: "que as cause, purpose and concession, and why the mood differs",
    },
    {
      title: "Los conectores de causa",
      subtitle: "porque, ya que, puesto que, dado que",
      covers: "four connectors for one job, ordered by register",
    },
    {
      title: "Aunque",
      subtitle: "Concession, and the subjunctive that comes with it",
      covers: "aunque, a pesar de que, si bien",
    },
    {
      title: "La consecuencia",
      subtitle: "por eso, así que, y lo que follows",
      covers: "consequence connectors, and the two that need a conjunction",
    },
    {
      title: "La pasiva y la voz reflexiva",
      subtitle: "fue construido, se construyó",
      covers: "passive with ser, and the reflexive passive",
    },
    {
      title: "La posición de lo destacado",
      subtitle: "lo, la, le — putting the emphasis first",
      covers: "fronted clitics, and when it sounds odd",
    },
    {
      title: "Lectura: dos puntos de vista",
      subtitle: "An argument, from both sides",
      covers: "a debate text, with agreement and disagreement",
    },
    { title: "Repaso", subtitle: "Chapter 8 mixed drill" },
  ],
  "chapter-9": [
    {
      title: "La inferencia",
      subtitle: "Reading between the lines",
      covers: "inferring from mood and register, not just stated facts",
    },
    {
      title: "El registro",
      subtitle: "Formal and informal, and the tells",
      covers: "usted, subjunctive, and diction as register markers",
    },
    {
      title: "Palabras por sufijos",
      subtitle: "-mente, -ción, -dad, -oso, -ivo, -ero",
      covers: "building meaning from endings, to guess unknown words",
    },
    {
      title: "Los prefijos",
      subtitle: "des-, in-, con-, sub-, super-",
      covers: "opposites and intensifiers, and the false friends",
    },
    {
      title: "Los verbos modales",
      subtitle: "deber, poder, querer, saber",
      covers: "the modals as single words, and the odds they take",
    },
    {
      title: "Los conectores literarios",
      subtitle: "sin embargo, en efecto, ahora bien",
      covers: "the literary register of concession and consequence",
    },
    {
      title: "Narrar en el tiempo",
      subtitle: "Antes de que, al final, de repente",
      covers: "sequencing a narrative, and the subjunctive in time clauses",
    },
    {
      title: "Lectura larga: un cuento",
      subtitle: "A short story, with almost no glosses",
      covers: "a full narrative, read for inference rather than facts",
    },
    {
      title: "Lectura larga: un texto argumentativo",
      subtitle: "An essay, with its structure visible",
      covers: "claim, concession, evidence, and rebuttal",
    },
    { title: "Repaso", subtitle: "Chapter 9 mixed drill" },
  ],
};

let changed = 0;
for (const [id, outline] of Object.entries(outlines)) {
  const chapter = pack.chapters.find((c) => c.id === id);
  if (!chapter) throw new Error(`no ${id}`);
  if (chapter.lessons.length) {
    throw new Error(`${id} already has ${chapter.lessons.length} lessons; drop its outline`);
  }
  if (chapter.outline) {
    throw new Error(`${id} already has an outline`);
  }
  chapter.outline = outline;
  changed++;
  console.log(`${id}: ${outline.length} planned lessons`);
}

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`outlines added: ${changed}`);
