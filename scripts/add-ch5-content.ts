/**
 * One-off content edit: Chapter 5 vocabulary and verbs for ser vs estar.
 *
 * Run with: bun scripts/add-ch5-content.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const haveWords = new Set(f.words.map((w) => w.id));
const haveVerbs = new Set(f.verbs.map((v) => v.id));
const haveStories = new Set(f.stories.map((s) => s.id));

const words: Array<[string, string, string, string, string?]> = [
  // conditions and moods, the estar half of the pair
  ["aburrido", "aburrido", "bored / boring", "adj", ""],
  ["contento", "contento", "happy / pleased", "adj", ""],
  ["triste", "triste", "sad", "adj", ""],
  ["nervioso", "nervioso", "nervous", "adj", ""],
  ["tranquilo", "tranquilo", "calm", "adj", ""],
  ["enfadado", "enfadado", "angry", "adj", ""],
  ["preocupado", "preocupado", "worried", "adj", ""],
  ["enfermo", "enfermo", "ill", "adj", ""],
  ["cansado", "cansado", "tired", "adj", ""],
  ["listo", "listo", "ready (LatAm) / clever (Spain)", "adj", ""],
  ["simpatico", "simpático", "friendly / nice", "adj", ""],
  ["interesante", "interesante", "interesting", "adj", ""],
  ["sabroso", "sabroso", "tasty", "adj", ""],
  ["salado", "salado", "salty", "adj", ""],
  ["sucio", "sucio", "dirty", "adj", ""],
  ["limpio", "limpio", "clean", "adj", ""],
  ["lleno", "lleno", "full", "adj", ""],
  ["vacio", "vacío", "empty", "adj", ""],
  ["roto", "roto", "broken", "adj", ""],
  ["nuevo", "nuevo", "new", "adj", ""],
  ["viejo", "viejo", "old", "adj", ""],

  // what you have, not what you are
  ["hambre", "hambre", "hunger", "noun", "f"],
  ["sueno", "sueño", "sleep / sleepiness", "noun", "m"],
  ["sed", "sed", "thirst", "noun", "f"],
  ["miedo", "miedo", "fear", "noun", "m"],
  ["razon", "razón", "reason", "noun", "f"],
  ["ganas", "ganas", "the urge / fancy", "noun", "f"],
  ["fiebre", "fiebre", "fever", "noun", "f"],
  ["calor", "calor", "heat", "noun", "m"],
  ["frio", "frío", "cold", "noun", "m"],
  ["la-nube", "la nube", "the cloud", "noun", "f"],
  ["la-tormenta", "la tormenta", "the storm", "noun", "f"],
  ["el-barrio", "el barrio", "the neighbourhood", "noun", "m"],
  ["la-fabrica", "la fábrica", "the factory", "noun", "f"],
  ["el-jefe", "el jefe", "the boss", "noun", "m"],
  ["el-trabajador", "el trabajador", "the worker", "noun", "m"],
  ["el-sueldo", "el sueldo", "the salary", "noun", "m"],

  // useful nouns the pair needs
  ["la-ciudad", "la ciudad", "the city", "noun", "f"],
  ["el-pais", "el país", "the country", "noun", "m"],
  ["la-venta", "la venta", "the sale", "noun", "f"],
  ["el-mapa", "el mapa", "the map", "noun", "m"],
  ["la-caja", "la caja", "the box", "noun", "f"],
  ["la-puerta", "la puerta", "the door", "noun", "f"],
];

let addedWords = 0;
for (const [id, value, en, pos, gender] of words) {
  if (haveWords.has(id)) continue;
  f.words.push({
    id,
    value,
    translations: { en },
    pos,
    ...(gender ? { gender } : {}),
  });
  haveWords.add(id);
  addedWords++;
}

type Verb = {
  id: string;
  infinitive: string;
  stem: string;
  pattern: string;
  en: string;
  irregular?: Record<string, string>;
  stemChanges?: Record<string, string>;
  reflexive?: Record<string, string>;
  notes?: string;
  example: string;
  exampleEn: string;
};

const PRON = {
  yo: "me",
  tu: "te",
  el: "se",
  nosotros: "nos",
  vosotros: "os",
  ellos: "se",
};

const verbs: Verb[] = [
  { id: "deber", infinitive: "deber", stem: "deb", pattern: "er", en: "to have to / must",
    example: "Debo irme ahora.", exampleEn: "I have to go now." },
  { id: "oler", infinitive: "oler", stem: "ol", pattern: "er", en: "to smell",
    irregular: { yo: "huelo" }, notes: "Two changes at once: huelo on yo, then huelas/huele/huelen on the stem.",
    example: "Huele muy bien.", exampleEn: "It smells very good." },
  { id: "doler", infinitive: "doler", stem: "dol", pattern: "er", en: "to hurt",
    notes: "Works like gustar: the thing that hurts is the subject. Me duele la cabeza.",
    example: "Me duele la cabeza.", exampleEn: "My head hurts." },
  { id: "gustar", infinitive: "gustar", stem: "gust", pattern: "ar", en: "to please",
    notes: "Like doler: the thing you like is the subject. Me gusta el café.",
    example: "Nos gusta la música.", exampleEn: "We like the music." },
  { id: "llover", infinitive: "llover", stem: "llov", pattern: "er", en: "to rain",
    irregular: { yo: "lluevo" }, stemChanges: { tu: "lluev", el: "lluev", ellos: "lluev" },
    notes: "Only used in the third person in practice: llueve.",
    example: "Llueve mucho.", exampleEn: "It rains a lot." },
  { id: "nevar", infinitive: "nevar", stem: "nev", pattern: "ar", en: "to snow",
    irregular: { yo: "nievo" }, notes: "Also third person only: nieva.",
    example: "Nevó en la montaña.", exampleEn: "It snowed in the mountains." },
  { id: "acordarse", infinitive: "acordarse", stem: "acord", pattern: "ar", en: "to remember",
    reflexive: PRON, notes: "Takes de: acordarse de. No accents needed on the reflexive pronouns.",
    example: "Me acuerdo de ella.", exampleEn: "I remember her." },
  { id: "olvidarse", infinitive: "olvidarse", stem: "olvid", pattern: "ar", en: "to forget",
    reflexive: PRON, notes: "Takes de: olvidarse de. Opposite of acordarse.",
    example: "Me olvidé de la cita.", exampleEn: "I forgot the appointment." },
  { id: "aburrirse", infinitive: "aburrirse", stem: "aburr", pattern: "ir", en: "to get bored",
    reflexive: PRON, notes: "With ser: es aburrido (he is boring). With estar: se aburre (he gets bored).",
    example: "Los niños se aburren.", exampleEn: "The children get bored." },
  { id: "despertarse", infinitive: "despertarse", stem: "despert", pattern: "ar", en: "to wake up",
    reflexive: PRON, example: "Me despierto a las seis.", exampleEn: "I wake up at six." },
];

let addedVerbs = 0;
for (const v of verbs) {
  if (haveVerbs.has(v.id)) continue;
  f.verbs.push({
    id: v.id,
    infinitive: v.infinitive,
    stem: v.stem,
    pattern: v.pattern,
    translations: { en: v.en },
    ...(v.irregular ? { irregular: { present: v.irregular } } : {}),
    ...(v.stemChanges ? { stemChanges: { present: v.stemChanges } } : {}),
    ...(v.reflexive ? { reflexivePronouns: v.reflexive } : {}),
    ...(v.notes ? { notes: v.notes } : {}),
    example: v.example,
    exampleTranslation: { en: v.exampleEn },
  });
  haveVerbs.add(v.id);
  addedVerbs++;
}

// Two of the verbs above also change their stem, which marking only the yo form
// hid: oler is huelo/huelas/huele (not *oles), llover is llueve/llueven (not
// *llove). Both are o -> ue, exactly like poder and querer.
const stemChange = (id: string, changes: Record<string, string>) => {
  const verb = f.verbs.find((v) => v.id === id);
  if (!verb) throw new Error(`no verb ${id}`);
  verb.stemChanges = { ...(verb.stemChanges ?? {}), present: changes };
  verb.notes = `${verb.notes ? `${verb.notes} ` : ""}Stem-changing: the o becomes ue on tú, él and ellos.`;
};
stemChange("oler", { tu: "huel", el: "huel", ellos: "huel" });
stemChange("llover", { tu: "lluev", el: "lluev", ellos: "lluev" });

// acordarse also changes its stem — e becomes ie in four personae: me acuerdo,
// te acuerdas, se acuerda, but nos acordamos and se acuerdan in the third.
const verbStemChange = (id: string, changes: Record<string, string>, note: string) => {
  const verb = f.verbs.find((v) => v.id === id);
  if (!verb) throw new Error(`no verb ${id}`);
  verb.stemChanges = { ...(verb.stemChanges ?? {}), present: changes };
  verb.notes = `${verb.notes ? `${verb.notes} ` : ""}${note}`;
};
verbStemChange(
  "acordarse",
  { yo: "acuerd", tu: "acuerd", el: "acuerd", ellos: "acuerd" },
  "e becomes ie: me acuerdo, te acuerdas, se acuerda, se acuerdan.",
);
verbStemChange(
  "despertarse",
  { yo: "despiert", tu: "despiert", el: "despiert", ellos: "despiert" },
  "e becomes ie: me despierto, te despiertas, se despierta, se despiertan.",
);
// aburrirse is NOT stem-changing in the present — me aburro, se aburre,
// aburrimos are all regular. Its e becomes i in the preterite instead
// (se aburrió), which the preterite rules already handle.

type Q =
  | { type: "choice"; prompt: string; promptLang?: string; options: [string, boolean][] }
  | { type: "fill"; prompt: string; promptLang?: string; answer: string; accept?: string[] };

const choice = (
  prompt: string,
  options: [string, boolean][],
  promptLang?: string,
): Q => ({
  type: "choice",
  prompt,
  promptLang,
  options: options.map(([value, correct]) => ({ value, correct })),
});

const stories = [
  {
    id: "st-la-fabrica",
    title: "La fábrica",
    titleTranslations: { en: "The factory" },
    glossary: ["la-fabrica", "el-jefe", "el-barrio", "el-trabajador"],
    text: `La fábrica está en el barrio nuevo. Es una fábrica grande y es muy antigua.
El jefe se llama Herrán y es de Madrid. Su mujer, Klara, es polaca y trabaja en una escuela.
Hoy es lunes y la fábrica está cerrada. No hay nadie dentro.
— ¿Por qué está cerrada la fábrica?
— Porque el jefe está de vacaciones. Toda la semana.
— ¿Y los trabajadores?
— Están en casa. Todos están enfadados, porque la fábrica lleva dos semanas rota.
La semana pasada la máquina no funcionaba. Nadie sabía qué pasaba. Y no tenían miedo: tenían prisa.
A ver qué pasa cuando vuelva el jefe.`,
    questions: [
      choice("¿Por qué está cerrada la fábrica?", [
        ["Porque el jefe está de vacaciones", true],
        ["Porque hay una venta", false],
        ["Porque está rota", false],
        ["Porque no hay trabajadores", false],
      ]),
      choice("¿Dónde está la fábrica?", [
        ["En el barrio nuevo", true],
        ["En Madrid", false],
        ["En una escuela", false],
        ["No se dice", false],
      ]),
      choice("¿Cómo están los trabajadores?", [
        ["Enfadados", true],
        ["Contentos", false],
        ["Enfermos", false],
        ["Tranquilos", false],
      ]),
    ],
  },
  {
    id: "st-mal-dia",
    title: "Un mal día",
    titleTranslations: { en: "A bad day" },
    glossary: ["fiebre", "hambre", "la-nube", "frio"],
    text: `Me desperté tarde y tenía mucha hambre. No había leche, así que no había desayuno.
Salí a la calle y hacía frío. El cielo estaba lleno de nubes y llovía.
Volví a casa mojado. Empecé a trabajar, y a las once me sentí fatal.
Me dolía la cabeza y tenía fiebre. No tenía ganas de nada.
A las dos me acosté un rato. A las cuatro me desperté con más hambre todavía.
Por la noche comí paella y me sentí mucho mejor.
Al día siguiente seguía cansado, pero ya no tenía fiebre.`,
    questions: [
      choice("¿Por qué no había desayuno?", [
        ["Porque no había leche", true],
        ["Porque dormía", false],
        ["Porque tenía hambre", false],
        ["Porque hacía frío", false],
      ]),
      choice("¿Cómo se sentía a las once?", [
        ["Mal", true],
        ["Bien", false],
        ["Contento", false],
        ["Tranquilo", false],
      ]),
      choice("¿Qué tenía por la noche?", [
        ["Ganas de comer", true],
        ["Fiebre", false],
        ["Sueño", false],
        ["Miedo", false],
      ]),
      {
        type: "fill",
        prompt: "Tenía mucha ___ (hunger)",
        promptLang: "es",
        answer: "hambre",
      },
    ],
  },
];

for (const story of stories) {
  if (/[^\u0000-\u024f\u2013\u2014¡¿°]/.test(story.text)) {
    throw new Error(`story ${story.id} contains unexpected characters`);
  }
  // Watch for a dropped space or a spliced word: two lowercase letters running
  // together is the usual shape of a bad paste.
  if (/[a-záéíóúñ][A-ZÁÉÍÓÚÑ]/.test(story.text)) {
    throw new Error(`story ${story.id} has a word run together`);
  }
  for (const word of ["makeup", "quickly", "Text", "TODO"]) {
    if (new RegExp(`\\b${word}\\b`).test(story.text)) {
      throw new Error(`story ${story.id} contains the fragment "${word}"`);
    }
  }
}

let addedStories = 0;
for (const story of stories) {
  if (haveStories.has(story.id)) continue;
  for (const id of story.glossary) {
    if (!haveWords.has(id)) throw new Error(`story ${story.id}: unknown glossary word "${id}"`);
  }
  f.stories.push(story);
  haveStories.add(story.id);
  addedStories++;
}

await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log(`words +${addedWords}, verbs +${addedVerbs}, stories +${addedStories}`);
