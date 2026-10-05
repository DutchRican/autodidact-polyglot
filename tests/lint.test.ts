import { describe, expect, test } from "bun:test";
import { lintPack, type LintFinding } from "../src/engine/lint.ts";
import { loadPack } from "../src/engine/content.ts";
import type { LanguagePack, VerbEntry } from "../src/types.ts";

const pack = await loadPack("content/es.json");
const clone = () => structuredClone(pack) as LanguagePack;

const findings = lintPack(pack);
const errors = findings.filter((f) => f.severity === "error");
const review = findings.filter((f) => f.severity === "review");

/** Every rule the lint knows, so a new one cannot be added without a test. */
const RULES = [
  "duplicate-word-value",
  "verb-word-without-verb-entry",
  "present-stem-change-on-plural",
  "preterite-missing-stem-change",
  "subjunctive-gar-orthography",
  "subjunctive-car-orthography",
  "subjunctive-zar-orthography",
  "subjunctive-gar-ellos-takes-no-gu",
  "subjunctive-plural-diphthonged",
  "missing-future-stem",
] as const;

function fireWith(mutate: (p: LanguagePack) => void, rule: string): LintFinding[] {
  const broken = clone();
  mutate(broken);
  return lintPack(broken).filter((f) => f.rule === rule && f.severity === "error");
}

describe("the shipped pack is clean", () => {
  test("no errors", () => {
    expect(errors.map((f) => `${f.rule}: ${f.subject} — ${f.message}`)).toEqual([]);
  });

  test("review findings are only the orphan verb words, and there are few", () => {
    // Mentioning a verb inside a phrase without conjugating it is sometimes
    // right. The list stays short enough that a reader can disagree with it.
    expect(new Set(review.map((f) => f.rule))).toEqual(
      new Set(["verb-word-without-verb-entry"]),
    );
    expect(review.length).toBeLessThan(25);
  });
});

