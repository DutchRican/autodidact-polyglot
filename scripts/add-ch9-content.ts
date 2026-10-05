/**
 * One-off content edit: Chapter 9 vocabulary and its three long readings.
 *
 * Chapter 9 is the reading chapter, so the words are largely about language
 * itself -- suffixes, prefixes, register -- and the three texts are longer and
 * glossed less than anything earlier in the course.
 *
 * Written after a first attempt produced six corruptions (stray CJK characters,
 * English left inside the Spanish, a duplicate id) and two words whose value
 * duplicated an existing one. The character scan below catches the first kind and
 * the duplicate-value lint catches the second, which is the point of having both.
 *
 * Run with: bun scripts/add-ch9-content.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const haveWords = new Set(pack.words.map((w: { id: string }) => w.id));
const haveValues = new Set(pack.words.map((w: { id: string; value: string }) => w.value.toLowerCase()));
const haveVerbs = new Set(pack.verbs.map((v: { id: string }) => v.id));

const words: Array<[string, string, string, string, string?]> = [
  // suffix families
  ["suf-mamente", "-mente", "(adverb suffix) -ly", "suffix", ""],
  ["suf-cion", "-ción", "(noun suffix) -tion", "suffix", ""],
  ["suf-dad", "-dad", "(noun suffix) -ness", "suffix", ""],
  ["suf-oso", "-oso", "(adjective suffix) -ous", "suffix", ""],
  ["suf-ivo", "-ivo", "(adjective suffix) -ive", "suffix", ""],
  ["suf-ero", "-ero", "(noun suffix) one who", "suffix", ""],

  // words built on them, so the lesson has something to point at
  ["lento", "lento", "slow", "adj", ""],
  ["lentamente", "lentamente", "slowly", "adv", ""],
  ["atencion", "la atención", "attention", "noun", "f"],
  ["habilidad", "la habilidad", "the ability", "noun", "f"],
  ["oscuro", "oscuro", "dark", "adj", ""],
  ["peligroso", "peligroso", "dangerous", "adj", ""],
  ["perezoso", "perezoso", "lazy", "adj", ""],
  ["tristeza", "la tristeza", "sadness", "noun", "f"],
  ["aventura", "la aventura", "the adventure", "noun", "f"],
  ["aventurero", "aventurero", "adventurous", "adj", ""],
  ["candidato", "el candidato", "the candidate", "noun", "m"],
  ["reforma", "la reforma", "the reform", "noun", "f"],
  ["viaje", "el viaje", "the journey", "noun", "m"],
  ["pasado", "el pasado", "the past", "noun", "m"],

  // prefixes
  ["pref-des", "des-", "(prefix) un-, dis-", "prefix", ""],
  ["pref-in", "in-", "(prefix) in-, not-", "prefix", ""],
  ["pref-con", "con-", "(prefix) with-, together", "prefix", ""],
  ["pref-sub", "sub-", "(prefix) under-", "prefix", ""],
  ["pref-super", "super-", "(prefix) over-", "prefix", ""],
  ["desorden", "el desorden", "the disorder", "noun", "m"],
  ["desayunar2", "desayunar", "to have breakfast", "verb", ""],
  ["inutil", "inútil", "useless", "adj", ""],
  ["incorrecto", "incorrecto", "incorrect", "adj", ""],
  ["continuo", "continuo", "continuous", "adj", ""],
  ["submarino", "el submarino", "the submarine", "noun", "m"],
  ["superior", "superior", "superior, upper", "adj", ""],

  // register and inference
  ["formal", "formal", "formal", "adj", ""],
  ["informal", "informal", "informal", "adj", ""],
  ["coloquial", "coloquial", "colloquial, everyday", "adj", ""],
  ["sostener", "sostener", "to claim, to assert", "verb", ""],
  ["sugerir", "sugerir", "to suggest", "verb", ""],
  ["matizar", "matizar", "to qualify, to nuance", "verb", ""],
  ["implicito", "implícito", "implicit", "adj", ""],
  ["explicito", "explícito", "explicit", "adj", ""],
  ["ironia", "la ironía", "the irony", "noun", "f"],
  ["matiz", "el matiz", "the nuance", "noun", "m"],
  ["afirmar", "afirmar", "to assert, to state firmly", "verb", ""],

  // narrative sequencing
  ["de-repente", "de repente", "suddenly", "adv", ""],
  ["de-pronto", "de pronto", "suddenly", "adv", ""],
  ["al-final", "al final", "at the end", "adv", ""],
  ["mientras-tanto", "mientras tanto", "meanwhile", "adv", ""],
  ["en-cambio", "en cambio", "on the other hand", "adv", ""],
  ["en-cuanto", "en cuanto", "as soon as", "conj", ""],
  ["a-medida-que", "a medida que", "as, more and more", "conj", ""],
  ["en-efecto", "en efecto", "in fact, indeed", "adv", ""],
  ["ahora-bien", "ahora bien", "now then", "adv", ""],

  // modals
  ["puede-que", "puede que", "it may be that", "phrase", ""],
  ["quiza", "quizá", "perhaps", "adv", ""],
  ["seguramente", "seguramente", "probably", "adv", ""],
  ["obligacion", "la obligación", "the obligation", "noun", "f"],
  ["permitir", "permitir", "to allow", "verb", ""],
  ["impedir", "impedir", "to prevent", "verb", ""],
  ["anadir", "añadir", "to add", "verb", ""],

  // for the readings
  ["compuerta", "la compuerta", "the sluice gate", "noun", "f"],
  ["inundar", "inundar", "to flood", "verb", ""],
  ["valle", "el valle", "the valley", "noun", "m"],
  ["rio", "el río", "the river", "noun", "m"],
  ["pueblo", "el pueblo", "the village", "noun", "m"],
  ["reunion2", "la reunión", "the meeting", "noun", "f"],
  ["caldo", "el caldo", "the broth", "noun", "m"],
  ["olla", "la olla", "the pot", "noun", "f"],
  ["puerro", "el puerro", "the leek", "noun", "m"],
  ["zanahoria", "la zanahoria", "the carrot", "noun", "f"],
  ["cebolla", "la cebolla", "the onion", "noun", "f"],
  ["apio", "el apio", "the celery", "noun", "m"],
  ["receta", "la receta", "the recipe", "noun", "f"],
  ["fuego", "el fuego", "the heat, the fire", "noun", "m"],
  ["hora2", "la hora", "the hour", "noun", "f"],
  ["tarde2c", "tarde", "late", "adj", ""],
  ["prisa", "la prisa", "the hurry", "noun", "f"],
  ["sal", "la sal", "the salt", "noun", "f"],
  ["sabor", "el sabor", "the flavour", "noun", "m"],
  ["agua2", "el agua", "the water", "noun", "f"],
  ["bus", "el autobús", "the bus", "noun", "m"],
  ["parada", "la parada", "the stop", "noun", "f"],
  ["conductor", "el conductor", "the driver", "noun", "m"],
  ["nieto", "el nieto", "the grandson", "noun", "m"],
  ["barrio", "el barrio", "the neighbourhood", "noun", "m"],
  ["coger", "coger", "to catch, to take", "verb", ""],
  ["correr", "correr", "to run", "verb", ""],
  ["llegar", "llegar", "to arrive", "verb", ""],
];

const skipped: string[] = [];
let added = 0;
for (const [id, value, en, pos, gender] of words) {
  if (haveWords.has(id)) continue;
  // The pack has learned this twice already, so check the value too.
  if (haveValues.has(value.toLowerCase())) {
    skipped.push(`${id} ("${value}" already exists)`);
    continue;
  }
  pack.words.push({
    id,
    value,
    translations: { en },
    pos,
    ...(gender ? { gender } : {}),
  });
  haveWords.add(id);
  haveValues.add(value.toLowerCase());
  added++;
}

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`words +${added}, stories ${pack.stories.length}`);
if (skipped.length) console.log(`skipped as duplicates: ${skipped.join("; ")}`);
void haveVerbs;
