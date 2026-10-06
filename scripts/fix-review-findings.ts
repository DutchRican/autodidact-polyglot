#!/usr/bin/env bun
// One-off content fixes from the linguistics review. Kept for reference.
import { readFileSync, writeFileSync } from "fs";

const PATH = "content/es.json";
const raw = readFileSync(PATH, "utf8");
const text = raw;

const subs: Array<[string, string, number?]> = [
  // ch3 numbers
  ["ciento lápises", "cien lápices"],
  ["'ciento' shortens before a noun: ciento veinte (120), ciento cien lápices.", "'cien' replaces 'ciento' before a noun: cien lápices."],
  // quinientas mil
  ["quinientas mil", "quinientos mil"],
  // profesor
  ["Soy professor.", "Soy profesor."],
  // Soy en Londres
  ["So: Soy en Londres. (I live in London.)", "So: Soy de Londres. (I am from London.)"],
  // Neva
  ["Neva.", "Nieva."],
  ["¿Neva?", "¿Nieva?"],
  // Está soleado in weather body
  ["Llueve. Nieva. Está nublado. Está soleado.", "Llueve. Nieva. Está nublado. Hace sol."],
  // delgado ajuste: vivía->vivirá
  ["vivía, viviremos", "vivirá, viviremos"],
  // futuro/condicional claims
  ["First, el and ellos have the same form (hablará / hablarán)", "The endings attach to the whole infinitive: hablaré, hablarás, hablará, hablaremos, hablaréis, hablarán."],
  ["él and ellos share again (hablaría / hablarían)", "yo and él share: hablaría, hablaría."],
  ["Same stems as the future, different endings. There are no irregular conditionals at all.", "Same stems as the future, different endings."],
  // ch4-si
  ["REAL — the if-clause is present, the result is conditional:", "REAL — the if-clause is present, the result is future:"],
  ["HYPOTHETICAL — the if-clause is imperfect", "HYPOTHETICAL — the if-clause is imperfect subjunctive"],
  ["Real if-clauses: si + present, result in the conditional", "Real if-clauses: si + present, result in the future"],
  // prólogo si-clause garble check (ch4 body likely says 'It uses the same shape...')
  // imperfect subjunctive exam options
  ["{\"value\": \"the imperfect subjunctive\", \"correct\": true}", "{\"value\": \"the future tense\", \"correct\": true}"],
  ["{\"value\": \"vosotros, which chapter 10 teaches\", \"correct\": false}", "{\"value\": \"the conditional\", \"correct\": false}"],
  // st-planes
  ["Dentro de un mes empezará las vacaciones.", "Dentro de un mes empiezan las vacaciones."],
  ["Quizá trabajé, o quizá descansaré.", "Quizá trabaje, o quizá descanse."],
  // ch4-planes
  ["'I will come' can beiré or voy a ir", "'I will come' can be iré or voy a ir"],
  ["Notice quizá usually takes the conditional", "Notice quizá usually takes the subjunctive (it can take the indicative when the speaker is more certain)"],
  // hacer-y-otros
  ["1. 'ago', with a period of time. Note it is not a verb form you conjugate — hacer stays as it is. | Hace dos años que no lo veo. (I haven't seen him for two years.) | Hace mucho calor. (It's very hot.) | Hace falta. (It is needed.)", "1. 'ago', with a period of time. Note it is not a verb form you conjugate — hacer stays as it is. | Hace dos años que no lo veo. (I haven't seen him for two years.)"],
  // condicional/sharing quiz
  ["Why do él and ellos share a form in the future?", "Why do yo and él share a form in the conditional?"],
  // ch3 preterite regular
  ["Three endings carry almost all of it: -é/ió for yo and él, and -aste/iste for tú. The nosotros form is the bare stem.", "Three endings carry almost all of it: -é/ió for yo and él, and -aste/iste for tú. Nosotros still adds an ending: hablamos, comimos."],
  ["-e verbs and -er/-ir verbs differ", "-ar verbs and -er/-ir verbs differ"],
  // hablar-presente 'o'
  ["- 'o' covers yo, tú, él, nosotros, ellos.", "- 'o' covers yo only."],
  // colores
  ["negro → negros, blanco → blancas", "negro → negros, blanca → blancas"],
  // mercado story + quiz
  ["Hay muchas frutas: manzanas naranjas y plátanos.", "Hay muchas frutas: manzanas, naranjas y plátanos."],
  ["{\"value\": \"María's friend\", \"correct\": true}", "{\"value\": \"María's daughter\", \"correct\": true}"],
  // ch6-lectura-mercado note
  ["Note the plurals: Spanish keeps a noun singular after a number.", "Note the plurals: Spanish keeps the plural after numbers — dos kilos de naranjas, tres kilos de manzanas."],
  // st-el-mercado
  ["Tenemos pollo del ayer", "Tenemos pollo de ayer"],
  // ch6-comprar note
  ["Three of these change their stem as well as their yo form. Both changes are shown.", "Only encontrar and costar change their stem; only traer changes its yo form. Both changes are shown."],
  // lait / eau
  ["La leche. Feminine, but the singular takes el because of the pronounced e at the end. El leche. Only in the plural does it become normal: las leches.", "La leche. Feminine, without exception: la leche, las leches, una leche fría."],
  ["El agua. Feminine noun, masculine article, same reason.", "El agua. Feminine noun, masculine article only because it begins with a stressed a."],
  ["Two nouns break the article rule: la leche and el agua, both because of a pronounced final e.", "El agua breaks the article rule: la agua would be hard to say, so the singular takes el — but it stays feminine: el agua fría, las aguas."],
  // leche quiz option stays as distractor; but the "Why does la leche take el" fix
  ["Why does la leche take el in the singular?", "Why does el agua take el in the singular?"],
  ["A singular noun ending in a pronounced e takes el", "It begins with a stressed a"],
  // st-numeros
  ["— ¡Buenas tardes! ¿Qué desea?", "— ¡Buenos días! ¿Qué desea?"],
  // fechas
  ["es una hora (one o o'clock)", "es la una (one o'clock)"],
  // ch3 vocab note
  ["Notice que yesterday is always in the preterite.", "Notice that yesterday is always in the preterite."],
  // ch3 verano note
  ["(fui, nadábamos is imperfect — see if you can spot why each was chosen)", "(nadábamos is the imperfect one — see if you can spot why each was chosen)"],
  // ch2 repaso poner
  ["• hacer, dar, poner — doing and giving", "• hacer, dar — doing and giving, weather, and lights"],
  // mercado st manzanas fixed above; sin embargo
  // helado gloss
  ["\"value\": \"ice cold / iced\"", "\"value\": \"ice cream\""],
];

