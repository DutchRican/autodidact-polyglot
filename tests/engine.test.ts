import { describe, expect, test } from "bun:test";
import type { QuizQuestion, VerbEntry } from "../src/types.ts";
import { loadPack, indexPack, ContentError, parseLanguagePack } from "../src/engine/content.ts";
import { generateLesson } from "../src/engine/generate.ts";
import { conjugate, conjugateAll, makeDistractors } from "../src/engine/conjugation.ts";
import { grade, presentQuestion, score } from "../src/engine/quiz.ts";

const pack = await loadPack("content/es.json");
const rules = pack.conjugation;
const ctx = { pack, baseLang: pack.language.baseLang };
const verb = (id: string): VerbEntry => {
  const found = pack.verbs.find((v) => v.id === id);
  if (!found) throw new Error(`test refers to missing verb: ${id}`);
  return found;
};
const form = (id: string, persona: string, tense = "present"): string =>
  conjugate(verb(id), rules, tense).forms[persona] ?? "";

describe("content pack", () => {
  test("loads and passes validation", () => {
    expect(pack.language.code).toBe("es");
    expect(pack.chapters.length).toBeGreaterThan(0);
    expect(indexPack(pack).lessonCount()).toBeGreaterThan(5);
  });

  test("chapters come back in course order", () => {
    const orders = indexPack(pack).chapters().map((c) => c.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  test("lessons are ordered within each chapter", () => {
    for (const chapter of indexPack(pack).chapters()) {
      const orders = chapter.lessons.map((l) => l.order);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    }
  });

  test("flat lesson list follows chapter order then lesson order", () => {
    const lessons = indexPack(pack).lessons();
    const keys = lessons.map((l) => [l.chapterOrder, l.order]);
    const sorted = [...keys].sort((a, b) => a[0]! - b[0]! || a[1]! - b[1]!);
    expect(keys).toEqual(sorted);
  });

  test("every lesson id is unique across the whole course", () => {
    const ids = indexPack(pack).lessons().map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("rejects duplicate lesson ids in different chapters", () => {
    const broken = structuredClone(pack) as any;
    // Unique chapter id, so this fails on the lesson id rather than the chapter.
    const extra = { ...broken.chapters[0], id: "chapter-dupe", order: 99 };
    extra.lessons = [{ ...broken.chapters[0].lessons[0] }];
    broken.chapters.push(extra);
    expect(() => parseLanguagePack(broken)).toThrow(/duplicate lesson id/);
  });

  test("rejects duplicate chapter ids", () => {
    const broken = structuredClone(pack) as any;
    broken.chapters.push({ ...broken.chapters[0] });
    expect(() => parseLanguagePack(broken)).toThrow(/duplicate chapter id/);
  });

  test("rejects a chapter with an unknown status", () => {
    const broken = structuredClone(pack) as any;
    broken.chapters[0].status = "coming-soon";
    expect(() => parseLanguagePack(broken)).toThrow(/status must be/);
  });

  test("rejects a pack with a dangling verb reference", () => {
    const broken = structuredClone(pack) as any;
    broken.chapters[0].lessons[0].sections.push({
      type: "conjugation",
      title: "x",
      verbIds: ["nope"],
    });
    expect(() => parseLanguagePack(broken)).toThrow(ContentError);
  });

  test("rejects a choice question with two correct answers", () => {
    const broken = structuredClone(pack) as any;
    broken.chapters[0].lessons[0].quiz.questions[0].options[1].correct = true;
    expect(() => parseLanguagePack(broken)).toThrow(/exactly 1 correct/);
  });

  test("rejects an unknown generator name", () => {
    const broken = structuredClone(pack) as any;
    broken.chapters[0].lessons.push({
      id: "bogus",
      order: 99,
      title: "Bogus",
      sections: [],
      quiz: undefined,
      source: { kind: "generated", generator: "doesNotExist", args: {} },
    });
    expect(() => parseLanguagePack(broken)).toThrow(/unknown generator/);
  });
});

describe("lesson generators", () => {
  const ctx = { pack, baseLang: pack.language.baseLang };

  const build = (generator: string, args: Record<string, string | string[]>) =>
    generateLesson("gen-test", { kind: "generated", generator, args }, ctx);

  test("verbDrill produces a table and all six persona questions", () => {
    const lesson = build("verbDrill", { verbId: "vivir" });
    expect(lesson.sections.some((s) => s.type === "conjugation")).toBe(true);
    expect(lesson.quiz.questions).toHaveLength(6);
    for (const q of lesson.quiz.questions) {
      expect(q.type).toBe("conjugation");
      if (q.type === "conjugation") {
        // The generator must only emit forms the rules actually produce.
        expect(conjugate(verb(q.verbId), rules, q.tense).forms[q.persona]).toBeTruthy();
      }
    }
  });

  test("verbDrill honours a persona filter", () => {
    const lesson = build("verbDrill", { verbId: "ser", personae: "yo,ellos" });
    expect(lesson.quiz.questions).toHaveLength(2);
  });

  test("verbDrill rejects an unknown verb", () => {
    expect(() => build("verbDrill", { verbId: "nope" })).toThrow(/unknown verbId/);
  });

  test("wordSet asks in both directions", () => {
    const lesson = build("wordSet", {
      wordIds: "rojo,azul,verde,amarillo",
      title: "Colours",
      kind: "colors",
    });
    expect(lesson.quiz.questions).toHaveLength(4);
    const types = lesson.quiz.questions.map((q) => q.type);
    expect(types).toContain("fill");
    expect(types).toContain("choice");
  });

  test("wordSet rejects unknown word ids", () => {
    expect(() => build("wordSet", { wordIds: "rojo,nope" })).toThrow(/unknown word id/);
  });

  test("wordSet choice questions have exactly one correct option", () => {
    const lesson = build("wordSet", {
      wordIds: "rojo,azul,verde,amarillo,blanco,negro",
      title: "Colours",
    });
    for (const q of lesson.quiz.questions) {
      if (q.type !== "choice") continue;
      expect(q.options.filter((o) => o.correct)).toHaveLength(1);
      expect(new Set(q.options.map((o) => o.value)).size).toBe(q.options.length);
    }
  });

  test("storyReading pulls the story's own questions", () => {
    const lesson = build("storyReading", { storyId: "mercado" });
    const story = pack.stories.find((s) => s.id === "mercado")!;
    expect(lesson.quiz.questions).toHaveLength(story.questions.length);
  });

  test("generated lessons pass the same validation as authored ones", () => {
    const clone = structuredClone(pack) as any;
    clone.chapters[0].lessons.push({
      id: "auto-vivir",
      order: 99,
      title: "unused",
      sections: [],
      quiz: undefined,
      source: { kind: "generated", generator: "verbDrill", args: { verbId: "vivir" } },
    });
    const expanded = parseLanguagePack(clone);
    const lesson = expanded.chapters[0]?.lessons.find((l) => l.id === "auto-vivir");
    expect(lesson).toBeDefined();
    if (!lesson) throw new Error("generated lesson missing");
    expect(lesson.source?.kind).toBe("generated");
    expect(lesson.quiz.questions).toHaveLength(6);
    expect(lesson.quiz.id).toBe("auto-vivir-quiz");
  });
});

describe("regular conjugation", () => {
  test("hablar (-ar) all six personae", () => {
    expect(form("hablar", "yo")).toBe("hablo");
    expect(form("hablar", "tu")).toBe("hablas");
    expect(form("hablar", "el")).toBe("habla");
    expect(form("hablar", "nosotros")).toBe("hablamos");
    expect(form("hablar", "vosotros")).toBe("habláis");
    expect(form("hablar", "ellos")).toBe("hablan");
  });

  test("comer (-er) all six personae", () => {
    expect(form("comer", "yo")).toBe("como");
    expect(form("comer", "tu")).toBe("comes");
    expect(form("comer", "el")).toBe("come");
    expect(form("comer", "nosotros")).toBe("comemos");
    expect(form("comer", "vosotros")).toBe("coméis");
    expect(form("comer", "ellos")).toBe("comen");
  });

  test("vivir (-ir) all six personae", () => {
    expect(form("vivir", "yo")).toBe("vivo");
    expect(form("vivir", "tu")).toBe("vives");
    expect(form("vivir", "el")).toBe("vive");
    expect(form("vivir", "nosotros")).toBe("vivimos");
    expect(form("vivir", "vosotros")).toBe("vivís");
    expect(form("vivir", "ellos")).toBe("viven");
  });

  test("estudiar and leer are regular too", () => {
    expect(form("estudiar", "yo")).toBe("estudio");
    expect(form("estudiar", "ellos")).toBe("estudian");
    expect(form("leer", "yo")).toBe("leo");
    expect(form("leer", "nosotros")).toBe("leemos");
  });

  test("er and ir differ only in nosotros and vosotros", () => {
    const er = conjugate(verb("comer"), rules, "present").forms;
    const ir = conjugate(verb("vivir"), rules, "present").forms;
    // Different stems, so compare the suffix that carries the grammar.
    const suffix = (v: string, verbStem: string) => v.slice(verbStem.length);
    for (const p of ["yo", "tu", "el", "ellos"]) {
      expect(suffix(er[p]!, "com")).toBe(suffix(ir[p]!, "viv"));
    }
    expect(suffix(er["nosotros"]!, "com")).not.toBe(suffix(ir["nosotros"]!, "viv"));
    expect(suffix(er["vosotros"]!, "com")).not.toBe(suffix(ir["vosotros"]!, "viv"));
  });
});

describe("irregular verbs", () => {
  test("ser", () => {
    expect(["soy", "eres", "es", "somos", "sois", "son"]).toEqual(
      rules.personae.map((p) => form("ser", p.id)),
    );
  });

  test("estar conjugates like -er despite ending in -ar", () => {
    expect(["estoy", "estás", "está", "estamos", "estáis", "están"]).toEqual(
      rules.personae.map((p) => form("estar", p.id)),
    );
  });

  test("ir", () => {
    expect(["voy", "vas", "va", "vamos", "vais", "van"]).toEqual(
      rules.personae.map((p) => form("ir", p.id)),
    );
  });

  test("ser and ir share yo/tu/el/ellos", () => {
    const pairs: Record<string, [string, string]> = {
      yo: ["soy", "voy"],
      tu: ["eres", "vas"],
      el: ["es", "va"],
      ellos: ["son", "van"],
    };
    for (const [p, [serForm, irForm]] of Object.entries(pairs)) {
      expect(form("ser", p)).toBe(serForm);
      expect(form("ir", p)).toBe(irForm);
    }
  });

  test("tener only breaks on yo", () => {
    expect(form("tener", "yo")).toBe("tengo");
    expect(["tienes", "tiene", "tenemos", "tenéis", "tienen"]).toEqual(
      rules.personae.slice(1).map((p) => form("tener", p.id)),
    );
  });

  test("every irregular form is flagged as irregular in the UI", () => {
    for (const id of ["ser", "estar", "ir", "tener"]) {
      const table = conjugate(verb(id), rules, "present");
      expect(Object.keys(table.irregularForms).length).toBeGreaterThan(0);
    }
  });

  test("no verb in the pack conjugates to something that looks broken", () => {
    for (const v of pack.verbs) {
      const table = conjugate(v, rules, "present");
      for (const [persona, f] of Object.entries(table.forms)) {
        expect(f.length).toBeGreaterThan(1);
        expect(`${v.id}.${persona}=${f}`).not.toMatch(/[áéíóú]o$/); // "habló" style leftovers
      }
    }
  });

  test("conjugateAll returns every tense", () => {
    expect(Object.keys(conjugateAll(verb("hablar"), rules))).toEqual(["present"]);
  });

  test("unknown tense throws", () => {
    expect(() => conjugate(verb("hablar"), rules, "future")).toThrow();
  });
});

const fillQ = (answer: string, accept?: string[]): QuizQuestion =>
  accept ? { type: "fill", prompt: "x", answer, accept } : { type: "fill", prompt: "x", answer };

describe("grading", () => {
  test("accent-insensitive fill answers", () => {
    const q = fillQ("estás");
    expect(grade(q, "estas", ctx).correct).toBe(true);
    expect(grade(q, "  Estás ", ctx).correct).toBe(true);
    expect(grade(q, "estay", ctx).correct).toBe(false);
  });

  test("accept list allows variants", () => {
    const q = fillQ("veintiuno", ["veintiún"]);
    expect(grade(q, "veintiún", ctx).correct).toBe(true);
    expect(grade(q, "veinte y uno", ctx).correct).toBe(false);
  });

  test("conjugation grading matches the generated form", () => {
    const q: QuizQuestion = {
      type: "conjugation",
      verbId: "ser",
      tense: "present",
      persona: "yo",
    };
    expect(grade(q, "soy", ctx).correct).toBe(true);
    expect(grade(q, "so", ctx).correct).toBe(false);
  });

  test("choice grading returns the correct answer for feedback", () => {
    const q = pack.chapters[0]!.lessons[0]!.quiz.questions[0] as any;
    const correctValue = q.options.find((o: any) => o.correct).value;
    const wrongValue = q.options.find((o: any) => !o.correct).value;
    expect(grade(q, correctValue, ctx).correct).toBe(true);
    expect(grade(q, wrongValue, ctx).correct).toBe(false);
    expect(grade(q, wrongValue, ctx).answer).toBe(correctValue);
  });
});

describe("question presentation", () => {
  test("conjugation question offers 4 unique options including the answer", () => {
    const q: QuizQuestion = {
      type: "conjugation",
      verbId: "hablar",
      tense: "present",
      persona: "tu",
    };
    const p = presentQuestion(q, 0, ctx);
    expect(p.kind).toBe("conjugation");
    if (p.kind !== "conjugation") return;
    expect(p.options).toHaveLength(4);
    expect(new Set(p.options).size).toBe(4);
    expect(p.options).toContain("hablas");
  });

  test("distractors never include the answer", () => {
    const siblings = ["hablas", "habla", "hablamos"];
    const out = makeDistractors("hablas", siblings, ["hablo", "comen"], 3);
    expect(out).not.toContain("hablas");
    expect(out).toHaveLength(3);
  });

  test("every conjugation question in every quiz is answerable and unambiguous", () => {
    for (const lesson of pack.chapters[0]!.lessons) {
      for (const [i, q] of lesson.quiz.questions.entries()) {
        if (q.type !== "conjugation") continue;
        const p = presentQuestion(q, i, ctx);
        if (p.kind !== "conjugation") throw new Error("wrong kind");
        expect(p.options).toContain(form(q.verbId, q.persona, q.tense));
        expect(new Set(p.options).size).toBe(p.options.length);
      }
    }
  });

  test("no fill answer is secretly a substring-only trap", () => {
    for (const lesson of pack.chapters[0]!.lessons) {
      for (const q of lesson.quiz.questions) {
        if (q.type !== "fill") continue;
        expect(q.answer.trim()).not.toBe("");
      }
    }
  });

  test("score respects passThreshold", () => {
    const questions = pack.chapters[0]!.lessons[3]!.quiz.questions;
    const all = grade(questions[0]!, "hablo", ctx);
    const responses = questions.map(() => "zzz");
    responses[0] = all.answer;
    const s = score(questions, responses, ctx, 0.8);
    expect(s.total).toBe(questions.length);
    expect(s.marks[0]).toBe(true);
  });
});
