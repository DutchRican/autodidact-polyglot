# habla

A language-learning app where **the language is the data model**. Spanish is the
first pack; the engine never hardcodes Spanish, so a second language is a new
JSON file, not a new codebase.

Built for the thing Duolingo skips: you learn the **base form of a verb and all
six conjugations**, in a table you can actually read, then get drilled on it.

## Stack

Bun + TypeScript, Hono, htmx, vanilla JS. No frontend framework, no bundler,
no build step. 2 runtime dependencies.

```bash
bun install
bun run dev     # http://localhost:3000
bun test        # 199 tests
bun run typecheck
```

## Themes

Dark and light, switched by one variable block. The toggle sits in the nav and
persists to `localStorage`; with nothing saved it follows your OS setting. An
inline script in `<head>` applies the theme before the stylesheet loads, so it
never flashes.

Two rules keep light mode honest, both enforced by tests:

- `:root[data-theme="light"]` must override **every** colour variable. A missing
  override silently falls back to the dark value — dark text on a light
  background.
- No colour literal (`#hex`, `rgb()`) may appear outside the two variable
  blocks. That includes gradients and `color-mix()` tints, which is how
  `#ffd76a` in the progress bar would otherwise have stayed dark-theme gold.

`color-scheme` is set per theme so form controls and scrollbars follow.


## How it works

```
content/es.json          ← everything Spanish: words, verbs, rules, stories, chapters
src/engine/conjugation   ← generic: stem + ending = form
src/engine/quiz          ← generic: presents a question, grades an answer
src/engine/generate      ← generic: expands a lesson recipe into a full lesson
src/engine/content       ← loads + validates the pack, fails loudly at boot
src/server/languages.ts  ← discovers language packs by scanning content/
src/views/               ← template literals; escapes everything by default
src/server/              ← Hono routes, htmx partials
public/progress.js       ← chapter unlock rule (pure, runs in the browser)
public/app.js            ← DOM rendering + localStorage
public/styles.css        ← both themes
scripts/                 ← one-off content edits, kept for reference
```

### Routes

URLs are scoped by language so lesson ids can't collide between packs.

| Route | Page |
| --- | --- |
| `/` | Landing — pick a language |
| `/course/es` | Chapter index, with locked chapters inert |
| `/course/es/chapters/chapter-1` | One chapter's lessons |
| `/course/es/lessons/saludos` | One lesson |
| `/course/es/lessons/saludos/quiz` | Quiz (questions swapped in by htmx) |
| `/course/es/verbs` | Every verb, fully conjugated |
| `/api/es/quizzes/:id/question/:i` | One quiz question (`?attempt=`), or results at `i === total` |

### Chapters

The course is `chapters[]`, each holding `lessons[]`. Chapters are the top level;
there is no cross-chapter dependency, so they can be written and reordered
independently. Lesson ids are unique course-wide because they're used in URLs and
as progress keys.

```
chapters[0] → lessons[0..8]   (Chapter 1: greetings → numbers → colours → verbs → reading → review)
```

Progress rolls up per chapter and per course. Home shows every chapter with its
own completion bar; `/chapters/:id` shows one chapter.

### Generated lessons

A chapter of 20 conjugation lessons shouldn't mean hand-writing 20 quizzes. A
lesson can instead be a *recipe*:

```jsonc
{
  "id": "leer-drill",
  "order": 10,
  "source": {
    "kind": "generated",
    "generator": "verbDrill",
    "args": { "verbId": "leer" }
  }
}
```

At load time the engine expands it into a real lesson — a conjugation table plus
one question per persona — and validates the result like any authored lesson.
Generators only choose *what to include*; the words and conjugation forms still
come from the pack, so nothing generated can be linguistically wrong.

| Generator | Produces |
| --- | --- |
| `verbDrill` | Conjugation table for one verb + a question per persona. Args: `verbId`, `tenses` (comma-separated, defaults to all), `questionTense` (defaults to present), `personae` to focus, `extraQuestions` to append |
| `wordSet` | Flashcards for a set of words + questions alternating both directions |
| `storyReading` | A story passage + its comprehension questions |

## Roadmap shape

Target is ~10 chapters of 9-20 lessons, ramping in complexity. Chapter 1 exists
today. The generators exist so that a chapter of verb drills costs one line of
JSON per lesson instead of a hand-written quiz.

Suggested arc: 1 first contact → 2 everyday verbs → 3 the past → 4 the future &
conditionals → 5 ser vs estar → 6 everyday life (time, weather, food, shopping) →
7 work & study → 8 opinions and connectors → 9 longer reading → 10 consolidation.


### Conjugation is data, not code

The engine knows nothing about `-ar`/`-er`/`-ir`. It reads endings from the pack:

```jsonc
"present": {
  "patterns": {
    "ar": ["o", "as", "a", "amos", "áis", "an"],
    "er": ["o", "es", "e", "emos", "éis", "en"],
    "ir": ["o", "es", "e", "imos", "ís", "en"]
  }
}
```

A regular verb is just a stem and a pattern:

```jsonc
{ "id": "hablar", "stem": "habl", "pattern": "ar", ... }
```

An irregular verb adds overrides, which win over the rule:

```jsonc
{
  "id": "tener",
  "stem": "ten", "pattern": "er",
  "irregular": { "present": { "yo": "tengo" } }
}
```

Those cells get flagged `irregular` in the UI and coloured differently. Adding a
tense is one JSON block; adding a language is one file.

### Quiz types

| Type | What it does |
| --- | --- |
| `conjugation` | Shows verb + tense + persona, generates 3 distractors from *sibling forms of the same verb* first, so the question tests conjugation rather than recall |
| `choice` | Multiple choice |
| `fill` | Typed answer, accents optional (`estás` == `estas`) |

