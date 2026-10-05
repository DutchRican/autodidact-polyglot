/**
 * One-off content edit: extend numbers to 1000 and add date/time vocabulary.
 * Run with: bun scripts/add-numbers-dates.ts
 */
const file = "content/es.json";
const f = await Bun.file(file).json();
const have = new Set(f.words.map((w) => w.id));
const add = [];
const w = (id: string, value: string, en: string, extra: Record<string, unknown> = {}) =>
  add.push({ id, value, translations: { en }, pos: "numeral", ...extra });

// Hundreds: 200-900 take -cientos, never -cientos y uno.
w("doscientos", "doscientos", "two hundred");
w("trescientos", "trescientos", "three hundred");
w("cuatrocientos", "cuatrocientos", "four hundred");
w("quinientos", "quinientos", "five hundred", { notes: "Spelled with q, no c: quinientos." });
w("seiscientos", "seiscientos", "six hundred");
w("setecientos", "setecientos", "seven hundred");
w("ochocientos", "ochocientos", "eight hundred");
w("novecientos", "novecientos", "nine hundred");

// Thousands and up.
w("mil", "mil", "one thousand", { notes: "mil is invariable: dos mil, quinientas mil personas." });
w("dosmil", "dos mil", "two thousand");
w("diezmil", "diez mil", "ten thousand");
w("cienmil", "cien mil", "one hundred thousand");
w("millon", "un millón", "one million", { notes: "Accented. From 200 the hundreds form: dos millones." });

// Dates.
w("dia", "el día", "the day");
w("semana", "la semana", "the week");
w("mes", "el mes", "the month");
w("ano", "el año", "the year");
w("hoy", "hoy", "today");
w("ayer", "ayer", "yesterday");
// "mañana" already exists as "la mañana", noted as also meaning "tomorrow".
w("lunes", "el lunes", "Monday");
w("fin", "el fin", "the end", { notes: "el fin de semana = the weekend." });
w("comienzo", "el comienzo", "the beginning");

// Time of day.
w("hora", "la hora", "the hour / the time");
w("mediodia", "el mediodía", "midday / noon");
w("medianoche", "la medianoche", "midnight");
w("y-media", "y media", "half past");
w("y-cuarto", "y cuarto", "quarter past");
w("menos-cuarto", "menos cuarto", "quarter to");

// Calendar events.
w("mes-pasado", "el mes pasado", "last month");
w("ano-nuevo", "el año nuevo", "New Year");
w("cumpleanos", "el cumpleaños", "birthday");

for (const entry of add) {
  if (have.has(entry.id)) throw new Error(`duplicate word id: ${entry.id}`);
}
f.words.push(...add);
await Bun.write(file, JSON.stringify(f, null, 2) + "\n");
console.log(`words: ${f.words.length} (+${add.length})`);
