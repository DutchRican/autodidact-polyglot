/**
 * Correct the present-subjunctive stems found by auditing all 47 verbs.
 *
 * The audit turned up nine wrong verbs, in four distinct causes. Only the first
 * is a fact about the stem; the rest are why a subjunctive cannot be generated
 * from a stem plus endings without per-verb data.
 *
 *   1. A written `g` before the -a of the -er/-ir subjunctive. Verb-specific,
 *      not derivable: comer gives *coma*, but tener gives tenga, traer traiga,
 *      and pagar gives *pague* with a written `gu` so the g stays hard.
 *
 *   2. A diphthong on four personae and plain stem on the other two. oler is
 *      *huela* but *olamos*; llover is *llueva* but *llovamos*; doler is *duela*
 *      but *dolamos*. Uniform stems cannot express this, so these are
 *      per-persona.
 *
 *   3. z -> c before -e, also per-persona, because the stem separately carries
 *      the diphthong. almorzar is *almorce*, *almuerces*, *almorzamos*.
 *
 *   4. A pattern that does not match the verb's real class. `estar` is tagged
 *      `ar`, which is not a mistake: its imperfect really is -ar-shaped
 *      (estaba, estabas), and it is fully overridden in the present and
 *      preterite anyway. But the subjunctive is -er-shaped (esté, estés), so
 *      estar cannot be generated at all and needs full overrides. Its pattern
 *      is left alone deliberately -- changing it to `er` would turn the
 *      imperfect into *estaría*.
 *
 * Run with: bun scripts/fix-subjunctive-stems.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

/** One stem for all six personae. */
const uniform: Record<string, string> = {
  ser: "se", // se + a = sea. "sea" as a stem would give *seaa.
  traer: "traig", // traig + a = traiga
  servir: "sirv", // sirv + a = sirva
  // e -> ie in the subjunctive too, on all six personae. Without this the
  // engine gives *desperte* and *despertes*.
  despertarse: "despiert", // needs the reflexive pronoun prefix too
};

/** Per-persona, where a single stem cannot express the form. */
const perPersona: Record<string, Record<string, string>> = {
  // 2. diphthong on four personae, plain stem on nosotros and vosotros
  oler: { yo: "huel", tu: "huel", el: "huel", nosotros: "ol", vosotros: "ol", ellos: "huel" },
  doler: { yo: "duel", tu: "duel", el: "duel", nosotros: "dol", vosotros: "dol", ellos: "duel" },
  llover: { yo: "lluev", tu: "lluev", el: "lluev", nosotros: "llov", vosotros: "llov", ellos: "lluev" },

  // e -> ue / o -> ue on four personae
  encontrar: {
    yo: "encuentr",
    tu: "encuentr",
    el: "encuentr",
    nosotros: "encontr",
    vosotros: "encontr",
    ellos: "encuentr",
  },
  costar: { yo: "cuest", tu: "cuest", el: "cuest", nosotros: "cost", vosotros: "cost", ellos: "cuest" },
};

/**
 * 4. Verbs that cannot be generated at all, and need every form written out.
 *
 *   estar — tagged `ar`, correctly, because its imperfect is -ar-shaped, but the
 *     subjunctive is -er-shaped.
 *
 *   pagar — a -gar verb, and the inserted *ue* lives in the endings rather than
 *     the stem: pag + ue = pague, pag + uemos = paguemos, but pag + an = pagen.
 *     One stem cannot produce both, so the tense model's single ending set per
 *     pattern cannot reach it. Every -car, -gar and -zar verb added later will
 *     need the same treatment; there is one in the pack at present.
 */
const fullOverrides: Record<string, Record<string, string>> = {
  estar: {
    yo: "esté",
    tu: "estés",
    el: "esté",
    nosotros: "estemos",
    vosotros: "estéis",
    ellos: "estén",
  },
  pagar: {
    yo: "pague",
    tu: "pagues",
    el: "pague",
    nosotros: "paguemos",
    vosotros: "paguéis",
    ellos: "pagen",
  },
};

const ALL = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];
const named = [...Object.keys(uniform), ...Object.keys(perPersona), ...Object.keys(fullOverrides)];
const missing = named.filter((inf) => !pack.verbs.some((v) => v.infinitive === inf));
if (missing.length) throw new Error(`not in pack: ${missing.join(", ")}`);

let fixed = 0;
for (const verb of pack.verbs) {
  const uniformStem = uniform[verb.infinitive];
  if (uniformStem) {
    verb.stemChanges = {
      ...(verb.stemChanges ?? {}),
      subjunctive: Object.fromEntries(ALL.map((p) => [p, uniformStem])),
    };
    fixed++;
  }

  const byPersona = perPersona[verb.infinitive];
  if (byPersona) {
    verb.stemChanges = { ...(verb.stemChanges ?? {}), subjunctive: byPersona };
    fixed++;
  }

  const override = fullOverrides[verb.infinitive];
  if (override) {
    verb.irregular = { ...(verb.irregular ?? {}), subjunctive: override };
    fixed++;
  }
}

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log(`corrected ${fixed} verb(s)`);