describe("every rule is reachable", () => {
  // The point of this file. A lint that cannot be shown to fire is worse than no
  // lint, because it reads as a safety net.
  const fired = new Set<string>();

  test("duplicate-word-value", () => {
    const found = fireWith((p) => {
      p.words.push({ ...p.words[0]!, id: "a-second-copy" });
    }, "duplicate-word-value");
    expect(found).toHaveLength(1);
    expect(found[0]!.message).toContain("a-second-copy");
    fired.add("duplicate-word-value");
  });

  test("verb-word-without-verb-entry is a review, not an error", () => {
    // Deliberately not in `fired`: it must never be an error, because mentioning
    // viajar in a phrase is legitimate.
    const broken = clone();
    broken.words.push({
      id: "nadar-x",
      value: "nadar",
      translations: { en: "to swim" },
      pos: "verb",
    });
    const found = lintPack(broken).filter((f) => f.subject === "nadar-x");
    expect(found).toHaveLength(1);
    expect(found[0]!.severity).toBe("review");
  });

  test("present-stem-change-on-plural", () => {
    const found = fireWith((p) => {
      const empezar = p.verbs.find((v) => v.id === "empezar")!;
      empezar.stemChanges!.present = {
        yo: "empiez",
        tu: "empiez",
        el: "empiez",
        nosotros: "empiez",
        vosotros: "empiez",
        ellos: "empiez",
      };
    }, "present-stem-change-on-plural");
    expect(found).toHaveLength(2);
    expect(found[0]!.message).toContain("empiezamos");
    fired.add("present-stem-change-on-plural");
  });

  test("preterite-missing-stem-change", () => {
    // The two real bugs it was written for: servir produced *servió* and
    // seguir produced *seguió*. Both looked like words.
    const found = fireWith((p) => {
      const servir = p.verbs.find((v) => v.id === "servir")!;
      delete servir.stemChanges!["preterite"];
    }, "preterite-missing-stem-change");
    expect(found).toHaveLength(2);
    expect(found.map((f) => f.message).join(" ")).toContain("servió");
    fired.add("preterite-missing-stem-change");
  });

  test("subjunctive-gar-orthography", () => {
    // Strip pagar's overrides and let it fall back to stem + endings. The -gar
    // insertion lives in the endings, so the fallback gives *pagemos* and
    // *pagéis* where Spanish has *paguemos* and *paguéis*.
    const found = fireWith((p) => {
      const pagar = p.verbs.find((v) => v.id === "pagar")!;
      delete pagar.irregular!["subjunctive"];
      delete pagar.stemChanges!["subjunctive"];
    }, "subjunctive-gar-orthography");
    expect(found.length).toBeGreaterThan(0);
    fired.add("subjunctive-gar-orthography");
  });

  test("subjunctive-car-orthography", () => {
    // The *explicemos* bug, where the engine was wrong and the test row right.
    const found = fireWith((p) => {
      delete p.verbs.find((v) => v.id === "explicar")!.stemChanges!["subjunctive"];
    }, "subjunctive-car-orthography");
    expect(found.map((f) => f.message).join(" ")).toContain("explicemos");
    fired.add("subjunctive-car-orthography");
  });

  test("subjunctive-zar-orthography", () => {
    // The *empemos* bug: z -> c before e, which lands on the two plurals.
    const found = fireWith((p) => {
      const empezar = p.verbs.find((v) => v.id === "empezar")!;
      empezar.stemChanges!.subjunctive = {
        yo: "empiec",
        tu: "empiec",
        el: "empiec",
        nosotros: "emp",
        vosotros: "emp",
        ellos: "empiec",
      };
    }, "subjunctive-zar-orthography");
    expect(found.map((f) => f.message).join(" ")).toContain("empemos");
    fired.add("subjunctive-zar-orthography");
  });

  test("subjunctive-gar-ellos-takes-no-gu", () => {
    const found = fireWith((p) => {
      p.verbs.find((v) => v.id === "pagar")!.irregular!["subjunctive"] = {
        yo: "pague",
        tu: "pagues",
        el: "pague",
        nosotros: "paguemos",
        vosotros: "paguéis",
        ellos: "paguen",
      };
    }, "subjunctive-gar-ellos-takes-no-gu");
    expect(found).toHaveLength(1);
    expect(found[0]!.message).toContain("paguen");
    fired.add("subjunctive-gar-ellos-takes-no-gu");
  });

  test("missing-future-stem", () => {
    // The *encontré* bug: the future was its own preterite, for 34 of 60 verbs.
    const found = fireWith((p) => {
      delete p.verbs.find((v) => v.id === "encontrar")!.stemByTense!["future"];
    }, "missing-future-stem");
    expect(found).toHaveLength(1);
    expect(found[0]!.message).toContain("encontraré");
    fired.add("missing-future-stem");
  });

  test("subjunctive-plural-diphthonged", () => {
    // The three real bugs: *quieramos*, *puedamos* and *nos despiertemos*. An
    // -ar or -er verb carries the diphthong on the singular and ellos only, so
    // a stem that is uniform across all six is wrong for the two plurals.
    const found = fireWith((p) => {
      // Make each of them uniform again, which is the shape the rule exists to
      // catch: the diphthonged stem applied to all six personae.
      for (const id of ["querer", "poder", "despertarse"]) {
        const verb = p.verbs.find((v) => v.id === id)!;
        const diphthonged = verb.stemChanges!.subjunctive!["el"]!;
        verb.stemChanges!.subjunctive = {
          yo: diphthonged,
          tu: diphthonged,
          el: diphthonged,
          nosotros: diphthonged,
          vosotros: diphthonged,
          ellos: diphthonged,
        };
      }
    }, "subjunctive-plural-diphthonged");
    // Two findings per verb: one for each plural the diphthong must not reach.
    expect(found).toHaveLength(6);
    expect([...new Set(found.map((f) => f.subject))].sort()).toEqual([
      "despertarse",
      "poder",
      "querer",
    ]);
    fired.add("subjunctive-plural-diphthonged");
  });

  test("every error rule has a test above", () => {
    expect([...fired].sort()).toEqual(RULES.filter((r) => r !== "verb-word-without-verb-entry").sort());
  });
});

