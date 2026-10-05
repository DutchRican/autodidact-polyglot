import { describe, expect, test } from "bun:test";
import { loadPack } from "../src/engine/content.ts";
import { conjugate, conjugateAll } from "../src/engine/conjugation.ts";

/**
 * Golden tables.
 *
 * The engine will happily generate "queres" or "deces" from a verb that only
 * marks its yo-form irregular, because nothing in the data says otherwise. Every
 * verb in the pack is therefore pinned here to its correct present-tense table.
 * Adding a verb means adding its row: the test fails until the data says what
 * the verb actually does.
 */

const pack = await loadPack("content/es.json");

const PERSONAE = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"] as const;

const TABLES: Record<string, string[]> = {
  // regular
  hablar: ["hablo", "hablas", "habla", "hablamos", "habláis", "hablan"],
  estudiar: ["estudio", "estudias", "estudia", "estudiamos", "estudiáis", "estudian"],
  comer: ["como", "comes", "come", "comemos", "coméis", "comen"],
  vivir: ["vivo", "vives", "vive", "vivimos", "vivís", "viven"],
  leer: ["leo", "lees", "lee", "leemos", "leéis", "leen"],

  // fully irregular
  ser: ["soy", "eres", "es", "somos", "sois", "son"],
  estar: ["estoy", "estás", "está", "estamos", "estáis", "están"],
  ir: ["voy", "vas", "va", "vamos", "vais", "van"],

  // g-insertion on yo only
  tener: ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"],
  hacer: ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"],
  poner: ["pongo", "pones", "pone", "ponemos", "ponéis", "ponen"],
  salir: ["salgo", "sales", "sale", "salimos", "salís", "salen"],
  saber: ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"],

  // e -> ie stem change on tu / el / ellos, plus a changed yo
  querer: ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"],
  poder: ["puedo", "puedes", "puede", "podemos", "podéis", "pueden"],
  venir: ["vengo", "vienes", "viene", "venimos", "venís", "vienen"],

  // e -> i stem change, plus three fully irregular forms
  decir: ["digo", "dices", "dice", "decimos", "decís", "dicen"],

  // no pattern survives the endings: vosotros takes no accent
  ver: ["veo", "ves", "ve", "vemos", "veis", "ven"],

  // dar is irregular in yo and takes an unaccented vosotros
  dar: ["doy", "das", "da", "damos", "dais", "dan"],

  // reflexives: the pronoun rides along with the form
  levantarse: ["me levanto", "te levantas", "se levanta", "nos levantamos", "os levantáis", "se levantan"],
  ducharse: ["me ducho", "te duchas", "se ducha", "nos duchamos", "os ducháis", "se duchan"],
  acostarse: ["me acuesto", "te acuestas", "se acuesta", "nos acostamos", "os acostáis", "se acuestan"],
  quedarse: ["me quedo", "te quedas", "se queda", "nos quedamos", "os quedáis", "se quedan"],

  // stem-changing -ir: e becomes ie in four personae
  dormir: ["duermo", "duermes", "duerme", "dormimos", "dormís", "duermen"],
  pedir: ["pido", "pides", "pide", "pedimos", "pedís", "piden"],
  sentir: ["siento", "sientes", "siente", "sentimos", "sentís", "sienten"],
};

describe("present tense tables", () => {
  const tables = (id: string): string[] => {
    const verb = pack.verbs.find((v) => v.id === id);
    if (!verb) throw new Error(`verb ${id} is not in the pack`);
    return PERSONAE.map((p) => conjugate(verb, pack.conjugation, "present").forms[p] ?? "");
  };

  for (const [id, expected] of Object.entries(TABLES)) {
    test(id, () => {
      expect(tables(id)).toEqual(expected);
    });
  }

  test("every verb in the pack is pinned by a golden table", () => {
    // A new verb with no expected row would sail through unnoticed.
    const unpinned = pack.verbs.filter((v) => !(v.id in TABLES)).map((v) => v.id);
    expect(unpinned).toEqual([]);
  });
});

/**
 * Past tenses. The preterite is regular for -ar/-er/-ir except for a long list
 * of high-frequency verbs; the imperfect is regular except ser, ir and ver.
 */
