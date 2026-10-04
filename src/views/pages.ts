import type { Chapter, LanguagePack, Lesson } from "../types.ts";
import type { PresentedQuestion as PQ } from "../engine/quiz.ts";
import { conjugate, conjugateAll } from "../engine/conjugation.ts";
import { escapeHtml, html, raw, render, type SafeHtml } from "./layout.ts";
import { conjugationTable, storyView, wordCards } from "./components.ts";
import type { PackIndex } from "../engine/content.ts";

/** Full HTML document. Used for the shell pages. */
export function document(opts: {
  title: string;
  pack: LanguagePack;
  body: unknown;
  bodyClass?: string;
}): SafeHtml {
  const lang = opts.pack.language;
  return html`<!doctype html>
<html lang="${lang.baseLang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${opts.title} · ${lang.name}</title>
    <link rel="stylesheet" href="/styles.css" />
    <script src="/vendor/htmx.min.js" defer></script>
    <script src="/app.js" defer></script>
  </head>
  <body class="${opts.bodyClass ?? ""}" data-lang="${lang.code}" data-baselang="${lang.baseLang}">
    ${opts.body}
  </body>
</html>`;
}

export function nav(pack: LanguagePack): SafeHtml {
  return html`
    <nav class="nav">
      <a class="nav__brand" href="/">
        <span class="nav__flag">${pack.language.flag ?? ""}</span>
        <span>${pack.language.name}</span>
      </a>
      <a class="nav__link" href="/">Chapters</a>
      <a class="nav__link" href="/verbs">Verb reference</a>
      <span class="nav__progress" data-progress-summary></span>
    </nav>
  `;
}

/** One lesson row, shared by the home page and the chapter page. */
function lessonRow(lesson: Lesson, number: number): SafeHtml {
  const generated = lesson.source?.kind === "generated";
  return html`
    <li class="lesson" data-lesson-card="${lesson.id}">
      <a class="lesson__link" href="/lessons/${lesson.id}">
        <span class="lesson__num">${number}</span>
        <span class="lesson__body">
          <span class="lesson__title">${lesson.title}</span>
          ${lesson.subtitle ? html`<span class="lesson__sub">${lesson.subtitle}</span>` : ""}
          <span class="lesson__meta">
            ${lesson.quiz.questions.length} questions
            ${generated ? html`<span class="lesson__gen" title="Generated from the content model">auto</span>` : ""}
          </span>
        </span>
        <span class="lesson__score" data-lesson-score="${lesson.id}"></span>
      </a>
    </li>
  `;
}

/** Home: chapters, each holding its lessons. Progress from localStorage. */
export function homePage(pack: LanguagePack, index: PackIndex): SafeHtml {
  const chapters = index.chapters();
  const total = index.lessonCount();
  let running = 0;

  const body = html`
    ${nav(pack)}
    <main class="page">
      <header class="hero">
        <h1>${pack.language.endonym}</h1>
        <p class="hero__blurb">${pack.language.blurb ?? ""}</p>
        <div class="hero__bar">
          <div class="progress" data-progress-bar>
            <div class="progress__fill" style="width: 0%"></div>
          </div>
          <span class="progress__label" data-progress-label>
            0 / ${total} lessons
          </span>
        </div>
        <p class="hero__actions">
          <button class="btn btn--ghost" type="button" data-reset-progress>Reset progress</button>
        </p>
      </header>

      ${chapters.map((chapter) => {
        const lessons = [...chapter.lessons].sort((a, b) => a.order - b.order);
        const first = running + 1;
        running += lessons.length;

        return html`
          <section class="chapter" data-chapter="${chapter.id}">
            <header class="chapter__head">
              <a class="chapter__link" href="/chapters/${chapter.id}">
                <span class="chapter__num">Chapter ${chapter.order}</span>
                <span class="chapter__title">${chapter.title}</span>
              </a>
              ${chapter.level ? html`<span class="chapter__level">${chapter.level}</span>` : ""}
              <span class="chapter__count">${lessons.length} lessons</span>
              <span class="chapter__score" data-chapter-score="${chapter.id}"></span>
            </header>
            ${chapter.blurb ? html`<p class="chapter__blurb">${chapter.blurb}</p>` : ""}
            <div class="chapter__bar">
              <div class="progress progress--slim">
                <div class="progress__fill" style="width: 0%"></div>
              </div>
            </div>
            <ol class="lessons">
              ${lessons.map((lesson, i) => lessonRow(lesson, first + i))}
            </ol>
          </section>
        `;
      })}
    </main>
  `;
  return document({ title: "Chapters", pack, body });
}