describe("the rules do not fire on correct data", () => {
  // The half that constrains the rules. A false positive would show up here.

  test("a correct -ir stem changer passes", () => {
    for (const id of ["dormir", "sentir", "pedir", "servir", "seguir"]) {
      const found = lintPack(clone()).filter(
        (f) => f.rule === "preterite-missing-stem-change" && f.subject === id,
      );
      expect(found, id).toEqual([]);
    }
  });

  test("a fully irregular preterite passes, like venir -> vino", () => {
    // venir has no preterite stem change at all, and needs none: its preterite
    // is irregular throughout. Matching the diphthong as a substring used to
    // false-positive here, and on dormir's durmió.
    const venir = pack.verbs.find((v) => v.id === "venir")!;
    expect(venir.stemChanges?.["preterite"]).toBeUndefined();
    expect(venir.irregular?.["preterite"]).toBeDefined();
  });

  test("a redundant plural stem entry is not a finding", () => {
    // empezar lists nosotros and vosotros with the plain stem. That is noise in
    // the data, not an error, and flagging it would train a reader to ignore the
    // rule.
    const empezar = pack.verbs.find((v) => v.id === "empezar")!;
    expect(empezar.stemChanges!.present!["nosotros"]).toBe(empezar.stem);
    expect(lintPack(clone()).filter((f) => f.rule === "present-stem-change-on-plural")).toEqual([]);
  });

  test("an -ar or -er verb is out of scope for the preterite rule", () => {
    // contar drops the diphthong in the preterite -- contó, contaron -- so it must
    // never be flagged.
    const contar = pack.verbs.find((v) => v.id === "contar")!;
    expect(contar.pattern).toBe("ar");
    const found = fireWith((p) => {
      delete p.verbs.find((v) => v.id === "contar")!.stemChanges!["preterite"];
    }, "preterite-missing-stem-change");
    expect(found.filter((f) => f.subject === "contar")).toEqual([]);
  });

  test("a g-insertion verb is not a diphthong problem", () => {
    // tener's stem is "teng" for all six, which is correct: tenga, tengas,
    // tenga, TENGAMOS, tengáis, tengan. The first version of this rule compared
    // the plural against the plain stem and flagged twenty-six of these.
    const found = lintPack(clone()).filter(
      (f) => f.rule === "subjunctive-plural-diphthonged",
    );
    expect(found).toEqual([]);
    expect(pack.verbs.find((v) => v.id === "tener")!.stemChanges!.subjunctive!["nosotros"]).toBe("teng");
  });

  test("an -ir verb is out of scope for the diphthong rule", () => {
    // dormir keeps its diphthong in the subjunctive plural (duermamos) while
    // sentir changes to i (sintamos). No single rule covers both.
    const found = fireWith((p) => {
      for (const id of ["dormir", "sentir"]) {
        const verb = p.verbs.find((v) => v.id === id)!;
        const one = verb.stemChanges!.subjunctive!["el"]!;
        verb.stemChanges!.subjunctive = Object.fromEntries(
          Object.keys(verb.stemChanges!.subjunctive!).map((k) => [k, one]),
        ) as Record<string, string>;
      }
    }, "subjunctive-plural-diphthonged");
    expect(found).toEqual([]);
  });

  test("a non-ar verb is out of scope for the spelling rules", () => {
    // poder is -er: its subjunctive is *pueda* and no qu or c rule applies.
    const found = fireWith((p) => {
      delete p.verbs.find((v) => v.id === "poder")!.stemChanges!["subjunctive"];
    }, "subjunctive-gar-orthography");
    expect(found).toEqual([]);
  });

  test("every verb's future yo comes from its infinitive, not its stem", () => {
    // The nine shortened futures are a documented exception.
    const shortened = new Set([
      "tener",
      "poder",
      "hacer",
      "decir",
      "salir",
      "venir",
      "poner",
      "saber",
      "querer",
    ]);
    for (const verb of pack.verbs) {
      if (shortened.has(verb.id)) continue;
      const base = verb.reflexivePronouns ? verb.infinitive.replace(/se$/, "") : verb.infinitive;
      expect(verb.stemByTense?.["future"], verb.id).toBe(base);
    }
  });

  test("a verb entry and a word entry for the same verb is fine", () => {
    // estudiar, dormir, sentir and pedir are deliberately in both arrays: the
    // learner gets a flashcard and a conjugation table.
    for (const id of ["estudiar", "dormir", "sentir", "pedir"]) {
      expect(pack.words.some((w) => w.value === id), id).toBe(true);
      expect(pack.verbs.some((v) => v.infinitive === id), id).toBe(true);
    }
  });

  test("the lint is not silently empty", () => {
    // Cheap guard against someone stubbing the body out and keeping the tests.
    const probe = clone() as LanguagePack;
    const verb = probe.verbs[0] as VerbEntry;
    verb.stemByTense = {};
    expect(lintPack(probe).length).toBeGreaterThan(0);
  });
});