const PRETERITE: Record<string, string[]> = {
  // regular
  hablar: ["hablé", "hablaste", "habló", "hablamos", "hablasteis", "hablaron"],
  comer: ["comí", "comiste", "comió", "comimos", "comisteis", "comieron"],
  vivir: ["viví", "viviste", "vivió", "vivimos", "vivisteis", "vivieron"],
  estudiar: ["estudié", "estudiaste", "estudió", "estudiamos", "estudiasteis", "estudiaron"],

  // fully irregular, and ser/ir are identical here
  ser: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
  ir: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
  estar: ["estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron"],
  tener: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"],
  hacer: ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"],
  decir: ["dije", "dijiste", "dijo", "dijimos", "dijisteis", "dijeron"],
  poder: ["pude", "pudiste", "pudo", "pudimos", "pudisteis", "pudieron"],
  poner: ["puse", "pusiste", "puso", "pusimos", "pusisteis", "pusieron"],
  venir: ["vine", "viniste", "vino", "vinimos", "vinisteis", "vinieron"],
  ver: ["vi", "viste", "vio", "vimos", "visteis", "vieron"],
  dar: ["di", "diste", "dio", "dimos", "disteis", "dieron"],
  saber: ["supe", "supiste", "supo", "supimos", "supisteis", "supieron"],
  querer: ["quise", "quisiste", "quiso", "quisimos", "quisisteis", "quisieron"],
  salir: ["salí", "saliste", "salió", "salimos", "salisteis", "salieron"],
  // regular-looking and then not: leí, leíste, leyó, leímos, leísteis, leyeron
  leer: ["leí", "leíste", "leyó", "leímos", "leísteis", "leyeron"],

  // stem-changing -ir: only él and ellos move in the preterite
  dormir: ["dormí", "dormiste", "durmió", "dormimos", "dormisteis", "durmieron"],
  pedir: ["pedí", "pediste", "pidió", "pedimos", "pedisteis", "pidieron"],
  sentir: ["sentí", "sentiste", "sintió", "sentimos", "sentisteis", "sintieron"],

  // reflexives take the regular endings with the pronoun in front
  levantarse: [
    "me levanté",
    "te levantaste",
    "se levantó",
    "nos levantamos",
    "os levantasteis",
    "se levantaron",
  ],
};

const IMPERFECT: Record<string, string[]> = {
  hablar: ["hablaba", "hablabas", "hablaba", "hablábamos", "hablabais", "hablaban"],
  comer: ["comía", "comías", "comía", "comíamos", "comíais", "comían"],
  // -er and -ir are identical in the imperfect
  vivir: ["vivía", "vivías", "vivía", "vivíamos", "vivíais", "vivían"],
  // the only three irregulars
  ser: ["era", "eras", "era", "éramos", "erais", "eran"],
  ir: ["iba", "ibas", "iba", "íbamos", "ibais", "iban"],
  ver: ["veía", "veías", "veía", "veíamos", "veíais", "veían"],
};