/** One chapter in full. */
export function chapterPage(
  pack: LanguagePack,
  index: PackIndex,
  chapter: Chapter,
): SafeHtml {
  const lessons = [...chapter.lessons].sort((a, b) => a.order - b.order);
  const body = html`
    ${nav(pack)}
    <main class="page">
      <header class="lesson-head">
        <p class="lesson-head__eyebrow">
          <a href="/">Chapter ${chapter.order}</a>
        </p>
        <h1>${chapter.title}</h1>
        ${chapter.subtitle ? html`<p class="lesson-head__sub">${chapter.subtitle}</p>` : ""}
        ${chapter.blurb ? html`<p class="prose">${chapter.blurb}</p>` : ""}
        <div class="hero__bar">
          <div class="progress" data-progress-bar>
            <div class="progress__fill" style="width: 0%"></div>
          </div>
          <span class="progress__label" data-chapter-score="${chapter.id}"></span>
        </div>
      </header>
      <ol class="lessons">
        ${lessons.map((lesson, i) => lessonRow(lesson, i + 1))}
      </ol>
      <p class="chapter__nav">
        <a class="btn btn--ghost" href="/">All chapters</a>
      </p>
    </main>
  `;
  return document({ title: chapter.title, pack, body });
}

/** One lesson: every section, then a link into its quiz. */
export function lessonPage(
  pack: LanguagePack,
  index: PackIndex,
  lesson: Lesson & { chapterId: string; chapterOrder: number },
): SafeHtml {
  const baseLang = pack.language.baseLang;
  const sections = lesson.sections.map((section) => renderSection(pack, index, section, baseLang));
  const siblings = index
    .lessons()
    .filter((l) => l.chapterId === lesson.chapterId);
  const position = siblings.findIndex((l) => l.id === lesson.id);
  const prev = position > 0 ? siblings[position - 1] : undefined;
  const next = position >= 0 ? siblings[position + 1] : undefined;

  const body = html`
    ${nav(pack)}
    <main class="page page--lesson">
      <header class="lesson-head">
        <p class="lesson-head__eyebrow">
          <a href="/chapters/${lesson.chapterId}">
            Chapter ${lesson.chapterOrder} · Lesson ${lesson.order}
          </a>
        </p>
        <h1>${lesson.title}</h1>
        ${lesson.subtitle ? html`<p class="lesson-head__sub">${lesson.subtitle}</p>` : ""}
      </header>

      ${sections.map((s, i) => html`<section class="block" id="s${i + 1}">${s}</section>`)}

      <section class="block block--cta">
        <h2>Ready for the quiz?</h2>
        <p>${lesson.quiz.questions.length} questions. You need ${Math.round(
          (lesson.quiz.passThreshold ?? 0.8) * 100,
        )}% to pass.</p>
        <a class="btn btn--primary" href="/lessons/${lesson.id}/quiz">Start quiz</a>
      </section>

      <nav class="pager">
        ${prev
          ? html`<a class="pager__link" href="/lessons/${prev.id}">
              <span class="pager__dir">← Previous</span>
              <span class="pager__title">${prev.title}</span>
            </a>`
          : html`<span></span>`}
        ${next
          ? html`<a class="pager__link pager__link--next" href="/lessons/${next.id}">
              <span class="pager__dir">Next →</span>
              <span class="pager__title">${next.title}</span>
            </a>`
          : html`<span></span>`}
      </nav>
    </main>
  `;
  return document({ title: lesson.title, pack, body });
}

function renderSection(
  pack: LanguagePack,
  index: PackIndex,
  section: Lesson["sections"][number],
  baseLang: string,
): SafeHtml {
  if (section.type === "text") {
    return html`
      <h2>${section.title}</h2>
      ${section.body.split("\n\n").map((p) => html`<p class="prose">${p}</p>`)}
    `;
  }

  if (section.type === "story") {
    const story = index.story(section.storyId);
    const glossary: Record<string, string> = {};
    for (const id of story.glossary ?? []) {
      const word = index.word(id);
      glossary[word.value.toLowerCase().replace(/^(el|la|los|las|un|una)\s+/, "")] =
        word.translations[baseLang] ?? "";
    }
    return html`
      <h2>${section.title}</h2>
      ${section.note ? html`<p class="note">${section.note}</p>` : ""}
      ${storyView({
        title: story.title,
        titleTranslation: story.titleTranslations[baseLang] ?? "",
        paragraphs: story.text.split("\n\n"),
        glossary,
        baseLang,
      })}
    `;
  }

  if (section.type === "conjugation") {
    const verbs = section.verbIds.map((id) => index.verb(id));
    return html`
      <h2>${section.title}</h2>
      ${section.note ? html`<p class="note">${section.note}</p>` : ""}
      ${verbs.map((verb) =>
        conjugationTable({
          verb,
          tables: Object.values(conjugateAll(verb, pack.conjugation)),
          personae: pack.conjugation.personae,
          baseLang,
          focusPersonae: section.focusPersonae,
        }),
      )}
      <details class="hide">
        <summary>Show all forms</summary>
        ${verbs.map((verb) =>
          conjugationTable({
            verb,
            tables: Object.values(conjugateAll(verb, pack.conjugation)),
            personae: pack.conjugation.personae,
            baseLang,
            showMeaning: false,
          }),
        )}
      </details>
    `;
  }

  const words = section.wordIds.map((id) => index.word(id));
  const kind = section.type === "numbers" ? "numbers" : section.type === "colors" ? "colors" : "words";
  return html`
    <h2>${section.title}</h2>
    ${section.note ? html`<p class="note">${section.note}</p>` : ""}
    ${wordCards(words, baseLang, kind)}
  `;
}

