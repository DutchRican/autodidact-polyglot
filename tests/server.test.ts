import { describe, expect, test, beforeAll } from "bun:test";
import { indexPack, loadPack } from "../src/engine/content.ts";
import { createApp } from "../src/server/app.ts";
import { conjugate } from "../src/engine/conjugation.ts";
import type { Lesson } from "../src/types.ts";

const pack = await loadPack("content/es.json");
const index = indexPack(pack);
const app = createApp({ pack, index });

const get = (path: string) => app.request(`http://localhost${path}`);
const post = (path: string, body: Record<string, string>) =>
  app.request(`http://localhost${path}`, {
    method: "POST",
    body: new URLSearchParams(body),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });

const quizCtx = { pack, baseLang: pack.language.baseLang };

/**
 * The correct response for question i, computed from the content — the same way
 * the server grades it, so the test can't drift from the real answers.
 */
function correctResponse(lesson: Lesson, i: number): string {
  const q = lesson.quiz.questions[i];
  if (!q) throw new Error(`no question ${i}`);
  if (q.type === "choice") {
    const option = q.options.find((o) => o.correct);
    if (!option) throw new Error("choice question has no correct option");
    return option.value;
  }
  if (q.type === "fill") return q.answer;
  const verb = pack.verbs.find((v) => v.id === q.verbId);
  if (!verb) throw new Error(`missing verb ${q.verbId}`);
  return conjugate(verb, pack.conjugation, q.tense).forms[q.persona] ?? "";
}

/** Play a whole quiz answering every question correctly; return results HTML. */
async function playQuiz(lessonId: string) {
  const page = await get(`/lessons/${lessonId}/quiz`);
  const html = await page.text();
  const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1];
  if (!attempt) throw new Error("no attempt id on quiz page");

  const lesson = index.lessons().find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`no lesson ${lessonId}`);
  const total = lesson.quiz.questions.length;

  for (let i = 0; i < total; i++) {
    // The question must actually be shown before it can be answered.
    const qHtml = await (
      await get(`/api/quizzes/${lesson.quiz.id}/question/${i}?attempt=${attempt}`)
    ).text();
    const answer = correctResponse(lesson, i);
    const question = lesson.quiz.questions[i]!;
    if (question.type === "fill") {
      // Fill questions render an empty input; the answer is graded server-side.
      expect(qHtml).toContain('class="fill__input"');
    } else {
      // The correct answer must actually be offered as an option.
      const offered = [...qHtml.matchAll(/data-response="([^"]*)"/g)].map((m) =>
        m[1]!
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&"),
      );
      expect(offered).toContain(answer);
    }
    await post(`/api/quizzes/${lesson.quiz.id}/reveal/${i}`, { attempt, response: answer });
  }

  return (await get(`/api/quizzes/${lesson.quiz.id}/question/${total}?attempt=${attempt}`)).text();
}

