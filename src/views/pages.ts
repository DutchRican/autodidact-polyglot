import type { Chapter, LanguagePack, Lesson } from "../types.ts";
import { isChapterPublished } from "../types.ts";
import type { PresentedQuestion as PQ } from "../engine/quiz.ts";
import { conjugate, conjugateAll } from "../engine/conjugation.ts";
import { escapeHtml, html, raw, render, type SafeHtml } from "./layout.ts";
import { comparisonTable, conjugationTable, storyView, wordCards } from "./components.ts";
import type { PackIndex } from "../engine/content.ts";
import type { LanguageCatalog, LanguageEntry } from "../server/languages.ts";

/**
 * Full HTML document. `lang` is just the identity bits, so pages that sit above
 * any single language (the landing page) can render too.
 */
export function document(opts: {
  title: string;
  lang: { code: string; name: string; baseLang: string };
  body: unknown;
  bodyClass?: string;
}): SafeHtml {
  const lang = opts.lang;
  return html`<!doctype html>
<html lang="${lang.baseLang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${opts.title}</title>
    <script>
      // Applied before first paint so the theme never flashes.
      (() => {
        try {
          const saved = localStorage.getItem("habla.theme");
          const theme =
            saved ??
            (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
          document.documentElement.dataset.theme = theme;
        } catch {}
      })();
    </script>
    <link rel="stylesheet" href="/styles.css" />
    <script src="/vendor/htmx.min.js" defer></script>
    <script type="module" src="/app.js"></script>
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
      <a class="nav__link" href="/course/${pack.language.code}">Chapters</a>
      <a class="nav__link" href="/course/${pack.language.code}/verbs">Verb reference</a>
      <span class="nav__progress" data-progress-summary></span>
      <button
        class="theme-toggle"
        type="button"
        data-theme-toggle
        aria-label="Switch colour theme"
        title="Switch colour theme"
      >
        <span class="theme-toggle__icon" data-theme-icon aria-hidden="true"></span>
        <span class="theme-toggle__label" data-theme-label>Theme</span>
      </button>
    </nav>
  `;
}

/**
 * Landing page: pick a language. Nothing else yet, by design — the only
 * decision to make here is which language to practise.
 */
export function landingPage(
  catalog: LanguageCatalog,
  problems: Array<{ file: string; message: string }>,
): SafeHtml {
  return document({
    title: "Learn a language",
    bodyClass: "page-landing",
    lang: { code: "landing", name: "Habla", baseLang: "en" },
    body: html`
      <main class="landing">
        <button
          class="theme-toggle theme-toggle--float"
          type="button"
          data-theme-toggle
          aria-label="Switch colour theme"
        >
          <span class="theme-toggle__icon" data-theme-icon aria-hidden="true"></span>
          <span data-theme-label>Theme</span>
        </button>

        <header class="landing__head">
          <h1 class="landing__title">Learn a language</h1>
          <p class="landing__sub">
            Conjugation drills, reading, and quizzes. Pick a language to start.
          </p>
        </header>

        ${catalog.languages.length
          ? html`
              <ul class="langs">
                ${catalog.languages.map((lang) => langCard(lang))}
              </ul>
            `
          : html`
              <p class="landing__empty">
                No language packs found. Add a <code>content/xx.json</code> to begin.
              </p>
            `}

        ${problems.length
          ? html`
              <section class="landing__problems">
                <h2>Content problems</h2>
                <p>These files failed validation and were skipped:</p>
                <ul>
                  ${problems.map(
                    (p) => html`<li><code>${p.file}</code> — ${p.message}</li>`,
                  )}
                </ul>
              </section>
            `
          : ""}
      </main>
    `,
  });
}

function langCard(lang: LanguageEntry): SafeHtml {
  return html`
    <li class="lang" data-lang-card="${lang.code}">
      <a class="lang__link" href="/course/${lang.code}">
        <span class="lang__flag" aria-hidden="true">${lang.flag}</span>
        <span class="lang__body">
          <span class="lang__endonym" lang="${lang.code}">${lang.endonym}</span>
          <span class="lang__name">${lang.name}</span>
          ${lang.blurb ? html`<span class="lang__blurb">${lang.blurb}</span>` : ""}
          <span class="lang__meta">
            ${lang.chapterCount} ${lang.chapterCount === 1 ? "chapter" : "chapters"}
            · ${lang.lessonCount} lessons
          </span>
        </span>
        <span class="lang__progress" data-lang-progress="${lang.code}"></span>
      </a>
    </li>
  `;
}

/**
 * Chapter index for one language. Published chapters link through; planned ones
 * render as inert cards so the course shape is visible without being startable.
 */