describe("past tense tables", () => {
  const forms = (id: string, tense: string): string[] => {
    const verb = pack.verbs.find((v) => v.id === id);
    if (!verb) throw new Error(`verb ${id} is not in the pack`);
    return PERSONAE.map((p) => conjugate(verb, pack.conjugation, tense).forms[p] ?? "");
  };

  for (const [id, expected] of Object.entries(PRETERITE)) {
    test(`preterite ${id}`, () => {
      expect(forms(id, "preterite")).toEqual(expected);
    });
  }

  for (const [id, expected] of Object.entries(IMPERFECT)) {
    test(`imperfect ${id}`, () => {
      expect(forms(id, "imperfect")).toEqual(expected);
    });
  }

  test("ser and ir share the preterite but not the imperfect", () => {
    expect(forms("ser", "preterite")).toEqual(forms("ir", "preterite"));
    expect(forms("ser", "imperfect")).not.toEqual(forms("ir", "imperfect"));
  });

  test("the imperfect has no stem changes, only three irregular verbs", () => {
    // If a new verb ever claims an irregular imperfect, pin it here first.
    const irregular = pack.verbs
      .filter((v) => v.irregular?.imperfect)
      .map((v) => v.id)
      .sort();
    expect(irregular).toEqual(["ir", "ser", "ver"]);
  });

  test("stem-changing -ir verbs move only the third person in the preterite", () => {
    for (const [id, changed, unchanged] of [
      ["dormir", "durm", "dorm"],
      ["pedir", "pid", "ped"],
      ["sentir", "sint", "sent"],
    ] as const) {
      const verb = pack.verbs.find((v) => v.id === id)!;
      const table = conjugate(verb, pack.conjugation, "preterite");
      expect(table.forms["el"]).toStartWith(changed);
      expect(table.forms["ellos"]).toStartWith(changed);
      expect(table.forms["yo"]).toStartWith(unchanged);
      expect(table.forms["nosotros"]).toStartWith(unchanged);
      // Only él andellos are flagged in the preterite. The same verbs change
      // four personae in the present, which the table can also highlight.
      expect(Object.keys(table.irregularForms).sort()).toEqual(["el", "ellos"]);
      const present = conjugate(verb, pack.conjugation, "present");
      expect(Object.keys(present.irregularForms).sort()).toEqual(["el", "ellos", "tu", "yo"]);
    }
  });
});

describe("tense selection", () => {
  test("conjugateAll defaults to every tense in the pack", () => {
    const verb = pack.verbs.find((v) => v.id === "hablar")!;
    expect(Object.keys(conjugateAll(verb, pack.conjugation))).toEqual([
      "present",
      "preterite",
      "imperfect",
    ]);
  });

  test("conjugateAll can be pinned to a subset, preserving the given order", () => {
    const verb = pack.verbs.find((v) => v.id === "hablar")!;
    expect(Object.keys(conjugateAll(verb, pack.conjugation, ["present"]))).toEqual(["present"]);
    expect(Object.keys(conjugateAll(verb, pack.conjugation, ["imperfect", "present"]))).toEqual([
      "imperfect",
      "present",
    ]);
  });

  test("early lessons are pinned to the present so the past does not leak", () => {
    // Chapter 1 and 2 teach the present only; a preterite table three chapters
    // early is a spoiler, not a feature.
    for (const chapter of pack.chapters.filter(
      (c) => (c.status ?? "published") === "published" && c.order <= 2,
    )) {
      for (const lesson of chapter.lessons) {
        for (const section of lesson.sections) {
          if (section.type !== "conjugation") continue;
          expect(section.tenses).toEqual(["present"]);
        }
      }
    }
  });
});

describe("stem changes and reflexives are flagged", () => {
  test("querer's changed forms are marked irregular in the table", () => {
    const verb = pack.verbs.find((v) => v.id === "querer")!;
    const table = conjugate(verb, pack.conjugation, "present");
    expect(table.irregularForms["tu"]).toBe("stem-change");
    expect(table.irregularForms["nosotros"]).toBeUndefined();
  });

  test("regular verbs have no irregular forms at all", () => {
    for (const id of ["hablar", "comer", "vivir", "leer", "estudiar"]) {
      const verb = pack.verbs.find((v) => v.id === id)!;
      expect(conjugate(verb, pack.conjugation, "present").irregularForms).toEqual({});
    }
  });

  test("reflexive verbs carry a pronoun for every persona", () => {
    for (const id of ["levantarse", "ducharse", "acostarse", "quedarse"]) {
      const verb = pack.verbs.find((v) => v.id === id)!;
      const table = conjugate(verb, pack.conjugation, "present");
      for (const persona of PERSONAE) {
        expect(verb.reflexivePronouns?.[persona]).toBeTruthy();
        expect(table.forms[persona]).toContain(" ");
      }
      // él and ellos share "se", which is correct, not a data error.
      expect(table.forms["el"]).toStartWith("se ");
      expect(table.forms["ellos"]).toStartWith("se ");
    }
  });

  test("a verb with no reflexives has no pronouns", () => {
    const verb = pack.verbs.find((v) => v.id === "hablar")!;
    expect(verb.reflexivePronouns).toBeUndefined();
  });
});
