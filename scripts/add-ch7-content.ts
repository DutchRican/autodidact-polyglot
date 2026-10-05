/**
 * One-off content edit: Chapter 7 vocabulary and verbs (work and study).
 *
 * Fixes two duplicate word values found while preparing this chapter:
 *   - "trabajo" and "el-trabajo" are both "el trabajo"; nothing referenced
 *     "trabajo", so it goes and "el-trabajo" (used by two story glossaries) stays
 *   - "siempre2" duplicates "siempre", which chapter 3 already had. I added
 *     siempre2 in chapter 6 without checking. Chapter 6 now points at the
 *     original.
 *
 * Chapter 7 needs seven verbs the pack had only as vocabulary entries with
 * pos "verb", which means the learner could read them but not conjugate them.
 * They are added to `verbs` properly, keeping the word entry -- that is the
 * existing pattern for estudiar, dormir, sentir and pedir, which are in both.
 *
 * buscar needs full subjunctive overrides. It is a -car verb, and the inserted
 * ue lives in the endings rather than the stem, so one stem cannot reach it --
 * the same limit as pagar.
 *
 * Run with: bun scripts/add-ch7-content.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const haveWords = new Set(pack.words.map((w) => w.id));
const haveVerbs = new Set(pack.verbs.map((v) => v.id));
const haveStories = new Set(pack.stories.map((s) => s.id));

// ---- duplicate word values -------------------------------------------------
for (const dead of ["trabajo", "siempre2"]) {
  if (!haveWords.has(dead)) continue;
  for (const chapter of pack.chapters) {
    for (const lesson of chapter.lessons ?? []) {
      for (const section of lesson.sections ?? []) {
        if (!("wordIds" in section)) continue;
        section.wordIds = section.wordIds.filter((id) => id !== dead);
      }
    }
  }
  pack.words = pack.words.filter((w) => w.id !== dead);
  haveWords.delete(dead);
  console.log(`removed duplicate word "${dead}"`);
}

// ---- words -----------------------------------------------------------------
const words: Array<[string, string, string, string, string?]> = [
  // jobs
  ["abogado", "el abogado", "lawyer", "noun", "m"],
  ["ingeniero", "el ingeniero", "engineer", "noun", "m"],
  ["enfermera", "la enfermera", "nurse", "noun", "f"],
  ["panadero", "el panadero", "bread seller", "noun", "m"],
  ["vendedor", "el vendedor", "sales assistant", "noun", "m"],
  ["cociner", "el cocinero", "cook", "noun", "m"],
  ["traductor", "el traductor", "translator", "noun", "m"],

  // the workplace
  ["empresa", "la empresa", "the company", "noun", "f"],
  ["jefa", "la jefa", "the boss", "noun", "f"],
  ["companero", "el compañero", "the colleague", "noun", "m"],
  ["cliente", "el cliente", "the customer", "noun", "m"],
  ["horario", "el horario", "the schedule", "noun", "m"],
  ["cargo", "el cargo", "the post, the job title", "noun", "m"],
  ["entrevista", "la entrevista", "the interview", "noun", "f"],
  ["experiencia", "la experiencia", "the experience", "noun", "f"],

  // study
  ["asignatura", "la asignatura", "the subject, the course", "noun", "f"],
  ["examen", "el examen", "the exam", "noun", "m"],
  ["nota", "la nota", "the mark", "noun", "f"],
  ["aprobado", "aprobado", "passed", "adj", ""],
  ["suspendido", "suspendido", "failed", "adj", ""],
  ["aula", "el aula", "the classroom", "noun", "m"],
  ["biblioteca", "la biblioteca", "the library", "noun", "f"],
  ["carrera", "la carrera", "the degree", "noun", "f"],
  ["beca", "la beca", "the grant, the scholarship", "noun", "f"],

  // time and schedule
  ["desde", "desde", "from, since", "prep", ""],
  ["hasta", "hasta", "until", "prep", ""],
  ["cada-dia", "cada día", "each day", "phrase", ""],
  ["fin-de-semana", "el fin de semana", "the weekend", "noun", "m"],
  ["todo-el-dia", "todo el día", "all day", "phrase", ""],

  // giving, telling, asking
  ["dativo-le", "le", "to him, to her, to you", "pron", ""],
  ["regalo", "el regalo", "the present", "noun", "m"],
  ["consejo", "el consejo", "the advice", "noun", "m"],
  ["favor", "el favor", "the favour", "noun", "m"],
  ["ayuda", "la ayuda", "the help", "noun", "f"],
  ["informacion", "la información", "the information", "noun", "f"],
  ["explicacion", "la explicación", "the explanation", "noun", "f"],
  ["pregunta", "la pregunta", "the question", "noun", "f"],
  ["respuesta", "la respuesta", "the answer", "noun", "f"],
  ["noticia", "la noticia", "the news", "noun", "f"],

  // the impersonal se
  ["se-impersonal", "se", "it, one, people in general", "pron", ""],
  ["idioma", "el idioma", "the language", "noun", "m"],
];

let addedWords = 0;
for (const [id, value, en, pos, gender] of words) {
  if (haveWords.has(id)) continue;
  pack.words.push({
    id,
    value,
    translations: { en },
    pos,
    ...(gender ? { gender } : {}),
  });
  haveWords.add(id);
  addedWords++;
}

// ---- verbs -----------------------------------------------------------------
type Verb = {
  id: string;
  infinitive: string;
  stem: string;
  pattern: string;
  en: string;
  irregular?: Record<string, string>;
  stemChanges?: Record<string, Record<string, string>>;
  subjunctiveOverrides?: Record<string, string>;
  notes?: string;
  example: string;
  exampleEn: string;
};

const ALL = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];
const onAll = (stem: string) => Object.fromEntries(ALL.map((p) => [p, stem]));

const verbs: Verb[] = [
  { id: "trabajar", infinitive: "trabajar", stem: "trabaj", pattern: "ar", en: "to work",
    notes: "trabajar de + noun for the job: trabajo de cocinero.",
    example: "Trabajo en una empresa grande.", exampleEn: "I work for a big company." },
  { id: "empezar", infinitive: "empezar", stem: "empez", pattern: "ar", en: "to start",
    stemChanges: {
      present: { yo: "empiez", tu: "empiez", el: "empiez", nosotros: "empez", vosotros: "empez", ellos: "empiez" },
      subjunctive: { yo: "empiec", tu: "empiec", el: "empiec", nosotros: "empec", vosotros: "empec", ellos: "empiec" },
    },
    notes: "e becomes ie on four personae; nosotros and vosotros are regular. z becomes c before e.",
    example: "Empiezo a las nueve.", exampleEn: "I start at nine." },
  { id: "necesitar", infinitive: "necesitar", stem: "necesit", pattern: "ar", en: "to need",
    example: "Necesito un día libre.", exampleEn: "I need a day off." },
  { id: "esperar", infinitive: "esperar", stem: "esper", pattern: "ar", en: "to wait, to hope",
    notes: "esperar + infinitive: espero llegar. esperar que + clause: espero que vengas.",
    example: "Espero que llegue temprano.", exampleEn: "I hope it arrives early." },
  { id: "escribir", infinitive: "escribir", stem: "escrib", pattern: "ir", en: "to write",
    irregular: { yo: "escribo" }, stemChanges: { subjunctive: onAll("escrib") },
    example: "Escribo a mi hermana.", exampleEn: "I am writing to my sister." },
  { id: "buscar", infinitive: "buscar", stem: "busc", pattern: "ar", en: "to look for",
    subjunctiveOverrides: { yo: "busque", tu: "busques", el: "busque", nosotros: "busquemos", vosotros: "busquéis", ellos: "busquen" },
    notes: "A -car verb: the inserted ue lives in the endings, not the stem, so the subjunctive is written out.",
    example: "Busco trabajo.", exampleEn: "I am looking for work." },
  { id: "aprender", infinitive: "aprender", stem: "aprend", pattern: "er", en: "to learn",
    example: "Aprendo español.", exampleEn: "I am learning Spanish." },
  { id: "ayudar", infinitive: "ayudar", stem: "ayud", pattern: "ar", en: "to help",
    notes: "ayudar a + person. The a is not optional.",
    example: "Ayudo a mi hermana.", exampleEn: "I help my sister." },
  { id: "preguntar", infinitive: "preguntar", stem: "pregunt", pattern: "ar", en: "to ask",
    notes: "preguntar a + person, or preguntar por + thing.",
    example: "Pregunto por el puesto.", exampleEn: "I am asking about the post." },
  { id: "contar", infinitive: "contar", stem: "cont", pattern: "ar", en: "to count, to tell",
    stemChanges: { present: onAll("cuent"), subjunctive: { yo: "cuent", tu: "cuent", el: "cuent", nosotros: "cont", vosotros: "cont", ellos: "cuent" } },
    notes: "o becomes ue on four personae. contar con = to count on.",
    example: "¿Me lo cuentas?", exampleEn: "Will you tell me about it?" },
  { id: "explicar", infinitive: "explicar", stem: "explic", pattern: "ar", en: "to explain",
    stemChanges: { subjunctive: { yo: "explic", tu: "explic", el: "explic", nosotros: "expliqu", vosotros: "expliqu", ellos: "expliqu" } },
    notes: "explicar algo a alguien. The order is the reverse of English. A -car verb, so the subjunctive writes qu before e and i: expliquemos, expliquéis, expliquen.",
    example: "Te lo explico.", exampleEn: "I will explain it to you." },
  { id: "llamar", infinitive: "llamar", stem: "llam", pattern: "ar", en: "to call",
    example: "Me llamo Ana.", exampleEn: "My name is Ana." },
  { id: "seguir", infinitive: "seguir", stem: "sigu", pattern: "ir", en: "to follow, to carry on",
    irregular: { yo: "sigo" },
    stemChanges: { subjunctive: onAll("sig") },
    notes: "e becomes ie: sigo, sigues, sigue, seguimos, seguís, siguen. The subjunctive drops the u: siga, sigas, siga, sigamos, sigáis, sigan.",
    example: "¿Sigues estudiando?", exampleEn: "Are you still studying?" },
];

let addedVerbs = 0;
for (const v of verbs) {
  if (haveVerbs.has(v.id)) continue;
  const entry: Record<string, unknown> = {
    id: v.id,
    infinitive: v.infinitive,
    stem: v.stem,
    pattern: v.pattern,
    translations: { en: v.en },
  };
  if (v.irregular) entry.irregular = { present: v.irregular };
  if (v.stemChanges) entry.stemChanges = v.stemChanges;
  if (v.subjunctiveOverrides) entry.irregular = { ...(entry.irregular as object), subjunctive: v.subjunctiveOverrides };
  if (v.notes) entry.notes = v.notes;
  entry.example = v.example;
  entry.exampleTranslation = { en: v.exampleEn };
  pack.verbs.push(entry as never);
  haveVerbs.add(v.id);
  addedVerbs++;
}

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`words +${addedWords}, verbs +${addedVerbs}`);
