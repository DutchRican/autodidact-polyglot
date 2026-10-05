# Content roadmap

Current state: 166 tests passing, typecheck clean. Chapters 1-3 complete
(30 lessons). Every remaining item is self-contained and ends with a green test
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
- [x] **D5.** Preterite + imperfect added to `conjugation.tenses`.
- [x] **D6.** Golden tables for preterite (22 verbs) and imperfect (6), plus 15
      irregular preterite tables and 3 irregular imperfects.
- [x] **D7.** Chapter 3's 10 lessons authored; chapter published.
- [x] **D8.** Per-section `tenses` filter so the past does not leak into
      chapters 1-2, wired through `conjugateAll`, the views and the generator.

## Chapter 4 — Future and conditionals (next)

- [ ] **D9. Add future + conditional endings** to `conjugation.tenses`.
      Future regular: `é, ás, á, emos, éis, án` for all three patterns.
      Conditional (same endings as future): identical set.
      These need `label` entries and to go after the past tenses in display
      order: `present, preterite, imperfect, future, conditional`.
- [ ] **D10. Add irregular future stems.** Spanish future is regular except a
      short list that all drop the infinitive ending: tener→tendr-, poder→podr-,
      hacer→har-, decir→dir-, salir→sald-, venir→vend-, poner→pond-, saber→sabr-.
      The engine has no "replace infinitive ending" concept yet — either add one
      (an `futureStem` on VerbEntry) or spell out six forms per verb.
      Recommend: add `futureStem` to the type. It is 5 lines and removes 40
      hand-written forms.
- [ ] **D11. Golden tables** for future on: hablar, comer, vivir, tener, poder,
      hacer, decir, and conditional on hablar + ir (ir as a conditional is fully
      irregular: iría, irías, iría, iríamos, iríais, irían).
- [ ] **D12. Author ~10 lessons**, publish chapter 4.

## Chapters 5-10 — shells only, out of scope for now

Locked shells exist with titles/blurbs/levels. Chapter 5 (ser vs estar) needs no
new tenses and could be done next if a data-only chapter is wanted sooner.
Chapters 6-10 need large vocabulary sets or connectives the pack lacks.

## Verification checklist (run at the end of each group above)

- [ ] `bun test` — all green
- [ ] `bunx tsc --noEmit` — clean
- [ ] Server smoke: `/`, `/course/es`, every published chapter, every lesson
      returns 200; a locked chapter returns 200 but renders no link
- [ ] Spot-check one rendered story for stray English or broken punctuation
