import { describe, expect, test } from "bun:test";
import { indexPack, loadPack } from "../src/engine/content.ts";
import { createApp } from "../src/server/app.ts";
import { assertPackLints, loadLanguages } from "../src/server/languages.ts";
import { lintPack } from "../src/engine/lint.ts";
import { conjugate } from "../src/engine/conjugation.ts";
import type { Lesson } from "../src/types.ts";

const catalog = await loadLanguages("content");
const pack = catalog.packs.get("es")!;
const index = indexPack(pack);
const app = createApp({ catalog });
void index;

/** An app over a modified pack, for lock/unlock and escaping tests. */
function appWith(pack: unknown) {
  return createApp({
    catalog: { languages: [], errors: [], packs: new Map([["es", pack]]) as never },
  });
}

/**
 * The shipped pack plus a locked, unwritten chapter 11 carrying an outline.
 *
 * Every shipped chapter is written, so the tests that cover how an *unwritten*
 * chapter renders have to build one. The version that reached into the pack for
 * a chapter with an outline passed for three chapters and then stopped, the
 * moment the last chapter was finished -- a test that breaks when the content is
 * complete is testing the content, not the behaviour it claims to.
 */
function packWithPlannedChapter() {
  const withPlan = structuredClone(pack) as never as typeof pack;
  withPlan.chapters.push({
    id: "chapter-11",
    order: withPlan.chapters.length + 1,
    title: "Planned",
    subtitle: "Not written yet",
    blurb: "A plan with nothing behind it.",
    level: "advanced",
    status: "locked",
    lessons: [],
    outline: [
      { title: "Something planned", subtitle: "first", covers: "nothing, yet" },
      { title: "Something else planned", subtitle: "second", covers: "still nothing" },
    ],
  } as never);
  return withPlan;
}

/** The shipped pack plus a locked, unwritten chapter with no outline at all. */
function packWithEmptyChapter() {
  const withEmpty = structuredClone(pack) as never as typeof pack;
  withEmpty.chapters.push({
    id: "chapter-12",
    order: withEmpty.chapters.length + 1,
    title: "Empty",
    subtitle: "Nothing written and nothing planned",
    level: "advanced",
    status: "locked",
    lessons: [],
  } as never);
  return withEmpty;
}

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
  const page = await get(`/course/es/lessons/${lessonId}/quiz`);
  const html = await page.text();
  const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1];
  if (!attempt) throw new Error("no attempt id on quiz page");

  const lesson = index.lessons().find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`no lesson ${lessonId}`);
  const total = lesson.quiz.questions.length;

  for (let i = 0; i < total; i++) {
    // The question must actually be shown before it can be answered.
    const qHtml = await (
      await get(`/api/es/quizzes/${lesson.quiz.id}/question/${i}?attempt=${attempt}`)
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
    await post(`/api/es/quizzes/${lesson.quiz.id}/reveal/${i}`, { attempt, response: answer });
  }

  return (
    await get(`/api/es/quizzes/${lesson.quiz.id}/question/${total}?attempt=${attempt}`)
  ).text();
}

describe("landing page", () => {
  test("lists every discovered language", async () => {
    const html = await (await get("/")).text();
    for (const lang of catalog.languages) {
      expect(html).toContain(`data-lang-card="${lang.code}"`);
      expect(html).toContain(`href="/course/${lang.code}"`);
      expect(html).toContain(lang.endonym);
    }
  });

  test("offers only language selection, nothing else", async () => {
    const html = await (await get("/")).text();
    expect(html).toContain("Learn a language");
    // No lesson or chapter links leak onto the landing page.
    expect(html).not.toContain("/lessons/");
    expect(html).not.toContain("/chapters/");
  });

  test("reports content problems instead of dying", async () => {
    const broken = createApp({
      catalog: {
        languages: [],
        errors: [{ file: "broken.json", message: "language.code is required" }],
        packs: new Map(),
      },
    });
    const res = await broken.request("http://x/");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("broken.json");
    expect(html).toContain("language.code is required");
  });

  test("a lint failure keeps a language off the site, and says which rule", async () => {
    // The engine is silent about wrong verb data, so the lint runs at load. A
    // verb whose future is really its preterite would otherwise ship and be
    // taught, and only a human reading the verb reference page would notice.
    const broken = structuredClone(pack) as never as Parameters<typeof indexPack>[0];
    const encontrar = broken.verbs.find((v) => v.id === "encontrar")!;
    delete encontrar.stemByTense!["future"];

    expect(() => assertPackLints(broken)).toThrow(/missing-future-stem/);
    expect(() => assertPackLints(broken)).toThrow(/encontraré/);
  });

  test("a review finding does not keep a language off the site", () => {
    // The pack ships with 16 verb words that are only ever mentioned inside a
    // phrase. Those are listed for review, not fatal -- treating them as errors
    // would take the whole course down over a judgement call.
    expect(() => assertPackLints(pack)).not.toThrow();
    expect(lintPack(pack).filter((f) => f.severity === "review").length).toBeGreaterThan(0);
  });
});

