import { Hono } from "hono";
import type { Context } from "hono";
import { indexPack, loadPack, ContentError, type PackIndex } from "../engine/content.ts";
import { grade, presentQuestion, type QuizContext } from "../engine/quiz.ts";
import type { Chapter, LanguagePack, QuizQuestion } from "../types.ts";
import {
  chapterPage,
  coursePage,
  feedbackView,
  landingPage,
  lessonPage,
  questionView,
  quizPage,
  resultsView,
  verbsPage,
} from "../views/pages.ts";
import { html, render } from "../views/layout.ts";
import { document } from "../views/pages.ts";
import { loadLanguages, type LanguageCatalog } from "./languages.ts";

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/**
 * In-progress quiz state, keyed by attempt id.
 *
 * The browser never tells the server how many answers it got right: marks are
 * accumulated server-side as questions are revealed. Long-term progress
 * (which lessons are complete) lives in localStorage, as requested.
 */
class QuizStore {
  #attempts = new Map<string, { quizId: string; marks: boolean[]; seen: number }>();
  #seq = 0;

  start(quizId: string): string {
    const id = `a${++this.#seq}-${crypto.randomUUID().slice(0, 8)}`;
    this.#attempts.set(id, { quizId, marks: [], seen: 0 });
    return id;
  }

  record(attemptId: string, quizId: string, i: number, correct: boolean): void {
    const attempt = this.#attempts.get(attemptId);
    if (!attempt || attempt.quizId !== quizId) throw new HttpError(400, "unknown quiz attempt");
    attempt.marks[i] = correct;
    attempt.seen = Math.max(attempt.seen, i + 1);
  }

  finish(attemptId: string, quizId: string, total: number): {
    correct: number;
    total: number;
    ratio: number;
    marks: boolean[];
  } {
    const attempt = this.#attempts.get(attemptId);
    if (!attempt || attempt.quizId !== quizId) throw new HttpError(400, "unknown quiz attempt");
    const marks = Array.from({ length: total }, (_, i) => attempt.marks[i] ?? false);
    const correct = marks.filter(Boolean).length;
    return { correct, total, ratio: total ? correct / total : 0, marks };
  }
}

export interface AppDeps {
  catalog: LanguageCatalog;
  store?: QuizStore;
}