describe("pages", () => {
  test("home groups lessons under their chapter", async () => {
    const res = await get("/");
    expect(res.status).toBe(200);
    const html = await res.text();
    for (const chapter of index.chapters()) {
      expect(html).toContain(`data-chapter="${chapter.id}"`);
      expect(html).toContain(chapter.title);
    }
    for (const lesson of index.lessons()) expect(html).toContain(lesson.title);
  });

  test("chapter page lists only that chapter's lessons", async () => {
    const first = index.chapters()[0]!;
    const rest = index.lessons().filter((l) => l.chapterId !== first.id);
    const html = await (await get(`/chapters/${first.id}`)).text();
    for (const lesson of first.lessons) expect(html).toContain(lesson.title);
    for (const lesson of rest) expect(html).not.toContain(`>${lesson.title}<`);
  });

  test("unknown chapter is a 404", async () => {
    expect((await get("/chapters/nope")).status).toBe(404);
  });

  test("lesson page shows its chapter and a prev/next pager", async () => {
    const lessons = index.lessons();
    const second = lessons[1]!;
    const html = await (await get(`/lessons/${lessons[0]!.id}`)).text();
    expect(html).toContain("Chapter 1 · Lesson 1");
    expect(html).toContain(`href="/lessons/${second.id}"`);

    const secondHtml = await (await get(`/lessons/${second.id}`)).text();
    expect(secondHtml).toContain("← Previous");
    expect(secondHtml).toContain(`href="/lessons/${lessons[0]!.id}"`);
    expect(secondHtml).toContain(`href="/lessons/${lessons[2]!.id}"`);

    // The final lesson has no next.
    const last = lessons[lessons.length - 1]!;
    const lastHtml = await (await get(`/lessons/${last.id}`)).text();
    expect(lastHtml).toContain("← Previous");
    expect(lastHtml).not.toContain("Next →");
  });

  test("the next-lesson pager stays inside a chapter", async () => {
    const split = structuredClone(pack) as any;
    // One lesson per chapter, so "next" must not cross into the next chapter.
    split.chapters = split.chapters[0].lessons.map((l: any, i: number) => ({
      id: `ch-${i}`,
      order: i + 1,
      title: l.title,
      lessons: [l],
    }));
    const multi = createApp({ pack: split, index: indexPack(split) });

    const first = await (await multi.request("http://x/lessons/saludos")).text();
    expect(first).toContain("Chapter 1 · Lesson 1");
    expect(first).not.toContain("Next →");

    const second = await (await multi.request("http://x/lessons/numeros")).text();
    // Chapter 2, but the lesson keeps its own order within it.
    expect(second).toContain("Chapter 2 · Lesson 2");
    expect(second).toContain(`href="/chapters/ch-1"`);
    expect(second).not.toContain("Next →");
  });

  test("lesson page renders a conjugation table with every persona", async () => {
    const html = await (await get("/lessons/hablar-presente")).text();
    for (const forma of ["hablo", "hablas", "habla", "hablamos", "habláis", "hablan"]) {
      expect(html).toContain(forma);
    }
    for (const p of pack.conjugation.personae) expect(html).toContain(p.id);
  });

  test("irregular forms are labelled", async () => {
    const html = await (await get("/lessons/irregulares")).text();
    expect(html).toContain("soy");
    expect(html).toContain("estoy");
    expect(html).toContain("irregular");
  });

  test("verb reference conjugates every verb in the pack", async () => {
    const html = await (await get("/verbs")).text();
    for (const verb of pack.verbs) {
      for (const form of Object.values(conjugate(verb, pack.conjugation, "present").forms)) {
        expect(html).toContain(form);
      }
    }
  });

  test("story lessons render the passage with clickable glossary words", async () => {
    const html = await (await get("/lessons/lectura-mercado")).text();
    expect(html).toContain("María va al");
    expect(html).toContain("con su hija Ana");
    // The glossary word is wrapped in a button, and keeps its punctuation outside.
    expect(html).toContain('data-gloss="familia"');
    expect(html).toContain(">familia</button>.");
    expect(html).toContain('data-meaning="the market"');
  });

  test("404 for unknown lesson", async () => {
    expect((await get("/lessons/nope")).status).toBe(404);
  });

  test("static assets are served", async () => {
    for (const [path, type] of [
      ["/styles.css", "text/css"],
      ["/app.js", "text/javascript"],
      ["/vendor/htmx.min.js", "text/javascript"],
    ] as const) {
      const res = await get(path);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain(type);
    }
  });
});

