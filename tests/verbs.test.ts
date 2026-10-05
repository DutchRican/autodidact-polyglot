import { describe, expect, test } from "bun:test";
import { loadPack } from "../src/engine/content.ts";
import { conjugate } from "../src/engine/conjugation.ts";

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
