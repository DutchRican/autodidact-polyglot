/**
 * Verification harness: play every quiz in a chapter end to end over real HTTP.
 *
 * Follows the same route sequence the browser does -- load the quiz page, pull
 * the attempt id out of the markup, GET each question, POST each answer to
 * reveal, then GET past the last index for the results page. Nothing is graded
 * locally: the answer is read out of the content and the server decides.
 *
 * Usage: bun scripts/play-chapter.ts [chapterId]
 */
import { loadPack } from "../src/engine/content.ts";

const BASE = process.env["BASE"] ?? "http://localhost:3000";
const only = process.argv[2];

const pack = await loadPack("content/es.json");
const chapters = pack.chapters.filter((c) => !only || c.id === only);

let questionsPlayed = 0;
let lessonsPlayed = 0;
let failures = 0;

const fail = (msg: string) => {
  failures++;
  console.log("  FAIL " + msg);
};

for (const chapter of chapters) {
  if (!chapter.lessons.length) continue;
  console.log(`\n${chapter.id} ${chapter.title} (${chapter.lessons.length} lessons)`);

  for (const lesson of chapter.lessons) {
    const quizUrl = `${BASE}/course/es/lessons/${lesson.id}/quiz`;
    const page = await fetch(quizUrl);
    if (page.status !== 200) {
      fail(`GET ${quizUrl} -> ${page.status}`);
      continue;
    }
    const html = await page.text();
    // The attempt id lives on data-attempt. Do not grep for `attempt=`: the
    // page also contains the htmx template with an empty `attempt=`, and
    // matching that yields a 400 from every question.
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1];
    if (!attempt) {
      fail(`no attempt id in ${quizUrl}`);
      continue;
    }

    const total = lesson.quiz.questions.length;
    let lessonFailures = 0;
    const before = failures;

    for (let i = 0; i < total; i++) {
      const q = lesson.quiz.questions[i]!;
      const qUrl = `${BASE}/api/es/quizzes/${lesson.quiz.id}/question/${i}?attempt=${attempt}`;
      const qRes = await fetch(qUrl);
      if (qRes.status !== 200) {
        fail(`GET question ${lesson.id}#${i} -> ${qRes.status}`);
        lessonFailures++;
        continue;
      }
      const qHtml = await qRes.text();
      // Every question page must name the right lesson and index.
      if (!qHtml.includes(`data-lesson="${lesson.id}"`) && !qHtml.includes(lesson.id)) {
        fail(`question page for ${lesson.id}#${i} does not name the lesson`);
        lessonFailures++;
      }
      // The reveal URL must carry the language code, or htmx posts into a 404
      // and the quiz is unusable. This is the bug chapter 4 shipped with, and
      // the attribute is hx-post, not action.
      const expected = `/api/es/quizzes/${lesson.quiz.id}/reveal/${i}`;
      const hasReveal = qHtml.includes(`hx-post="${expected}"`);
      if (!hasReveal) {
        // Distinguish "wrong URL" from "no URL", because the first is the
        // bug that made a whole chapter's quizzes dead on arrival.
        const anyReveal = /hx-post="([^"]*reveal[^"]*)"/.exec(qHtml)?.[1];
        fail(
          anyReveal
            ? `reveal URL is "${anyReveal}", expected ${expected}`
            : `question ${lesson.id}#${i} has no reveal URL at all`,
        );
        lessonFailures++;
        continue;
      }
      const next = `/api/es/quizzes/${lesson.quiz.id}/question/${i + 1}?attempt=${attempt}`;
      if (i < total - 1 && !qHtml.includes(`hx-get="${next}"`)) {
        fail(`question ${lesson.id}#${i} does not link to question ${i + 1}`);
        lessonFailures++;
      }
      const reveal = expected;

      // The answer, taken from the content. Conjugation questions are answered
      // by the engine so the harness is not hardcoding a second opinion.
      let answer: string;
      if (q.type === "choice") {
        answer = q.options.find((o) => o.correct)!.value;
      } else if (q.type === "fill") {
        answer = q.answer;
      } else {
        const { conjugate } = await import("../src/engine/conjugation.ts");
        answer = conjugate(
          pack.verbs.find((v) => v.id === q.verbId)!,
          pack.conjugation,
          q.tense,
        ).forms[q.persona]!;
      }

      const rRes = await fetch(BASE + reveal, {
        method: "POST",
        body: new URLSearchParams({ attempt, response: answer }),
        headers: { "content-type": "application/x-www-form-urlencoded" },
      });
      if (rRes.status !== 200) {
        fail(`POST reveal ${lesson.id}#${i} -> ${rRes.status}`);
        lessonFailures++;
        continue;
      }
      const rHtml = await rRes.text();
      // A correct answer must be reported correct, or the server disagrees
      // with the content about what the right answer is.
      if (/data-correct="false"/.test(rHtml) || />\s*Incorrect\s*</i.test(rHtml)) {
        fail(`correct answer graded wrong: ${lesson.id}#${i} "${answer}"`);
        lessonFailures++;
      }
      questionsPlayed++;
    }

    // The results page is the index one past the end.
    const endUrl = `${BASE}/api/es/quizzes/${lesson.quiz.id}/question/${total}?attempt=${attempt}`;
    const end = await fetch(endUrl);
    if (end.status !== 200) {
      fail(`GET results ${lesson.id} -> ${end.status}`);
      lessonFailures++;
    } else {
      const endHtml = await end.text();
      if (!/passed|failed|result/i.test(endHtml)) {
        fail(`results page for ${lesson.id} has no verdict`);
        lessonFailures++;
      }
    }

    if (!lessonFailures) {
      lessonsPlayed++;
      console.log(`  ok ${lesson.id} (${total} questions)`);
    }
  }
}

console.log(
  `\n${lessonsPlayed} quizzes fully played, ${questionsPlayed} questions graded, ${failures} failures`,
);
process.exit(failures ? 1 : 0);