export function createApp({ catalog, store = new QuizStore() }: AppDeps): Hono {
  const app = new Hono();

  const requirePack = (code: string) => {
    const pack = catalog.packs.get(code);
    if (!pack) throw new HttpError(404, `unknown language: ${code}`);
    return pack;
  };

  /** Per-request language context: pack, index, quiz ctx. */
  const lang = (code: string) => {
    const pack = requirePack(code);
    const index = indexPack(pack);
    return { pack, index, quiz: { pack, baseLang: pack.language.baseLang } as QuizContext };
  };

  const findLesson = (index: PackIndex, id: string) => {
    const lesson = index.lesson(id);
    if (!lesson) throw new HttpError(404, `unknown lesson: ${id}`);
    return lesson;
  };

  const findChapter = (index: PackIndex, id: string) => {
    const chapter: Chapter | undefined = index.chapters().find((c) => c.id === id);
    if (!chapter) throw new HttpError(404, `unknown chapter: ${id}`);
    return chapter;
  };

  const findQuiz = (index: PackIndex, quizId: string) => {
    for (const lesson of index.lessons()) {
      if (lesson.quiz.id === quizId) return lesson;
    }
    throw new HttpError(404, `unknown quiz: ${quizId}`);
  };

  // ---- landing ----

  app.get("/", (c) => c.html(render(landingPage(catalog, catalog.errors))));

  // ---- everything below is scoped to one language, so ids stay unambiguous
  // once a second pack exists ----

  app.get("/course/:code", (c) => {
    const { pack, index } = lang(c.req.param("code"));
    return c.html(render(coursePage(pack, index)));
  });

  app.get("/course/:code/verbs", (c) => {
    const { pack, index } = lang(c.req.param("code"));
    return c.html(render(verbsPage(pack, index)));
  });

  app.get("/course/:code/chapters/:id", (c) => {
    const { pack, index } = lang(c.req.param("code"));
    return c.html(render(chapterPage(pack, index, findChapter(index, c.req.param("id")))));
  });

  app.get("/course/:code/lessons/:id", (c) => {
    const { pack, index } = lang(c.req.param("code"));
    return c.html(render(lessonPage(pack, index, findLesson(index, c.req.param("id")))));
  });
  app.get("/course/:code/lessons/:id/quiz", (c) => {
    const { pack, index } = lang(c.req.param("code"));
    const lesson = findLesson(index, c.req.param("id"));
    return c.html(render(quizPage(pack, index, lesson, store.start(lesson.quiz.id))));
  });

  /** One question. i === total means "show results". */
  app.get("/api/:code/quizzes/:quizId/question/:i", (c) => {
    const { index, quiz: quizCtx } = lang(c.req.param("code"));
    const lesson = findQuiz(index, c.req.param("quizId"));
    const pack = requirePack(c.req.param("code"));
    const attemptId = c.req.query("attempt") ?? "";
    const i = Number(c.req.param("i"));
    const total = lesson.quiz.questions.length;
    if (!Number.isInteger(i) || i < 0) throw new HttpError(404, "bad question index");
    if (!attemptId) throw new HttpError(400, "missing attempt");

    if (i >= total) {
      const result = store.finish(attemptId, lesson.quiz.id, total);
      const passed = result.ratio >= (lesson.quiz.passThreshold ?? 0.8);
      return c.html(render(resultsView({ pack, lesson, index, ...result, passed })));
    }

    const q = presentQuestion(lesson.quiz.questions[i] as QuizQuestion, i, quizCtx);
    return c.html(render(questionView(pack, lesson, q, index, i, total, attemptId)));
  });

  /** Grade one answer. The next question is a separate GET. */
  app.post("/api/:code/quizzes/:quizId/reveal/:i", async (c) => {
    const { pack, index, quiz: quizCtx } = lang(c.req.param("code"));
    const lesson = findQuiz(index, c.req.param("quizId"));
    const i = Number(c.req.param("i"));
    const question = lesson.quiz.questions[i];
    if (!question) throw new HttpError(404, "bad question index");

    const body = (await c.req.parseBody().catch(() => ({}))) as Record<string, unknown>;
    const attemptId = String(body["attempt"] ?? "");
    const chosen = String(body["response"] ?? "").trim();

    const result = grade(question, chosen, quizCtx);
    if (attemptId) store.record(attemptId, lesson.quiz.id, i, result.correct);

    return c.html(
      render(
        feedbackView({
          pack,
          lesson,
          index,
          i,
          total: lesson.quiz.questions.length,
          correct: result.correct,
          answer: result.answer,
          alsoAccept: result.alsoAccept,
          explanation: result.explanation,
          chosen,
          attemptId,
        }),
      ),
    );
  });

  // ---- assets ----

  const asset = (path: string, contentType: string) => async (c: Context) => {
    const file = Bun.file(path);
    if (!(await file.exists())) return c.text("/* not built */", 404);
    return c.body(await file.text(), 200, {
      "content-type": contentType,
      "cache-control": "no-cache",
    });
  };

  app.get("/styles.css", asset("public/styles.css", "text/css; charset=utf-8"));
  app.get("/app.js", asset("public/app.js", "text/javascript; charset=utf-8"));
  app.get("/progress.js", asset("public/progress.js", "text/javascript; charset=utf-8"));
  app.get(
    "/vendor/htmx.min.js",
    asset("node_modules/htmx.org/dist/htmx.min.js", "text/javascript; charset=utf-8"),
  );

  app.notFound((c) => c.html(render(errorPage(404)), 404));

  app.onError((err, c) => {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error(err);
    return c.html(render(errorPage(status)), status as 404);
  });

  return app;
}

/** Minimal standalone page, so errors work even without a language pack. */
function errorPage(status: number) {
  return document({
    title: `${status}`,
    lang: { code: "error", name: "Habla", baseLang: "en" },
    body: html`
      <main class="page page--error">
        <h1>${status}</h1>
        <p>${status === 404 ? "That page does not exist." : "Something went wrong."}</p>
        <p><a class="btn btn--primary" href="/">All languages</a></p>
      </main>
    `,
  });
}

export async function buildApp(): Promise<Hono> {
  const catalog = await loadLanguages("content");
  for (const err of catalog.errors) {
    console.warn(`[content] ${err.file}: ${err.message}`);
  }
  if (!catalog.languages.length) {
    console.warn("[content] no valid language packs found");
  }
  return createApp({ catalog });
}
