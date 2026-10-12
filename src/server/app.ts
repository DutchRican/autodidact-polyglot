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
import { styles, appJs, progressJs, htmx } from "./embedded-assets.ts";
import { document } from "../views/pages.ts";
import { loadLanguages, type LanguageCatalog } from "./languages.ts";
import { AttemptCodec, resolveSecret } from "./attempts.ts";

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export interface AppDeps {
  catalog: LanguageCatalog;
  /** Signing key. Defaults to `QUIZ_SECRET`, which must be shared by all instances. */
  secret?: string;
}

/**
 * Quiz state is a signed token, not a server-side session (see `attempts.ts`),
 * so any instance can answer any question. The browser never tells the server
 * how many answers it got right -- marks are accumulated as questions are
 * revealed and come back signed. Long-term progress (which lessons are
 * complete) lives in localStorage, as requested.
 */
export function createApp({ catalog, secret = resolveSecret() }: AppDeps): Hono {
  const attempts = new AttemptCodec(secret);
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
  app.get("/course/:code/lessons/:id/quiz", async (c) => {
    const { pack, index } = lang(c.req.param("code"));
    const lesson = findLesson(index, c.req.param("id"));
    return c.html(
      render(quizPage(pack, index, lesson, await attempts.start(lesson.quiz.id))),
    );
  });

  /** One question. i === total means "show results". */
  app.get("/api/:code/quizzes/:quizId/question/:i", async (c) => {
    const { index, quiz: quizCtx } = lang(c.req.param("code"));
    const lesson = findQuiz(index, c.req.param("quizId"));
    const pack = requirePack(c.req.param("code"));
    const attemptId = c.req.query("attempt") ?? "";
    const i = Number(c.req.param("i"));
    const total = lesson.quiz.questions.length;
    if (!Number.isInteger(i) || i < 0) throw new HttpError(404, "bad question index");
    if (!attemptId) throw new HttpError(400, "missing attempt");

    if (i >= total) {
      // A token we cannot verify still has to produce a results page: the quiz
      // is over and there is nothing left to submit. An unverifiable attempt
      // scores zero rather than 400, because a 400 here would leave the learner
      // stuck on a dead page with no way forward.
      const attempt = await attempts.decode(attemptId, lesson.quiz.id);
      const result = attempts.finish(attempt, total);
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

    // Fold this answer into the signed attempt and hand back the new token, so
    // the mark travels with the learner to whichever instance answers next.
    const attempt = (await attempts.decode(attemptId, lesson.quiz.id)) ?? {
      quizId: lesson.quiz.id,
      marks: [],
    };
    attempt.marks[i] = result.correct;

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
          attemptId: await attempts.encode(attempt),
        }),
      ),
    );
  });

  // ---- assets ----

  const asset = (text: string, contentType: string) => async (c: Context) => {
    return c.body(text, 200, {
      "content-type": contentType,
      "cache-control": "no-cache",
    });
  };

  app.get("/styles.css", asset(styles, "text/css; charset=utf-8"));
  app.get("/app.js", asset(appJs, "text/javascript; charset=utf-8"));
  app.get("/progress.js", asset(progressJs, "text/javascript; charset=utf-8"));
  app.get(
    "/vendor/htmx.min.js",
    asset(htmx, "text/javascript; charset=utf-8"),
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
    lang: { code: "error", name: "Autodidact-Polyglot", baseLang: "en" },
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
