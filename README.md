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
bun test        # 44 tests
bun run typecheck
```

## How it works

```
content/es.json          ← everything Spanish: words, verbs, rules, stories, lessons
src/engine/conjugation   ← generic: stem + ending = form
src/engine/quiz          ← generic: presents a question, grades an answer
src/engine/content       ← loads + validates the pack, fails loudly at boot
src/views/               ← template literals; escapes everything by default
src/server/              ← Hono routes, htmx partials
public/                  ← app.js (localStorage progress), styles.css
```

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

Nine lessons: greetings → numbers → colours → `-ar` → `-er`/`-ir` → the four
irregulars (`ser`, `estar`, `ir`, `tener`) → two reading passages with
comprehension questions → a mixed review.

The pack is validated at boot: dangling word/verb/story ids, duplicate ids,
wrong ending counts, and choice questions without exactly one correct answer all
throw rather than rendering a broken lesson.

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
- No spaced repetition yet — mistakes aren't queued for later review.