let out = text;
let missing: string[] = [];
for (const [a, b] of subs) {
  if (out.includes(a)) {
    out = out.split(a).join(b);
  } else {
    missing.push(a);
  }
}

// helado entry shape may differ; try gloss key
if (missing.some((m) => m.includes("ice cold"))) {
  out = out.replace(/"ice cold \/ iced"/g, "\"ice cream\"");
  if (out.includes("ice cream")) missing = missing.filter((m) => !m.includes("ice cold"));
}

// ch10 imperative: six -> eight + correct list
out = out.split("The one mood with no yo, and six exceptions").join("The one mood with no yo, and eight exceptions");
out = out.split("The six exceptions").join("The eight exceptions");
out = out.split('"left": "sé, está, ve, ten, da, ve"').join('"left": "ven, di, sal, haz, ten, ve, pon, sé"');
out = out.split("sé and dé take an accent, da and ve do not.").join("sé takes an accent so it is not confused with se; the rest do not take one.");
out = out.split("Which is NOT one of the six irregular imperatives?").join("Which is NOT one of the eight irregular imperatives?");
out = out.split("['sé, está, ten and da are").join("['sé, di, sal and haz are");

// examen counts
out = out.split("Twenty-two questions, and you need eighteen.").join("Twenty-three questions, and you need eighteen.");

// pronoun note
out = out.split("explotar").join("explotar"); // noop guard

// Era las once y media -> Eran
out = out.split("Era las once y media").join("Eran las once y media");
out = out.split("Era cinco minutos de las once").join("Eran las once menos cinco");
out = out.split("En cuanto marco el reloj").join("En cuanto marqué el reloj");
out = out.split("the first clause is an imperfect that will be completed later, the second is a preterite that completed it").join("a preterite boundary in the first clause, and the event in the second");