/** Quiz page. Questions are swapped in one at a time by htmx. */
export function quizPage(
  pack: LanguagePack,
  index: PackIndex,
  lesson: Lesson,
  attemptId: string,
): SafeHtml {
  const total = lesson.quiz.questions.length;
  const body = html`
    ${nav(pack)}
    <main
      class="page page--quiz"
      data-quiz-root
      data-lesson="${lesson.id}"
      data-attempt="${attemptId}"
      data-total="${total}"
    >
      <header class="quiz-head">
        <p class="quiz-head__eyebrow">${lesson.title}</p>
        <h1>${lesson.quiz.title}</h1>
        <div class="quiz-progress">
          <span data-progress-label>1 / ${total}</span>
          <div class="progress progress--slim">
            <div class="progress__fill" style="width: 0%"></div>
          </div>
        </div>
      </header>
      <div
        id="qslot"
        hx-get="/api/quizzes/${lesson.quiz.id}/question/0?attempt=${attemptId}"
        hx-trigger="load"
        hx-swap="innerHTML"
      >
        ${quizLoading()}
      </div>
    </main>
  `;
  return document({ title: lesson.quiz.title, pack, body });
}

export function quizLoading(): SafeHtml {
  return html`<p class="muted">Loading…</p>`;
}

/** One question. Identical for choice and conjugation (both are option grids). */
export function questionView(
  pack: LanguagePack,
  lesson: Lesson,
  q: PQ,
  index: PackIndex,
  i: number,
  total: number,
  attemptId: string,
): SafeHtml {
  const quizId = lesson.quiz.id;
  const nextUrl = `/api/quizzes/${quizId}/question/${i + 1}?attempt=${attemptId}`;
  const revealUrl = `/api/quizzes/${quizId}/reveal/${i}`;

  const heading =
    q.kind === "conjugation"
      ? html`
          <p class="q__meta">
            <span class="q__chip">${q.tenseLabel}</span>
            <span class="q__chip q__chip--key" lang="${pack.language.code}">
              ${q.infinitive}
            </span>
          </p>
          <p class="q__pronoun">${q.personaLabel}</p>
          ${q.meaning
            ? html`<p class="q__gloss">${q.infinitive} = ${q.meaning}</p>`
            : ""}
        `
      : html`
          <p class="q__prompt" lang="${q.promptLang}">${q.prompt}</p>
        `;

  const body =
    q.kind === "fill"
      ? html`
          <form
            class="fill"
            hx-post="${revealUrl}"
            hx-target="#qslot"
            hx-swap="innerHTML"
          >
            <input type="hidden" name="attempt" value="${attemptId}" />
            <input
              class="fill__input"
              type="text"
              name="response"
              lang="${pack.language.code}"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              placeholder="${q.placeholder}"
              autofocus
            />
            <button class="btn btn--primary" type="submit">Check</button>
          </form>
        `
      : html`
          <div class="options" role="group">
            ${q.options.map(
              (option) => html`
                <button
                  class="option"
                  type="button"
                  data-response="${escapeHtml(option)}"
                  hx-post="${revealUrl}"
                  hx-vals="${escapeHtml(JSON.stringify({ attempt: attemptId, response: option }))}"
                  hx-target="#qslot"
                  hx-swap="innerHTML"
                >
                  <span lang="${pack.language.code}">${option}</span>
                </button>
              `,
            )}
          </div>
        `;

  return html`
    <section class="q" data-question="${i}">
      <p class="q__count">Question ${i + 1} of ${total}</p>
      ${heading}
      ${body}
      <button
        class="q__skip"
        type="button"
        hx-get="${nextUrl}"
        hx-target="#qslot"
        hx-swap="innerHTML"
      >
        Skip
      </button>
    </section>
  `;
}

