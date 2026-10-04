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
bun test        # 62 tests
bun run typecheck
```

## How it works

```
content/es.json          ← everything Spanish: words, verbs, rules, stories, chapters
src/engine/conjugation   ← generic: stem + ending = form
src/engine/quiz          ← generic: presents a question, grades an answer
src/engine/generate      ← generic: expands a lesson recipe into a full lesson
src/engine/content       ← loads + validates the pack, fails loudly at boot
src/views/               ← template literals; escapes everything by default
src/server/              ← Hono routes, htmx partials
public/                  ← app.js (localStorage progress), styles.css
```

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
| `verbDrill` | Conjugation table for one verb + a question per persona (`personae: "yo,ellos"` to focus) |
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

localStorage (`habla.progress.v1`): which lessons are passed and your best
score. Reset from the home page.

The server keeps quiz attempts in memory so a client can't post a fake score.
There's no account system; switching to SQLite later means replacing the store
and nothing else.

## Content

Nine lessons in Chapter 1: greetings → numbers → colours → `-ar` → `-er`/`-ir` →
the four irregulars (`ser`, `estar`, `ir`, `tener`) → two reading passages with
comprehension questions → a mixed review.

The pack is validated at boot: dangling word/verb/story ids, duplicate ids
(course-wide for lessons), wrong ending counts, and choice questions without
exactly one correct answer all throw rather than rendering a broken lesson.

## Adding a language

1. Copy `content/es.json` to `content/fr.json`.
2. Translate the strings. Keep `conjugation.tenses[].patterns` — the endings.
3. `baseLang` stays `en`.
4. Point `loadPack` at the new file in `src/server/app.ts`.

Nothing else changes. The validator will tell you what's still wrong.

## Known limits

- Present tense only. `preterite` and `future` endings were written and then
  removed to keep v1 tight; they're a copy-paste away in the rules block.
- Quiz attempts live in memory, so a server restart mid-quiz loses the run.
- Content is read at boot. Use `bun run dev` (`--hot`) while editing content.
- No spaced repetition yet — mistakes aren't queued for later review.
- Only Chapter 1 is populated. Chapters 2-10 are unbuilt.