export function coursePage(pack: LanguagePack, index: PackIndex): SafeHtml {
  const chapters = index.chapters();
  const open = chapters.filter(isChapterPublished);
  const planned = chapters.length - open.length;
  const code = pack.language.code;
  // Lessons aren't listed on this page, so total progress comes from the
  // per-lesson counts the client already has.
  const totalLessons = index.lessonCount();

  const body = html`
    ${nav(pack)}
    <main class="page page--course">
      ${courseHeader(pack, index)}

      <ol class="chapters">
        ${chapters.map((chapter) => {
          const lessons = [...chapter.lessons].sort((a, b) => a.order - b.order);
          const released = isChapterPublished(chapter);

          // Released chapters render a real link. Content-locked ones render a
          // plain span, so the link is absent from the HTML entirely rather
          // than hidden by CSS. A chapter the content released but that is still
          // gated on progress keeps its link; app.js takes the href away.
          const href = `/course/${code}/chapters/${chapter.id}`;

          return html`
            <li
              class="chapter-card ${released ? "" : "is-locked"}"
              data-chapter-card="${chapter.id}"
              data-chapter-order="${chapter.order}"
              data-status="${chapter.status ?? "published"}"
              data-chapter-href="${released ? href : ""}"
              data-lessons="${lessons.map((l) => l.id).join(",")}"
            >
              <div class="chapter-card__head">
                <span class="chapter-card__num">Chapter ${chapter.order}</span>
                <span class="chapter-card__badge" data-current-badge hidden>Current</span>
                <span
                  class="chapter-card__badge chapter-card__badge--locked"
                  data-locked-badge
                  hidden
                >
                  Locked
                </span>
              </div>
              ${released
                ? html`
                    <a class="chapter-card__link" href="${href}" data-chapter-link>
                      <span class="chapter-card__title">${chapter.title}</span>
                      ${chapter.subtitle
                        ? html`<span class="chapter-card__sub">${chapter.subtitle}</span>`
                        : ""}
                    </a>
                  `
                : html`
                    <span class="chapter-card__title">${chapter.title}</span>
                    ${chapter.subtitle
                      ? html`<span class="chapter-card__sub">${chapter.subtitle}</span>`
                      : ""}
                  `}
              ${chapter.blurb ? html`<p class="chapter-card__blurb">${chapter.blurb}</p>` : ""}
              <div class="chapter-card__foot">
                ${chapter.level
                  ? html`<span class="chapter__level">${chapter.level}</span>`
                  : ""}
                <span class="chapter__count">
                  ${lessons.length} ${lessons.length === 1 ? "lesson" : "lessons"}
                </span>
                <span class="chapter-card__score" data-chapter-score="${chapter.id}"></span>
                <span class="chapter-card__soon" data-chapter-soon></span>
              </div>
              <div class="progress progress--slim">
                <div class="progress__fill" style="width: 0%"></div>
              </div>
            </li>
          `;
        })}
      </ol>

      ${planned
        ? html`
            <p class="course__note" data-locked-note>
              ${planned} ${planned === 1 ? "chapter is" : "chapters are"} locked.
            </p>
          `
        : ""}
    </main>
  `;

  return document({ title: `${pack.language.name} · Chapters`, lang: pack.language, body });
}

function courseHeader(pack: LanguagePack, index: PackIndex): SafeHtml {
  const lang = pack.language;
  // Never point "Start learning" at a chapter the content has locked.
  const firstOpen = index.chapters().find(isChapterPublished);
  return html`
    <header class="course-head">
      <a class="course-head__back" href="/">← All languages</a>
      <h1>
        <span aria-hidden="true">${lang.flag ?? ""}</span>
        ${lang.endonym}
      </h1>
      ${lang.blurb ? html`<p class="course-head__blurb">${lang.blurb}</p>` : ""}
      <div class="hero__bar">
        <div class="progress" data-progress-bar>
          <div class="progress__fill" style="width: 0%"></div>
        </div>
        <span class="progress__label" data-progress-label>
          0 / ${index.lessonCount()} lessons
        </span>
      </div>
      <p class="course-head__actions">
        <a class="btn btn--primary" href="/course/${pack.language.code}/chapters/${firstOpen?.id ?? ""}">
          Start learning
        </a>
        <a class="btn btn--ghost" href="/course/${pack.language.code}/verbs">Verb reference</a>
      </p>
    </header>
  `;
}
/** One lesson row, shared by the course and chapter pages. */
function lessonRow(lesson: Lesson, number: number, code: string): SafeHtml {
  const generated = lesson.source?.kind === "generated";
  return html`
    <li class="lesson" data-lesson-card="${lesson.id}">
      <a class="lesson__link" href="/course/${code}/lessons/${lesson.id}">
        <span class="lesson__num">${number}</span>
        <span class="lesson__body">
          <span class="lesson__title">${lesson.title}</span>
          ${lesson.subtitle ? html`<span class="lesson__sub">${lesson.subtitle}</span>` : ""}
          <span class="lesson__meta">
            ${lesson.quiz.questions.length} questions
            ${generated
              ? html`<span
                  class="lesson__gen"
                  title="Built from the content model at load time"
                  >auto</span
                >`
              : ""}
          </span>
        </span>
        <span class="lesson__score" data-lesson-score="${lesson.id}"></span>
      </a>
    </li>
  `;
}