/** Correct/incorrect feedback + a Continue button. */
export function feedbackView(opts: {
  pack: LanguagePack;
  lesson: Lesson;
  index: PackIndex;
  i: number;
  total: number;
  correct: boolean;
  answer: string;
  alsoAccept?: string[];
  explanation?: string;
  chosen: string;
  attemptId: string;
}): SafeHtml {
  const { pack, lesson, i, total, attemptId } = opts;
  const nextUrl = `/api/quizzes/${lesson.quiz.id}/question/${i + 1}?attempt=${attemptId}`;
  return html`
    <section
      class="fb fb--${opts.correct ? "ok" : "no"}"
      data-feedback
      data-correct="${opts.correct ? "true" : "false"}"
      data-question-index="${opts.i}"
    >
      <p class="fb__verdict">${opts.correct ? "Correct" : "Not quite"}</p>
      <p class="fb__answer">
        Answer: <strong lang="${pack.language.code}">${opts.answer}</strong>
        ${!opts.correct && opts.chosen
          ? html`<span class="fb__chosen">you said ${opts.chosen}</span>`
          : ""}
      </p>
      ${opts.alsoAccept?.length
        ? html`<p class="fb__also">also: ${opts.alsoAccept.join(", ")}</p>`
        : ""}
      ${opts.explanation ? html`<p class="fb__why">${opts.explanation}</p>` : ""}
      <button
        class="btn btn--primary"
        type="button"
        hx-get="${nextUrl}"
        hx-target="#qslot"
        hx-swap="innerHTML"
      >
        ${i + 1 >= total ? "See results" : "Continue"}
      </button>
    </section>
  `;
}

/** Final score for a lesson quiz. */
export function resultsView(opts: {
  pack: LanguagePack;
  lesson: Lesson & { chapterId: string; chapterOrder: number };
  index: PackIndex;
  ratio: number;
  correct: number;
  total: number;
  passed: boolean;
}): SafeHtml {
  const { pack, lesson, ratio, correct, total, passed } = opts;
  const pct = Math.round(ratio * 100);

  // Next in course order, crossing into the following chapter if needed.
  const all = opts.index.lessons();
  const at = all.findIndex((l) => l.id === lesson.id);
  const nextLesson = at >= 0 ? all[at + 1] : undefined;
  const nextChapter = nextLesson
    ? opts.index.chapters().find((c) => c.id === nextLesson.chapterId)
    : undefined;
  const crossesChapter = nextLesson && nextChapter && nextChapter.id !== lesson.chapterId;

  return html`
    <section class="results" data-results data-lesson="${lesson.id}" data-ratio="${ratio}">
      <p class="results__verdict ${passed ? "is-pass" : "is-fail"}">
        ${passed ? "Lesson complete" : "Keep going"}
      </p>
      <p class="results__score">
        <strong>${correct}/${total}</strong> · ${pct}%
      </p>
      ${passed
        ? html`<p class="results__msg">Saved to your progress.</p>`
        : html`<p class="results__msg">
            You needed ${Math.round((lesson.quiz.passThreshold ?? 0.8) * 100)}%. Read the
            lesson again and retry.
          </p>`}
      <div class="results__actions">
        <a class="btn btn--ghost" href="/lessons/${lesson.id}">Back to lesson</a>
        <a class="btn btn--ghost" href="/lessons/${lesson.id}/quiz">Retry quiz</a>
        ${passed && nextLesson
          ? html`<a class="btn btn--primary" href="/lessons/${nextLesson.id}">
              ${crossesChapter
                ? html`Chapter ${nextLesson.chapterOrder}: ${nextLesson.title}`
                : `Next: ${nextLesson.title}`}
            </a>`
          : ""}
        ${passed && !nextLesson
          ? html`<a class="btn btn--primary" href="/">Course complete 🎉</a>`
          : ""}
      </div>
    </section>
  `;
}

/** Verb reference: every verb in the pack, fully conjugated. */
export function verbsPage(pack: LanguagePack, index: PackIndex): SafeHtml {
  const baseLang = pack.language.baseLang;
  const body = html`
    ${nav(pack)}
    <main class="page">
      <header class="lesson-head">
        <h1>Verb reference</h1>
        <p class="lesson-head__sub">
          All ${pack.verbs.length} verbs, every persona. Regular forms come from the rules in
          the content file.
        </p>
      </header>
      <div class="verbs">
        ${pack.verbs.map((verb) =>
          conjugationTable({
            verb,
            tables: Object.values(conjugateAll(verb, pack.conjugation)),
            personae: pack.conjugation.personae,
            baseLang,
          }),
        )}
      </div>
    </main>
  `;
  return document({ title: "Verb reference", pack, body });
}

export { escapeHtml, html, raw };
export type { PQ as PresentedQuestion };