// No(work)é / no mattered
out = out.split("No(work)é porque llovía.").join("No trabajé porque llovía.");
out = out.split("Aunque no mattered, lo hice.").join("Aunque no importaba, lo hice.");

// SteméMeans
out = out.split("And SteméMeans hay is the reverse, taking ir in the present and estar in the past.").join("And hay is the reverse: it supplies no forms of its own, so the present is hay and the past is hubo and había.");
out = out.split('"prompt": "SteméMeans hay, present third person: ___"').join('"prompt": "\'Hay\' is the present third person of: ___"');

// fuego rápido
out = out.split("El fuego rápido no\ndebe hervir: si hierve, la verdura se deshace.").join("No dejes que hierva fuerte: si hierve, la verdura se deshace.");
out = out.split("El fuego rápido no debe hervir: si hierve, la verdura se deshace.").join("No dejes que hierva fuerte: si hierve, la verdura se deshace.");

// turna
out = out.split("La turna de noche").join("El turno de noche");
out = out.split("st-la-turna-de-noche").join("st-la-turna-de-noche"); // keep id

// LAritmo
out = out.split("en LAritmo\napropiado").join("en el ritmo\napropiado");
out = out.split("en LAritmo").join("en el ritmo");

// precise
out = out.split("A las seis precise.").join("A las seis en punto.");

// por la semana
out = out.split("Siempre se rompe por la semana.").join("Siempre se rompe entre semana.");

// Can que
out = out.split("Can que takes the subjunctive.").join("Puede que takes the subjunctive.");

// trabajé/descansaré
// ch7
out = out.split("trabajar en is where you work").join("trabajar en is where you work"); // noop
out = out.split("trabalhar en").join("trabajar en");
out = out.split("estudiar a + subject. Estudio a derecho, or just estudio derecho.").join("estudiar + subject, with no preposition. Estudio derecho, or just estudio.");
out = out.split("Aprendo français.").join("Aprendo francés.");
out = out.split("A dos is barely passing. A diez is perfect.").join("A dos is a clear fail. A cinco is the pass mark. A diez is perfect.");
out = out.split("He aprobado la examen — wrong twice. La examen is wrong, and á is a masculine article.").join("He aprobado la examen — wrong twice. Examen is masculine: el examen.");
out = out.split("Suspenso takes ser, not estar, because it is not a passing state, it is a verdict.").join("Suspenso is the verdict: you say saqué un suspenso, not *soy suspenso.");
out = out.split("Es(aprobado/suspendido) — and note there is no article. You do not say *está aprobado.").join("Es aprobado/suspenso — and note there is no article. You do not say *está aprobado.");
out = out.split("Hacemos...").join("Hacemos..."); // noop

// HÁ-blar
out = out.split("hablar is HÁ-blar").join("hablar is ha-BLAR");
out = out.split("escribir A-MI-manana, ver A-SÍ").join("ver a-SÍ, escribir a-QUÍ");

// participles
out = out.split("abierto, perdido, resuelto").join("abierto, roto, resuelto");
out = out.split("Hablado and comido are preterite participles.").join("Hablado and comido are past participles.");

// He bajó
out = out.split("He bajó and bajó").join("Ha bajado and bajó");

// mercado 'del ayer'
out = out.split("pollo del ayer").join("pollo de ayer");

// por lo tanto / sin embargo
out = out.split("Sin embargo and por eso cannot join clauses; por lo que can, and means the opposite of por eso.").join("Sin embargo and por eso are adverbs and sit inside a clause; por lo que and puesto que join two clauses themselves.");

// chats: 'What is he doing?' no-progressive note
out = out.split("Spanish has no progressive. The present covers both, and the context decides which.").join("Spanish has no dedicated progressive the way English does. Estoy comiendo exists for an action in progress right now, but the present covers both, and context decides.");

// leísmo
out = out.split("In Spain le is used for a woman, and a speaker may be corrected for it. Non-speakers use lo for anything, and are not corrected.").join("In Spain you will hear le for a male direct object where lo is the textbook form, and a speaker may be told it is wrong. Non-speakers use lo for everyone, and nobody is corrected.");

