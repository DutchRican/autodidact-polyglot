/**
 * One-off content edit: add the affirmative imperative as a seventh tense.
 *
 * The engine already allowed a `null` ending (see TenseRule.patterns), because
 * Spanish has no first-person singular imperative -- there is no "yo speak!",
 * since an order to yourself is not an order. This script adds the tense itself.
 *
 * The endings:
 *
 *   -ar      tu -a, usted -e, nosotros -emos, vosotros -ad, ellos -en
 *   -er/-ir  tu -e, usted -a, nosotros -amos, vosotros -ed, ellos -an
 *
 * Two derivations worth recording, because they are why the tú form looks like
 * the present and the rest does not:
 *
 *   - tú affirmative is the present indicative minus the final -s.
 *     hablar -> hablas -> habla.  comer -> comes -> come.
 *     This holds for every verb including the stem changers, and it is why the
 *     imperative tú of pensar is "piensa" and not "pensá".
 *
 *   - the other four are the present subjunctive.  hablemos, hable, hablen;
 *     comamos, coma, coman.  This is also why the imperative needs its own
 *     stemChanges for the e->ie verbs (habléis, but hablad) rather than
 *     inheriting the present's.
 *
 * The negative imperative is the subjunctive plus "no" and needs no tense of its
 * own: no hable, no comamos. Chapter 10's imperative lesson teaches it that way.
 *
 * Run with: bun scripts/add-imperative-tense.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const conjugation = pack.conjugation;

if (conjugation.tenses["imperative"]) {
  console.log("imperative already present");
  process.exit(0);
}

// Built after conditional: it is a mood, taught in the final chapter, and the
// order of this object is the order the tables and the verb reference display.
const rebuilt: Record<string, unknown> = {};
for (const [id, rule] of Object.entries(conjugation.tenses)) {
  rebuilt[id] = rule;
  if (id === "conditional") {
    rebuilt["imperative"] = {
      label: "Imperative (imperativo afirmativo)",
      labelTranslations: { en: "Imperative (affirmative imperative)" },
      patterns: {
        // null for yo: no first-person singular imperative in Spanish.
        ar: [null, "a", "e", "emos", "ad", "en"],
        er: [null, "e", "a", "amos", "ed", "an"],
        ir: [null, "e", "a", "amos", "ed", "an"],
      },
    };
  }
}
conjugation.tenses = rebuilt;

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log("imperative added; tenses are now " + Object.keys(conjugation.tenses).join(", "));