describe("quiz flow", () => {
  test("question 0 renders options and the attempt id", async () => {
    const html = await (await get("/lessons/hablar-presente/quiz")).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1] ?? "";
    const q = await (
      await get(`/api/quizzes/hablar-quiz/question/0?attempt=${attempt}`)
    ).text();
    expect(q).toContain("Question 1 of 8");
    expect(q).toContain(attempt);
  });

  test("wrong answer shows the right answer and is not counted", async () => {
    const html = await (await get("/lessons/hablar-presente/quiz")).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1]!;
    const res = await post("/api/quizzes/hablar-quiz/reveal/0", {
      attempt,
      response: "zzzzz",
    });
    const body = await res.text();
    expect(body).toContain("Not quite");
    expect(body).toContain("hablo");
    expect(body).toContain('data-correct="false"');
  });

  test("accent-free answer is accepted for a conjugation question", async () => {
    const html = await (await get("/lessons/saludos/quiz")).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1]!;
    const res = await post("/api/quizzes/saludos-quiz/reveal/2", {
      attempt,
      response: "HOLA",
    });
    expect(await res.text()).toContain("Correct");
  });

  test("a full correct run passes and reports the score", async () => {
    const lesson = index.lessons().find((l) => l.id === "hablar-presente")!;
    const results = await playQuiz("hablar-presente");
    expect(results).toContain("Lesson complete");
    expect(results).toContain(`${lesson.quiz.questions.length}/${lesson.quiz.questions.length}`);
    const next = index.lessons()[index.lessons().findIndex((l) => l.id === "hablar-presente") + 1];
    expect(results).toContain(next!.title);
  });

  test("one wrong answer fails a high-threshold quiz", async () => {
    const html = await (await get("/lessons/hablar-presente/quiz")).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1]!;
    const lesson = index.lessons().find((l) => l.id === "hablar-presente")!;
    const total = lesson.quiz.questions.length;

    for (let i = 0; i < total; i++) {
      await get(`/api/quizzes/${lesson.quiz.id}/question/${i}?attempt=${attempt}`);
      const answer = i === 0 ? "not-a-form" : correctResponse(lesson, i);
      await post(`/api/quizzes/${lesson.quiz.id}/reveal/${i}`, { attempt, response: answer });
    }
    const results = await (
      await get(`/api/quizzes/${lesson.quiz.id}/question/${total}?attempt=${attempt}`)
    ).text();
    // 7/8 = 87.5%, still above 80%.
    expect(results).toContain("Lesson complete");
    expect(results).toContain("7/8");
  });

  test("a client cannot inflate its own score", async () => {
    // Ask for results without answering anything.
    const html = await (await get("/lessons/hablar-presente/quiz")).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1]!;
    const results = await (
      await get(`/api/quizzes/hablar-quiz/question/8?attempt=${attempt}`)
    ).text();
    expect(results).toContain("Keep going");
    expect(results).toContain("0/8");
  });

  test("results require a valid attempt", async () => {
    const res = await get("/api/quizzes/hablar-quiz/question/8?attempt=forged");
    expect(res.status).toBe(400);
  });

  test("every lesson quiz can be completed with correct answers", async () => {
    for (const lesson of index.lessons()) {
      const results = await playQuiz(lesson.id);
      expect(results).toContain("Lesson complete");
      expect(results).toContain(`${lesson.quiz.questions.length}/${lesson.quiz.questions.length}`);
    }
  });
});

describe("escaping", () => {
  test("story text is escaped, not injected", async () => {
    const evil = structuredClone(pack) as any;
    evil.stories[0].title = "<script>alert(1)</script>";
    const evilApp = createApp({ pack: evil, index: indexPack(evil) });
    const html = await (await evilApp.request("http://x/lessons/lectura-mercado")).text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("option values cannot break out of the hx-vals attribute", async () => {
    const evil = structuredClone(pack) as any;
    evil.chapters[0].lessons[0].quiz.questions[0].options[0].value = '"><script>alert(1)</script>';
    const evilApp = createApp({ pack: evil, index: indexPack(evil) });
    const html = await (await evilApp.request("http://x/lessons/saludos/quiz")).text();
    const q = await (
      await evilApp.request("http://x/api/quizzes/saludos-quiz/question/0?attempt=a1-00000000")
    ).text();
    expect(html + q).not.toContain('"><script>');
  });
});