/** One chapter in full. */
export function chapterPage(
  pack: LanguagePack,
  index: PackIndex,
  chapter: Chapter,
): SafeHtml {
  const lessons = [...chapter.lessons].sort((a, b) => a.order - b.order);
  const code = pack.language.code;
  const body = html`
    ${nav(pack)}
    <main class="page">
      <header class="lesson-head">
        <p class="lesson-head__eyebrow">
          <a href="/course/${code}">Chapter ${chapter.order}</a>
        </p>
        <h1>${chapter.title}</h1>
        ${chapter.subtitle ? html`<p class="lesson-head__sub">${chapter.subtitle}</p>` : ""}
        ${chapter.blurb ? html`<p class="prose">${chapter.blurb}</p>` : ""}
        <div class="hero__bar">
          <div class="progress" data-progress-bar>
            <div class="progress__fill" style="width: 0%"></div>
          </div>
          <span class="progress__label" data-chapter-score-only="${chapter.id}"></span>
        </div>
      </header>
      <ol class="lessons">
        ${lessons.map((lesson, i) => lessonRow(lesson, i + 1, code))}
      </ol>
      <p class="chapter__nav">
        <a class="btn btn--ghost" href="/course/${code}">All chapters</a>
      </p>
    </main>
  `;
  return document({ title: chapter.title, lang: pack.language, body });
}

/** One lesson: every section, then a link into its quiz. */
export function lessonPage(
  pack: LanguagePack,
  index: PackIndex,
  lesson: Lesson & { chapterId: string; chapterOrder: number },
): SafeHtml {
  const baseLang = pack.language.baseLang;
  const code = pack.language.code;
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
          <a href="/course/${pack.language.code}/chapters/${lesson.chapterId}">
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
        <a class="btn btn--primary" href="/course/${pack.language.code}/lessons/${lesson.id}/quiz">Start quiz</a>
      </section>

      <nav class="pager">
        ${prev
          ? html`<a class="pager__link" href="/course/${code}/lessons/${prev.id}">
              <span class="pager__dir">← Previous</span>
              <span class="pager__title">${prev.title}</span>
            </a>`
          : html`<span></span>`}
        ${next
          ? html`<a class="pager__link pager__link--next" href="/course/${code}/lessons/${next.id}">
              <span class="pager__dir">Next →</span>
              <span class="pager__title">${next.title}</span>
            </a>`
          : html`<span></span>`}
      </nav>
    </main>
  `;
  return document({ title: lesson.title, lang: pack.language, body });
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

  if (section.type === "comparison") {
    return html`
      <h2>${section.title}</h2>
      ${section.note ? html`<p class="note">${section.note}</p>` : ""}
      ${comparisonTable({
        leftLabel: section.leftLabel,
        rightLabel: section.rightLabel,
        groups: section.groups,
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
          tables: Object.values(conjugateAll(verb, pack.conjugation, section.tenses)),
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
            tables: Object.values(conjugateAll(verb, pack.conjugation, section.tenses)),
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
  const code = pack.language.code;
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
        hx-get="/api/${code}/quizzes/${lesson.quiz.id}/question/0?attempt=${attemptId}"
        hx-trigger="load"
        hx-swap="innerHTML"
      >
        ${quizLoading()}
      </div>
    </main>
  `;
  return document({ title: lesson.quiz.title, lang: pack.language, body });
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
  const code = pack.language.code;

  // Next in course order, crossing into the following chapter if needed.
  const all = opts.index.lessons();
  const at = all.findIndex((l) => l.id === lesson.id);
  const nextLesson = at >= 0 ? all[at + 1] : undefined;
  const nextChapter = nextLesson
    ? opts.index.chapters().find((c) => c.id === nextLesson.chapterId)
    : undefined;
  const crossesChapter = nextLesson && nextChapter && nextChapter.id !== lesson.chapterId;

  return html`
    <section
      class="results"
      data-results
      data-lesson="${lesson.id}"
      data-ratio="${ratio}"
      data-passed="${passed ? "true" : "false"}"
    >
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
        <a class="btn btn--ghost" href="/course/${pack.language.code}/lessons/${lesson.id}">Back to lesson</a>
        <a class="btn btn--ghost" href="/course/${pack.language.code}/lessons/${lesson.id}/quiz">Retry quiz</a>
        ${passed && nextLesson
          ? html`<a class="btn btn--primary" href="/course/${code}/lessons/${nextLesson.id}">
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
  return document({ title: "Verb reference", lang: pack.language, body });
}

export { escapeHtml, html, raw };
export type { PQ as PresentedQuestion };
