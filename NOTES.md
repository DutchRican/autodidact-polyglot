# Content roadmap

Current state: 230 tests passing, typecheck clean. Chapters 1-6 complete
(60 lessons), five tenses, 290 words, 47 verbs, 19 stories. Every remaining item
is self-contained and ends with a green test run.

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
- [x] **D12.** Chapter 4's 10 lessons authored; chapter published.
- [x] **D8.** Per-section `tenses` filter so the past does not leak into
      chapters 1-2, wired through `conjugateAll`, the views and the generator.
- [x] **D9.** Future (`é, ás, á, emos, éis, án`) and conditional
      (`ía, ías, ía, íamos, íais, ían`) added. NOTE: these are *different*
      ending sets — an earlier version of this file claimed the conditional
      reused the future endings. That was wrong.
- [x] **D10.** `stemByTense` added to `VerbEntry`. The future attaches to the
      full infinitive (hablar + é = hablaré), not to the short stem, so
      per-persona `stemChanges` cannot express it. 17 stems derived from the
      infinitive, 9 shortened (tendr-, podr-, har-, dir-, saldr-, vendr-,
      pondr-, sabr-, querr-).
- [x] **D11.** Golden tables for the future (17 verbs) and conditional (10).
- [x] **D13-D15. Chapter 5** (ser and estar): the emotion set that
      takes estar, tener hambre/sueño/frío, tener que + noun, weather with
      hacer, and the verbs that flip (aburrirse, despertarse, acordarse). Ten
      lessons, published. Needed no new tenses.
      The `comparison` section type was added for it, because a paragraph can
      assert that ser and estar differ but cannot line the two up side by side,
      and a nullable side is the only way to show which verb owns a category.

## Chapter 6 — Everyday life (done)

Data-only chapter, like chapter 5: no new tenses. Published as 10 lessons
(60 lessons total, 6 chapters).

- [x] **D16. Vocabulary and verbs.** 45 new words (meals, food, restaurants,
      shops, money, weather) and 11 new verbs, each pinned in
      `tests/verbs.test.ts`.
- [x] **D17. Three more stem changes caught by the golden tables.**
      `encontrar` (o→ue: encuentras), `servir` (u→ie: sirves), and
      `costar` (o→ue on **all four** affected personae — cuesto, cuestas,
      cuesta, cuestan). `costar` is the interesting one: unlike
      querer/poder there is no g-form for yo, so the diphthong applies to yo
      too. This is exactly the trap the tables exist for, and it bit three
      times in one chapter.
- [x] **D18. `vender` and `cenar` added after an audit.** The lessons both
      taught and quizzed `vender`, which was not in the pack, and glossed
      `cenar` in prose. The validator does *not* catch this, and should not:
      the quiz asked "how do you say they sell bread" as a choice question, so
      `vender` appeared only inside an answer string, with no id for the
      validator to resolve. Section and conjugation-question references are
      checked; a related word in an option is not, and turning that into a hard
      error would be wrong. It was caught by hand, walking every lesson
      section and quiz and resolving each id — worth repeating per chapter.
- [x] **D19. Ten lessons authored**, including two readings whose questions fold
      into the lesson quiz.
- [x] **D20. `labelsLang` on comparison sections.** The view hardcoded
      `lang="es"` on the two column headings, which is right when they are
      infinitives (ser, estar) and wrong when a chapter labels its columns
      descriptively ("shop" against "sells"). Found in chapter 5 as well as
      chapter 6. Regression test asserts the declaration *and* the markup — and
      was verified to fail when the fix is reverted, because the first version
      of that assertion passed on the `<html lang="en">` tag instead.

## Chapters 7-10 — shells only, out of scope for now

Locked shells exist with titles/blurbs/levels. They need large vocabulary sets
the pack lacks (work and study, opinions and connectors, longer reading,
consolidation).


## Verification checklist (run at the end of each group above)

- [ ] `bun test` — all green
- [ ] `bunx tsc --noEmit` — clean
- [ ] Server smoke: `/`, `/course/es`, every published chapter, every lesson
      returns 200; a locked chapter returns 200 but renders no link
- [ ] Spot-check one rendered story for stray English or broken punctuation
