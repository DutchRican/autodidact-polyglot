# Content roadmap

Current state: 128 tests passing, typecheck clean. Chapters 1 and 2 complete
(20 lessons). Every remaining item is self-contained and ends with a green test
run.

Rules I'm holding to, so you don't have to check my work:
- One focused edit per step. No multi-KB `edit` calls on JSON — use a script in
  `scripts/`, or small targeted edits.
- Run `bun test` after every content change, not at the end.
- A Spanish verb is only correct if a golden-table row in
  `tests/verbs.test.ts` pins it. New verb => add the row.
- Never leave a placeholder, TODO, or partial sentence in content.
- Content ids (`word.id`, `verb.id`, `lesson.id`, `story.id`) are unique
  course-wide. Scripts check before writing; the validator is the backstop.

---

## Done

- [x] **D1.** `manana2` / `mañana2` mismatch — use the existing `manana` id.
- [x] **D2.** Chapter 2 verbs + vocabulary committed.
- [x] **D3.** Chapter 2's 10 lessons authored; chapter published.
- [x] **D4.** Server test: every published chapter has >= 1 lesson, each lesson
      has sections and a quiz, quiz id is `<lessonId>-quiz`.

## Chapter 3 — The past (needs data before lessons)

- [ ] **D5. Add preterite + imperfect endings** to `conjugation.tenses` in
      `content/es.json`. Preterite is already written and correct; imperfect is
      **not** written yet and needs care:
      `-ar: aba, abas, aba, ábamos, abais,aban` ·
      `-er/-ir: ía, ías, ía, íamos, íais, ían`
- [ ] **D6. Add golden tables** for preterite on: hablar, comer, vivir, ser,
      ir, tener, estar. Spanish preterite is genuinely irregular (`tuve`,
      `estuve`, `fui`, `hiciste`) — these need `irregular` overrides per tense.
- [ ] **D7. Author the lessons**, then publish chapter 3.

## Chapters 4-10 — shells only, out of scope for now

Locked shells exist with titles/blurbs/levels. They need content before they can
be published, and chapters 4-10 also need tenses that don't exist yet
(future, conditionals) or large vocabulary sets. Leaving them locked is
correct behaviour, not a gap.

## Verification checklist (run at the end of each group above)

- [ ] `bun test` — all green
- [ ] `bunx tsc --noEmit` — clean
- [ ] Server smoke: `/`, `/course/es`, every published chapter, every lesson
      returns 200; a locked chapter returns 200 but renders no link
- [ ] Spot-check one rendered story for stray English or broken punctuation