## Progress

See "Progress and unlocking" below for the storage shape and the unlock rule.
The theme is a separate key (`habla.theme`). Reset progress from the course page.

## Content

Ten lessons in Chapter 1:

1. Saludos — greetings, courtesy, small talk + story
2. Números — cero to mil, the `y` rule, hundreds and thousands + story
3. Fechas y hora — dates, telling the time, ordinals in brief + story
4. Colores — twelve colours, adjective agreement + story
5. Hablar — regular `-ar`, all six personae + story
6. Comer and vivir — `-er` and `-ir` + story
7. Ser, estar, ir, tener — the four everyday irregulars + story
8. Lectura: el mercado — longer reading
9. Lectura: la casa — `ser` vs `estar` in context
10. Repaso — mixed review

Every lesson that teaches new vocabulary or verbs ends with a short story built
from that lesson's own words, and those comprehension questions fold into the
lesson quiz rather than staying separate.

**Chapter 2 — Everyday verbs (10 lessons).** querer, decir, poder, saber, hacer,
dar, poner, venir, salir, ver, plus reflexives (me levanto, te quedas, se
ducha) and `ir a` / `tener que` + infinitive.

**Chapter 3 — The past (10 lessons).** The regular preterite, the imperfect,
choosing between them, the fifteen irregular preterites (fui, estuve, tuve,
hice, dije, pude), stem-changing `-ir` verbs in both past tenses, and two
readings written in narrative past.

**Chapter 4 — Future and conditionals (10 lessons).** The regular future, the
nine irregular future stems, `ir a` versus the future for plans and predictions,
the conditional as the politeness tool, both kinds of `si`-clause, and `hacer`
doing its three unrelated jobs.

Chapters 5-10 exist as locked shells with titles, blurbs and difficulty bands, so
the shape of the course is visible but not startable.

### Tenses, and not leaking them

`conjugation.tenses` defines present, preterite, imperfect, future and
conditional. A conjugation section declares which of those to *show*:

```jsonc
{ "type": "conjugation", "verbIds": ["hablar"], "tenses": ["preterite"] }
```

Chapters 1 and 2 pin this to `["present"]`. Without it, adding a tense to the pack
would have dropped a preterite table into Chapter 1 — a spoiler, not a feature. A
regression test asserts every published lesson in chapters 1-2 stays
present-only.

### The future needs the infinitive, not the stem

`hablar + é` is `hablaré`, not `hablé`. The future attaches its endings to the
whole infinitive, which is why `VerbEntry` has `stemByTense` — a per-tense stem
replacement that ignores the persona. Per-persona `stemChanges` can't express
this, and writing six entries for 26 verbs would be 156 lines of noise.

Seventeen stems are derived from the infinitive by the loader. Nine are
shortened: `tendré`, `podré`, `haré`, `diré`, `saldré`, `vendré`, `pondré`,
`sabré`, `querré`. The conditional is fully regular and shares every one of them.

This is the single easiest place to ship a wrong app: the future and preterite of
`hablar` differ by four characters and mean opposite things. Two tests guard it —
one asserting the future uses the infinitive while the preterite keeps the short
stem, one asserting the two tables differ for every persona.

The pack is validated at boot: dangling word/verb/story ids, duplicate ids
(course-wide for lessons), wrong ending counts, unknown chapter status, and
choice questions without exactly one correct answer all throw rather than
rendering a broken lesson.

### Content edits

The pack grew through one-off scripts in `scripts/`, each run once and kept for
reference: `add-numbers-dates.ts`, `add-stories.ts`, `add-lesson-stories.ts`.
They check for duplicate ids before writing; the pack validator is the backstop.

## Progress and unlocking

`localStorage`, namespaced per language (`habla.progress.v2`), because lesson ids
are only unique within a pack — `saludos` in Spanish must not collide with
`saludos` in French. The old flat `v1` shape is migrated on first load.

A chapter is selectable when the content released it (`status` is not `locked`)
**and** the previous chapter is complete: every lesson passed, average above 80%.
An empty chapter can never be complete — that is what stops the empty chapter 2-10
shells from cascade-unlocking everything after them.

Because progress lives in the browser, the server cannot evaluate that rule. It
lives in `public/progress.js`: pure, DOM-free, unit tested from
`tests/progress.test.ts`. The consequence worth knowing: **locking is a UI
affordance, not access control** — a locked chapter can still be reached by
typing its URL. Enforcing it server-side means progress on the server.

Quiz attempts *are* enforced server-side, so a client cannot post a fake score.

## Adding a language

1. Copy `content/es.json` to `content/fr.json`.
2. Translate the strings. Keep `conjugation.tenses[].patterns` — the endings.
3. `baseLang` stays `en`.
4. Restart the server.

`loadLanguages()` scans `content/*.json`, so nothing else is needed. A pack that
fails validation is skipped rather than fatal: the landing page still renders and
the error names the file.

## Known limits

- No subjunctive. `ojalá` and `esperar que` appear in readings but are not
  taught; `NOTES.md` has where that fits.
- Quiz attempts live in memory, so a server restart mid-quiz loses the run.
- Content is read at boot. Use `bun run dev` (`--hot`) while editing content.
- Chapter locking is client-side, so it deters but does not enforce (see above).
- No spaced repetition yet — mistakes aren't queued for later review.
- Chapters 5-10 are empty shells: titles, blurbs and difficulty only.
- No audio files; pronunciation uses the browser's speech synthesis.
- One verb reference view, covering the tenses in the pack.
