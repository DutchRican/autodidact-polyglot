/**
 * One-off content edit: chapter 10 vocabulary and its three timed readings.
 *
 * Chapter 10 is the consolidation chapter, so the vocabulary is the two things
 * no earlier chapter teaches: object pronouns, and the words that separate por
 * from para.
 *
 * The three readings are the timed ones -- lesson 8 asks the learner to read
 * them with no glossary at all, so these carry no glossary key at all. That is
 * deliberate and is the only place in the course where a story has an empty one.
 *
 * Run with: bun scripts/add-ch10-content.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const haveWords = new Set(pack.words.map((w: { id: string }) => w.id));
const haveValues = new Set(pack.words.map((w: { id: string; value: string }) => w.value.toLowerCase()));

const words: Array<[string, string, string, string, string?]> = [
  // object pronouns: the direct set
  ["pron-me", "me", "me, myself (direct object)", "pron", ""],
  ["pron-te", "te", "you (direct object)", "pron", ""],
  ["pron-lo", "lo", "it, him (direct object)", "pron", ""],
  ["pron-la", "la", "it, her (direct object)", "pron", ""],
  ["pron-nos", "nos", "us (direct object)", "pron", ""],
  ["pron-os", "os", "you all (direct object)", "pron", ""],
  ["pron-los", "los", "them (direct, masculine or mixed)", "pron", ""],
  ["pron-las", "las", "them (direct, feminine)", "pron", ""],
  // indirect object
  ["pron-le", "le", "to him, to her, to you (indirect object)", "pron", ""],
  ["pron-les", "les", "to them, to you all (indirect object)", "pron", ""],
  // se has three unrelated jobs, which is the whole difficulty
  ["pron-se", "se", "reflexive, or a substitute pronoun", "pron", ""],
  // the reflexive pronouns already exist as verbs, listed here for the lesson
  ["refl-me", "me", "reflexive pronoun", "pron", ""],

  // por vs para: the nouns that pin each one down
  ["por-que2", "por", "for, because of, through (por)", "prep", ""],
  ["para-que2", "para", "for, in order to, towards (para)", "prep", ""],
  ["motivo", "el motivo", "the reason", "noun", "m"],
  ["proposito2", "el propósito", "the purpose", "noun", "m"],
  ["destino", "el destino", "the destination", "noun", "m"],
  ["medio", "el medio", "the means, the medium", "noun", "m"],
  ["ayuda2", "la ayuda", "the help", "noun", "f"],
  ["colaboracion", "la colaboración", "the collaboration", "noun", "f"],
  ["plazo", "el plazo", "the deadline, the time limit", "noun", "m"],
  ["tramo", "el tramo", "the stretch, the section", "noun", "m"],
  ["debido", "debido a", "due to", "phrase", ""],
  ["para-que", "para que", "so that", "phrase", ""],
  ["por-que3", "porque", "because", "conj", ""],
  ["ademas", "además", "besides, moreover", "adv", ""],
  ["sin-embargo2", "sin embargo", "however", "phrase", ""],
  ["por-favor", "por favor", "please", "phrase", ""],

  // the six irregular imperatives, as words the exam lesson can point at
  ["imp-sed", "sed", "be (vosotros imperative of ser)", "verb", ""],
  ["imp-ved", "ved", "see (vosotros imperative of ver)", "verb", ""],
  ["imp-ded", "ded", "give (vosotros imperative of dar)", "verb", ""],
  ["imp-haz", "haz", "do, make (tú imperative of hacer)", "verb", ""],
  ["imp-ve", "ve", "go (tú imperative of ir)", "verb", ""],
  ["imp-ten", "ten", "have, hold (tú imperative of tener)", "verb", ""],
  ["imp-ten2", "ten", "have, hold", "verb", ""],
  ["imp-di", "di", "say (tú imperative of decir)", "verb", ""],
  ["imp-sube", "sube", "go up (tú imperative of subir)", "verb", ""],
  ["imp-deja", "deja", "leave it (tú imperative of dejar)", "verb", ""],
  ["sino", "sino", "but rather, rather", "conj", ""],
  ["ojala2", "ojalá", "hopefully", "adv", ""],
  ["necesitas", "necesitas", "you need", "verb", ""],
  ["tienes-que", "tienes que", "you have to", "phrase", ""],
  ["ven-aqui", "ven aquí", "come here", "phrase", ""],
  ["sientate", "siéntate", "sit down", "phrase", ""],
  ["dime", "dime", "tell me", "phrase", ""],
  ["escuchame", "escúchame", "listen to me", "phrase", ""],
  ["ayudame", "ayúdame", "help me", "phrase", ""],
  ["esperame", "espérame", "wait for me", "phrase", ""],
  ["no-hagas", "no hagas", "do not do", "phrase", ""],
  ["no-vayas", "no vayas", "do not go", "phrase", ""],
  ["no-piens", "no pienses", "do not think", "phrase", ""],
  ["cuidado", "cuidado", "careful", "adj", ""],
  ["darse-cuenta", "darse cuenta", "to realise", "phrase", ""],
  ["llevar-dos", "llevar dos años", "to have been for two years", "phrase", ""],

  // for the timed readings
  ["panaderia", "la panadería", "the bakery", "noun", "f"],
  ["horno", "el horno", "the oven", "noun", "m"],
  ["masa", "la masa", "the dough", "noun", "f"],
  ["levadura", "la levadura", "the yeast", "noun", "f"],
  ["harina", "la harina", "the flour", "noun", "f"],
  ["rebajar", "rebajar", "to reduce, to knock down", "verb", ""],
  ["cola2", "la cola", "the queue", "noun", "f"],
  ["mostrador", "el mostrador", "the counter", "noun", "m"],
  ["panadero2", "el panadero", "the baker", "noun", "m"],
  ["turno", "el turno", "the turn, the shift", "noun", "m"],
  ["reclamo", "el reclamo", "the complaint", "noun", "m"],
  ["cobrar", "cobrar", "to charge, to collect", "verb", ""],
  ["factura", "la factura", "the bill, the invoice", "noun", "f"],
  ["equivocarse", "equivocarse", "to get it wrong", "verb", ""],
  ["apuntar", "apuntar", "to note down", "verb", ""],
  ["tranquilo", "tranquilo", "calm, easy-going", "adj", ""],
  ["discutir", "discutir", "to argue, to discuss", "verb", ""],
  ["reír", "reír", "to laugh", "verb", ""],
  ["sonreír", "sonreír", "to smile", "verb", ""],
  ["susurrar", "susurrar", "to whisper", "verb", ""],
  ["murmullo", "el murmullo", "the murmur", "noun", "m"],
  ["vecino2", "el vecino", "the neighbour", "noun", "m"],
  ["persiana", "la persiana", "the shutter", "noun", "f"],
  ["silencio", "el silencio", "the silence", "noun", "m"],
  ["tarde3", "la tarde", "the afternoon", "noun", "f"],
  ["atardecer", "el atardecer", "the dusk, the late afternoon", "noun", "m"],
  ["mediodía", "el mediodía", "midday", "noun", "m"],
  ["soler", "soler", "to be usual to", "verb", ""],
  ["increíble", "increíble", "incredible", "adj", ""],
  ["paciencia", "la paciencia", "patience", "noun", "f"],
];

let added = 0;
const skipped: string[] = [];
for (const [id, value, en, pos, gender] of words) {
  if (haveWords.has(id)) continue;
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
console.log(`words +${added}, pack now ${pack.words.length}`);
if (skipped.length) console.log(`skipped as duplicates: ${skipped.join("; ")}`);
