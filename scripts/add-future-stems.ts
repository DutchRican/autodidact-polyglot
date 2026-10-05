/**
 * One-off content edit: give every verb an explicit future/conditional stem.
 *
 * The future attaches to the whole infinitive, not the short stem — hablar + é =
 * hablaré, not hablé — which is why `stemByTense` exists. Chapter 4 set it up for
 * the 17 verbs whose futures it displayed, and 34 verbs were never given one, so
 * their future fell back to the bare stem.
 *
 * That produced *encontré* as the future of encontrar, which is its preterite.
 * The verb reference page conjugates every tense of every verb, so this was
 * visible to a learner the whole time; it only escaped notice because no lesson
 * happened to display those futures.
 *
 * The stem is the infinitive with a trailing reflexive -se removed, since the
 * engine prepends the pronoun itself: acordarse -> me acordaré.
 *
 * Nine verbs shorten, and those already carry their stem from chapter 4:
 * tener->tendr-, poder->podr-, hacer->har-, decir->dir-, salir->sald-,
 * venir->vendr-, poner->pondr-, saber->sabr-, querer->querr-. This script
 * leaves them alone and refuses to overwrite an existing stem.
 *
 * Run with: bun scripts/add-future-stems.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

let added = 0;
let kept = 0;

for (const verb of pack.verbs) {
  if (verb.irregular?.future) {
    kept++;
    continue;
  }
  if (verb.stemByTense?.future) {
    kept++;
    continue;
  }
  // Reflexive -se belongs to the infinitive, not to the stem the ending attaches
  // to: acordarse -> "me acordaré", not "me acordarseé".
  const base = verb.reflexivePronouns ? verb.infinitive.replace(/se$/, "") : verb.infinitive;
  verb.stemByTense = { ...(verb.stemByTense ?? {}), future: base, conditional: base };
  added++;
}

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`future stems added: ${added}, already present: ${kept}`);