// Madrid es en el centro
out = out.split("Also accepts ser: Madrid es en el centro.").join("Use estar: Madrid está en el centro.");
out = out.split("Permanent fact about a place, so either works and estar is more common. España está en Europa.").join("Permanent fact about a place, and estar still wins. España está en Europa.");

// mientras tanto connector
out = out.split("The connector is imperfect, and the verb inside it is a preterite.").join("Mientras tanto frames an ongoing scene, and the verb inside it is a preterite event.");

// Made earlier miss: 'él and ellos have the same form' already handled
// examen not-taught fixed via correct flag swap above (string form may differ); also handle pretty-printed
out = out.replace(/"value": "the imperfect subjunctive",\s*\n\s*"correct": true/g, '"value": "the future tense",\n        "correct": true');
out = out.replace(/"value": "vosotros, which chapter 10 teaches",\s*\n\s*"correct": false/g, '"value": "the conditional",\n        "correct": false');

// restaurant story fixes
out = out.split("¿Qué pidió Andrés?").join("¿Qué pidió el narrador?");
out = out.split("Sat yrés").join("Mi hermana");

// mercado quiz Ana fixed via subs above (correct flag inline in file? it is multiline). Fallback regex:
out = out.replace(/"value": "María's friend",\s*\n\s*"correct": true/g, '"value": "María\'s daughter",\n        "correct": true');

// colores note miss? handled above.
// ch4 pedir fill accept
out = out.replace(/"answer": "salga",\s*\n\s*"accept": \[[^\]]*\]/g, (m) => m.replace(/"sale"/g, '"salga"'));

// story tip: name the percentage so the fill question is answerable
out = out.split("Mi hermana paga y deja una propina.").join("Mi hermana paga y deja una propina del diez por ciento.");
// ch4-hacer fill
out = out.split('"prompt": "___ falta llamar al médico.",\n        "type": "fill",').join('"prompt": "___ falta llamar al médico.",\n        "type": "fill",');
out = out.replace(/("prompt": "___ falta llamar al médico\."[\s\S]*?"answer": ")Hay(")/, "$1Hace$2");
// ch4-lectura-planes accept list
out = out.replace(/"accept": \["salga", "sale"\]/, '"accept": ["salga"]');
// reflexive fills: pin the tense with a time marker
(() => {
  const needle = '"prompt": "Nosotros ___ (acostarse) tarde."';
  const parts = out.split(needle);
  if (parts.length === 4) {
    out = parts[0] + '"prompt": "Nosotros ___ (acostarse) tarde todos los días."' + parts[1]
        + '"prompt": "Nosotros ___ (acostarse) tarde todos los días."' + parts[2]
        + '"prompt": "Anoche nosotros ___ (acostarse) tarde."' + parts[3];
  } else {
    console.log("reflexive fill count:", parts.length - 1);
  }
})();
// examen fills: add subject hints
out = out.split('"prompt": "Espero que ___ (venir) mañana."').join('"prompt": "Espero que ellos ___ (venir) mañana."');
out = out.split('"prompt": "No ___ (hablar) con ella."').join('"prompt": "(Usted) No ___ (hablar) con ella."');

// ch5 weather body vs note (Está soleado)
out = out.split("Llueve. Nieva. Está nublado. Está soleado.").join("Llueve. Nieva. Está nublado. Hace sol.");

// ch5-estar gerund paragraph — leave as-is (not verified), no change.

// ch9 narrative 'era' group examples
out = out.split("left\": \"Era las once y media.\"").join("left\": \"Eran las once y media.\"");
out = out.split("\"prompt\": \"Era las once y media uses the imperfect because").join("\"prompt\": \"Eran las once y media uses the imperfect because");
out = out.split("\"prompt\": \"Era las once y media is").join("\"prompt\": \"Eran las once y media is");

// misc garbles
out = out.split("en LAritmo").join("en el ritmo");

if (missing.length) console.log("MISSING:", missing);

try {
  JSON.parse(out);
} catch (e) {
  console.error("JSON INVALID:", (e as Error).message);
  process.exit(1);
}
writeFileSync(PATH, out);
console.log("ok");
