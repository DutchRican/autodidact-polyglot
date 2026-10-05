/**
 * One-off content edit: fix a duplicated distractor in ch2-saberes.
 *
 * Found by the duplicate-option scan over every quiz in the pack, which is part
 * of the per-chapter verification routine. Three problems in one question:
 *
 *   1. "decís" appears twice -- once correct, once as a distractor. Whichever
 *      of the two the learner clicked, they got it right.
 *   2. "deciís" is not a Spanish word; i is never stressed in -ír.
 *   3. So there were effectively two options, one of them a typo.
 *
 * Replaced with decen (the ellos form) and digo (the yo form), which are the two
 * forms a learner actually reaches for by mistake. The neighbouring question has
 * the same shape for *ver*, and its three distractors are distinct, so this one
 * was an oversight rather than a design choice.
 *
 * The lesson is a `verbDrill` recipe, so the question lives in `extraQuestions`
 * on the recipe rather than in a quiz object -- generated lessons have no quiz of
 * their own until they are expanded at load time.
 *
 * Run with: bun scripts/fix-ch2-decir-quiz.ts
 */
const file = "content/es.json";
const pack = await Bun.file(file).json();

const lesson = pack.chapters
  .find((c: { id: string }) => c.id === "chapter-2")
  ?.lessons.find((l: { id: string }) => l.id === "ch2-saberes");
if (!lesson?.source?.extraQuestions) throw new Error("ch2-saberes extraQuestions missing");

const question = lesson.source.extraQuestions.find(
  (q: { prompt?: string }) => q.prompt === "Which is the correct vosotros form of decir?",
);
if (!question || question.type !== "choice") throw new Error("the decir question is gone");
if (question.options[0]?.value !== "decís") throw new Error("the first option is not decís");

question.options = [
  { value: "decís", correct: true },
  { value: "decéis", correct: false },
  { value: "decen", correct: false },
  { value: "digo", correct: false },
];

await Bun.write(file, JSON.stringify(pack, null, 2) + "\n");
console.log("ch2-saberes: options now decís / decéis / decen / digo");