describe("chapters", () => {
  test("course page lists all ten chapters", async () => {
    const html = await (await get("/course/es")).text();
    expect(index.chapters()).toHaveLength(10);
    for (const chapter of index.chapters()) {
      expect(html).toContain(`data-chapter-card="${chapter.id}"`);
    }
  });

  test("a locked chapter with nothing written links to its plan", async () => {
    // There is nothing to spoil, and a plan you cannot reach is only noticed
    // when you go looking for it.
    //
    // Built rather than found: every shipped chapter is written, so there is no
    // unwritten one to pick. These tests are about how the views render an
    // unwritten chapter, not about which chapters happen to be unwritten today,
    // and the version that reached for a shipped chapter stopped passing the
    // moment chapter 10 was finished. Constructing the state is what the
    // sibling test below already does.
    const withPlan = packWithPlannedChapter();
    const planned = withPlan.chapters.find((c) => c.outline?.length)!;
    const html = await (
      await appWith(withPlan).request("http://localhost/course/es")
    ).text();
    expect(html).toContain(`href="/course/es/chapters/${planned.id}"`);
    expect(html).toContain(`data-chapter-href="/course/es/chapters/${planned.id}"`);
    expect(html).toContain("data-chapter-preview");
    // And the target really is a plan, not content.
    const page = await (
      await appWith(withPlan).request(`http://localhost/course/es/chapters/${planned.id}`)
    ).text();
    expect(page).toContain("has not been written");
  });

  test("a locked chapter with no outline gets no link either", async () => {
    // Locked, no lessons, and no plan. A preview link has to point at a plan, or
    // it points at a page reading "No lessons yet". Also built, for the same
    // reason as the test above.
    const withEmpty = packWithEmptyChapter();
    const empty = withEmpty.chapters.find(
      (c) => c.status === "locked" && !c.outline?.length && !c.lessons.length,
    )!;
    const html = await (
      await appWith(withEmpty).request("http://localhost/course/es")
    ).text();
    const card = new RegExp(
      `<li[^>]*data-chapter-card="${empty.id}"[\\s\\S]*?(?=<li[^>]*data-chapter-card=|</ol>)`,
    ).exec(html)?.[0];
    expect(card, `no card for ${empty.id}`).toBeTruthy();
    // Scoped to this card: the chapters above it do carry preview links.
    expect(card).not.toContain("data-chapter-preview");
    expect(card).not.toContain("data-chapter-link");
    expect(card).toContain(`data-chapter-href=""`);
    // And the banner must not promise a plan this chapter does not have.
    const page = await (
      await appWith(withEmpty).request(`http://localhost/course/es/chapters/${empty.id}`)
    ).text();
    expect(page).toContain("has no plan yet");
    expect(page).not.toContain("What follows is the plan");
  });

  test("a locked chapter that IS written still renders no link at all", async () => {
    // The content exists and is being held back; linking to it would publish
    // it. Neither an anchor nor a stored href, so the target is absent from the
    // HTML rather than hidden by CSS. No shipped chapter is in this state, so
    // one is built here.
    const held = packWithPlannedChapter();
    const chapter = held.chapters.find((c) => c.id === "chapter-11")!;
    // An array, not one lesson -- and a fresh id, because lesson ids have to be
    // unique course-wide and the borrowed lesson would collide.
    const borrowed = structuredClone(held.chapters.find((c) => c.lessons.length)!.lessons[0]!);
    borrowed.id = `${chapter.id}-written`;
    borrowed.quiz.id = `${borrowed.id}-quiz`;
    chapter.lessons = [borrowed] as never;
    delete chapter.outline;
    const html = await (
      await appWith(held).request("http://localhost/course/es")
    ).text();
    expect(html).toContain(`data-chapter-card="${chapter.id}"`);
    expect(html).not.toContain(`href="/course/es/chapters/${chapter.id}"`);
    expect(html).toContain(`data-chapter-href=""`);
  });

  test("published chapters link through", async () => {
    const html = await (await get("/course/es")).text();
    const open = index.chapters().filter((c) => (c.status ?? "published") === "published");
    expect(open.length).toBeGreaterThan(0);
    for (const chapter of open) {
      expect(html).toContain(`href="/course/es/chapters/${chapter.id}"`);
      expect((await get(`/course/es/chapters/${chapter.id}`)).status).toBe(200);
    }
  });

  test("every published chapter has lessons and a quiz on each one", async () => {
    for (const chapter of index.chapters().filter(
      (c) => (c.status ?? "published") === "published",
    )) {
      expect(chapter.lessons.length).toBeGreaterThan(0);
      for (const lesson of chapter.lessons) {
        expect(lesson.sections.length).toBeGreaterThan(0);
        expect(lesson.quiz.questions.length).toBeGreaterThan(0);
        expect(lesson.quiz.id).toBe(`${lesson.id}-quiz`);
      }
    }
  });

  test("comparison column headings are marked with the language they are written in", async () => {
    // The labels are usually Spanish infinitives (ser, estar, or a pair like
    // "ser / estar"), which is the default. A chapter that labels its columns
    // descriptively instead — "shop" against "sells" — has to say so, or a
    // screen reader pronounces an English heading with Spanish phonetics.
    const infinitives = new Set(["ser", "estar", "tener", "hacer", "salir", "ir", "llover"]);
    const isSpanishLabel = (label: string) =>
      label
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)
        .every((part) => infinitives.has(part));

    const sections = index
      .chapters()
      .flatMap((c) => c.lessons)
      .flatMap((l) => l.sections)
      .filter((s) => s.type === "comparison");

    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      if (section.type !== "comparison") continue;
      if (isSpanishLabel(section.leftLabel) && isSpanishLabel(section.rightLabel)) {
        expect(section.labelsLang).toBeUndefined();
        continue;
      }
      // English heading: it must be declared, and declared as English.
      expect(section.labelsLang).toBe("en");
    }

    // And it reaches the markup. Matched with a regex because htmx emits an
    // attribute value without quotes when it is a bare word — matching
    // lang="en" would only find the <html> tag and pass for the wrong reason.
    const lesson = index
      .chapters()
      .flatMap((c) => c.lessons)
      .find((l) => l.sections.some((s) => s.type === "comparison" && s.labelsLang === "en"));
    const html = await (await get(`/course/es/lessons/${lesson!.id}`)).text();
    expect(html).toMatch(/comparison__verb" lang="?en"?/);

    const spanish = index
      .chapters()
      .flatMap((c) => c.lessons)
      .find((l) => l.sections.some((s) => s.type === "comparison" && s.labelsLang === undefined));
    const spanishHtml = await (await get(`/course/es/lessons/${spanish!.id}`)).text();
    expect(spanishHtml).toMatch(/comparison__verb" lang="?es"?/);
    expect(spanishHtml).not.toMatch(/comparison__verb" lang="?en"?/);
  });

  test("the locked-chapter note is in the markup even with nothing content-locked", async () => {
    // The count of locked chapters depends on localStorage, so the client owns
    // it: the server can only see content locks. But the element has to ship
    // unconditionally, because a fully released course still has progress locks
    // to report once the learner starts, and app.js has nothing to write into.
    const allOpen = structuredClone(pack) as never as Parameters<typeof indexPack>[0];
    for (const chapter of allOpen.chapters) delete chapter.status;
    const res = await appWith(allOpen).request("http://localhost/course/es");
    const html = await res.text();
    expect(html).toContain("data-locked-note");
    // Nothing is content-locked, so the server ships it hidden and says 0.
    expect(html).toMatch(/<p class="course__note" data-locked-note hidden>/);
    expect(html).toContain("0 chapters are locked.");
  });

  test("a chapter page lists its outline and says it is not written yet", async () => {
    const withPlan = packWithPlannedChapter();
    const chapter = withPlan.chapters.find((c) => c.id === "chapter-11")!;
    const planned = appWith(withPlan);
    const res = await planned.request(`http://localhost/course/es/chapters/${chapter.id}`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain("Not available yet");
    expect(html).toContain("has not been written");
    for (const entry of chapter.outline!) expect(html).toContain(entry.title);
    expect(html).toContain("data-lesson-planned");
  });

  test("an outline row is never clickable, because nothing is behind it", async () => {
    const withPlan = packWithPlannedChapter();
    const chapter = withPlan.chapters.find((c) => c.id === "chapter-11")!;
    const html = await (
      await appWith(withPlan).request(`http://localhost/course/es/chapters/${chapter.id}`)
    ).text();
    const row = /<li class="lesson lesson--planned"[\s\S]*?<\/li>/.exec(html)?.[0] ?? "";
    expect(row).not.toBe("");
    expect(row).not.toContain("<a ");
  });

  test("a written chapter shows no outline and no not-available banner", async () => {
    const written = index.chapters().find((c) => c.lessons.length && !c.outline)!;
    const html = await (await get(`/course/es/chapters/${written.id}`)).text();
    expect(html).not.toContain("data-lesson-planned");
    expect(html).not.toContain("Not available yet");
    expect(html).toContain("data-lesson-card");
  });

  test("every chapter carries the data the unlock rule needs", async () => {
    const html = await (await get("/course/es")).text();
    for (const chapter of index.chapters()) {
      expect(html).toContain(`data-chapter-order="${chapter.order}"`);
      expect(html).toContain(`data-status="${chapter.status ?? "published"}"`);
    }
    const first = index.chapters()[0]!;
    expect(html).toContain(
      `data-lessons="${first.lessons
        .sort((a, b) => a.order - b.order)
        .map((l) => l.id)
        .join(",")}"`,
    );
  });

  test("unknown language is a 404", async () => {
    expect((await get("/course/fr")).status).toBe(404);
  });

  test("lesson urls are language-scoped so ids cannot collide", async () => {
    // Spanish and another pack could both have a lesson called "saludos"; only
    // the /course/:code prefix keeps them distinct.
    expect((await get("/lessons/saludos")).status).toBe(404);
    expect((await get("/course/es/lessons/saludos")).status).toBe(200);
  });
});

describe("pages", () => {
  test("chapter page lists only that chapter's lessons", async () => {
    const first = index.chapters()[0]!;
    const html = await (await get(`/course/es/chapters/${first.id}`)).text();
    for (const lesson of first.lessons) expect(html).toContain(lesson.title);
  });

  test("chapter page links back to the course, not to the old flat route", async () => {
    const first = index.chapters()[0]!;
    const html = await (await get(`/course/es/chapters/${first.id}`)).text();
    expect(html).toContain(`href="/course/es"`);
    expect(html).not.toContain('href="/chapters/');
  });

  test("unknown chapter is a 404", async () => {
    expect((await get("/course/es/chapters/nope")).status).toBe(404);
  });

  test("lesson page shows its chapter and a prev/next pager", async () => {
    const lessons = index.lessons();
    const second = lessons[1]!;
    const html = await (await get(`/course/es/lessons/${lessons[0]!.id}`)).text();
    expect(html).toContain("Chapter 1 · Lesson 1");
    expect(html).toContain(`href="/course/es/lessons/${second.id}"`);

    const secondHtml = await (await get(`/course/es/lessons/${second.id}`)).text();
    expect(secondHtml).toContain("← Previous");
    expect(secondHtml).toContain(`href="/course/es/lessons/${lessons[0]!.id}"`);
    expect(secondHtml).toContain(`href="/course/es/lessons/${lessons[2]!.id}"`);

    // The final lesson has no next.
    const last = lessons[lessons.length - 1]!;
    const lastHtml = await (await get(`/course/es/lessons/${last.id}`)).text();
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
    const multi = appWith(split);

    const first = await (await multi.request("http://x/course/es/lessons/saludos")).text();
    expect(first).toContain("Chapter 1 · Lesson 1");
    expect(first).not.toContain("Next →");

    const second = await (await multi.request("http://x/course/es/lessons/numeros")).text();
    // Chapter 2, but the lesson keeps its own order within it.
    expect(second).toContain("Chapter 2 · Lesson 2");
    expect(second).toContain(`href="/course/es/chapters/ch-1"`);
    expect(second).not.toContain("Next →");
  });

  test("lesson page renders a conjugation table with every persona", async () => {
    const html = await (await get("/course/es/lessons/hablar-presente")).text();
    for (const forma of ["hablo", "hablas", "habla", "hablamos", "habláis", "hablan"]) {
      expect(html).toContain(forma);
    }
    for (const p of pack.conjugation.personae) expect(html).toContain(p.id);
  });

  test("irregular forms are labelled", async () => {
    const html = await (await get("/course/es/lessons/irregulares")).text();
    expect(html).toContain("soy");
    expect(html).toContain("estoy");
    expect(html).toContain("irregular");
  });

  test("verb reference conjugates every verb in the pack", async () => {
    const html = await (await get("/course/es/verbs")).text();
    for (const verb of pack.verbs) {
      for (const form of Object.values(conjugate(verb, pack.conjugation, "present").forms)) {
        expect(html).toContain(form);
      }
    }
  });

  test("story lessons render the passage with clickable glossary words", async () => {
    const html = await (await get("/course/es/lessons/lectura-mercado")).text();
    expect(html).toContain("María va al");
    expect(html).toContain("con su hija Ana");
    // The glossary word is wrapped in a button, and keeps its punctuation outside.
    expect(html).toContain('data-gloss="familia"');
    expect(html).toContain(">familia</button>.");
    expect(html).toContain('data-meaning="the market"');
  });

  test("404 for unknown lesson", async () => {
    expect((await get("/course/es/lessons/nope")).status).toBe(404);
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
  /**
   * Every htmx URL the quiz markup emits must resolve to a real route.
   *
   * This exists because the rest of this suite hardcoded `/api/es/quizzes/...`
   * while questionView and feedbackView emitted `/api/quizzes/...` — no language
   * code. Every test passed and the quiz was completely unusable: clicking an
   * answer and pressing Skip both 404'd. Building the URL in a test proves the
   * route exists; only reading it out of the markup proves the page asks for it.
   */
  test("every htmx url in the quiz markup resolves to a real route", async () => {
    const lessons = index.lessons().filter((l) => l.quiz.questions.length > 0);
    expect(lessons.length).toBeGreaterThan(0);

    const checked = new Set<string>();
    // Accumulates across every lesson, so it has to live outside the loop.
    const urls = new Set<string>();
    const collect = (html: string) => {
      for (const m of html.matchAll(/hx-(?:get|post)="([^"]+)"/g)) {
        urls.add(m[1]!.replace(/&amp;/g, "&"));
      }
    };
    // One choice question, one fill question, one conjugation question, plus
    // every lesson, so a template that only some question kinds use is caught.
    const roles = new Set(["choice", "fill", "conjugation"]);

    for (const lesson of lessons) {
      const page = await (await get(`/course/es/lessons/${lesson.id}/quiz`)).text();
      const attempt = /attempt=([a-z0-9-]+)/.exec(page)?.[1];
      expect(attempt, `no attempt id on ${lesson.id}`).toBeTruthy();
      if (!attempt) continue;

      collect(page);

      // Walk every question so the feedback view's Continue url is covered too.
      for (let i = 0; i < lesson.quiz.questions.length; i++) {
        const qHtml = await (
          await get(`/api/es/quizzes/${lesson.quiz.id}/question/${i}?attempt=${attempt}`)
        ).text();
        collect(qHtml);

        const kind = lesson.quiz.questions[i]!.type;
        if (!roles.has(kind)) continue;
        roles.delete(kind);

        const reveal = /hx-post="([^"]*reveal[^"]*)"/.exec(qHtml)?.[1];
        expect(reveal, `${lesson.id} q${i} (${kind}) has no reveal target`).toBeTruthy();
        const body = await post(reveal!.replace(/&amp;/g, "&"), {
          attempt,
          response: "zzzzz",
        });
        expect(body.status, `${lesson.id} q${i} reveal`).toBe(200);
        collect(await body.text());
      }
      }

    // Every question kind was exercised somewhere in the course.
    expect([...roles], "no question of this kind was exercised").toEqual([]);

    // Now resolve each distinct URL against the app, using the attempt id the
    // URL itself carries. A forged attempt is rejected with 400 by design, so
    // reusing a real one is the only way to test routing rather than that check.
    for (const url of urls) {
      const isPost = /reveal/.test(url);
      const id = /[?&]attempt=([a-z0-9-]+)/.exec(url)?.[1];
      const res = isPost
        ? await post(url, { attempt: id ?? "", response: "zzzzz" })
        : await get(url);
      expect(res.status, `${isPost ? "POST" : "GET"} ${url}`).toBe(200);
      checked.add(url);
    }
    expect(urls.size).toBeGreaterThan(4);
  });

  test("question 0 renders options and the attempt id", async () => {
    const lesson = index.lessons().find((l) => l.id === "hablar-presente")!;
    const html = await (await get(`/course/es/lessons/${lesson.id}/quiz`)).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1] ?? "";
    const q = await (
      await get(`/api/es/quizzes/${lesson.quiz.id}/question/0?attempt=${attempt}`)
    ).text();
    expect(q).toContain(`Question 1 of ${lesson.quiz.questions.length}`);
    expect(q).toContain(attempt);
  });

  test("wrong answer shows the right answer and is not counted", async () => {
    const lesson = index.lessons().find((l) => l.id === "hablar-presente")!;
    const html = await (await get(`/course/es/lessons/${lesson.id}/quiz`)).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1]!;
    const res = await post(`/api/es/quizzes/${lesson.quiz.id}/reveal/0`, {
      attempt,
      response: "zzzzz",
    });
    const body = await res.text();
    expect(body).toContain("Not quite");
    expect(body).toContain("hablo");
    expect(body).toContain('data-correct="false"');
  });

  test("accent-free answer is accepted for a fill question", async () => {
    const lesson = index.lessons().find((l) => l.id === "saludos")!;
    const html = await (await get(`/course/es/lessons/${lesson.id}/quiz`)).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1]!;
    // Question 3 of saludos is the "___ , ¿cómo estás?" fill.
    const res = await post(`/api/es/quizzes/${lesson.quiz.id}/reveal/2`, {
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
    const html = await (await get("/course/es/lessons/hablar-presente/quiz")).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1]!;
    const lesson = index.lessons().find((l) => l.id === "hablar-presente")!;
    const total = lesson.quiz.questions.length;

    for (let i = 0; i < total; i++) {
      await get(`/api/es/quizzes/${lesson.quiz.id}/question/${i}?attempt=${attempt}`);
      const answer = i === 0 ? "not-a-form" : correctResponse(lesson, i);
      await post(`/api/es/quizzes/${lesson.quiz.id}/reveal/${i}`, { attempt, response: answer });
    }
    const results = await (
      await get(`/api/es/quizzes/${lesson.quiz.id}/question/${total}?attempt=${attempt}`)
    ).text();
    // One wrong out of N: still above 80% for a 12-question quiz.
    expect(results).toContain("Lesson complete");
    expect(results).toContain(`${total - 1}/${total}`);
  });

  test("a client cannot inflate its own score", async () => {
    const lesson = index.lessons().find((l) => l.id === "hablar-presente")!;
    const total = lesson.quiz.questions.length;
    // Ask for results without answering anything.
    const html = await (await get(`/course/es/lessons/${lesson.id}/quiz`)).text();
    const attempt = /data-attempt="([^"]+)"/.exec(html)?.[1]!;
    const results = await (
      await get(`/api/es/quizzes/${lesson.quiz.id}/question/${total}?attempt=${attempt}`)
    ).text();
    expect(results).toContain("Keep going");
    expect(results).toContain(`0/${total}`);
  });

  test("results require a valid attempt", async () => {
    const lesson = index.lessons().find((l) => l.id === "hablar-presente")!;
    const res = await get(
      `/api/es/quizzes/${lesson.quiz.id}/question/${lesson.quiz.questions.length}?attempt=forged`,
    );
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
    const evilApp = appWith(evil);
    const html = await (await evilApp.request("http://x/course/es/lessons/lectura-mercado")).text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("option values cannot break out of the hx-vals attribute", async () => {
    const evil = structuredClone(pack) as any;
    evil.chapters[0].lessons[0].quiz.questions[0].options[0].value = '"><script>alert(1)</script>';
    const evilApp = appWith(evil);
    const html = await (await evilApp.request("http://x/course/es/lessons/saludos/quiz")).text();
    const q = await (
      await evilApp.request("http://x/api/es/quizzes/saludos-quiz/question/0?attempt=a1-00000000")
    ).text();
    expect(html + q).not.toContain('"><script>');
  });
});
