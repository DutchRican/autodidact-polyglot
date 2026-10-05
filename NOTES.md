# Content roadmap

Current state: 199 tests passing, typecheck clean. Chapters 1-4 complete
(40 lessons), five tenses. Every remaining item is self-contained and ends with a
green test run.

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

## Chapter 4 — Future and conditionals (next)

- [ ] **D9. Add future + conditional endings** to `conjugation.tenses`.
      Future: `é, ás, á, emos, éis, án` — identical for all three patterns.
      Conditional: `ía, ías, ía, íamos, íais, ían` — also identical for all three.
      NOTE: these are *different* ending sets. An earlier version of this file
      claimed the conditional reused the future endings; that is wrong.
      (Earlier version of D10 said the same thing — corrected below.)
      Display order: `present, preterite, imperfect, future, conditional`.
- [ ] **D10. The future needs the infinitive as its stem.** `hablar + é` must be
      `hablaré`, not `hablé` — so the future stem is the infinitive minus its
      ending, and the engine's base `stem` cannot express that.
      Add `stemByTense?: Record<string, string>` to `VerbEntry`: a per-tense
      replacement for the whole stem, ignoring the persona. Then a script can
      *derive* the future stem for every verb from its pattern, rather than 26
      hand-written entries.
      Only nine verbs have an irregular future stem: tener→tendr-, poder→podr-,
      hacer→har-, decir→dir-, salir→sald-, venir→vend-, poner→pondr-,
      saber→sabr-, querer→querr-.
      The conditional is fully regular and shares the future stems.
- [ ] **D11. Golden tables** for future on: hablar, comer, vivir, tener, poder,
      hacer, decir, saber, ir, and conditional on hablar, comer, ser, ir, ver.
- [ ] **D12. Author ~10 lessons**, publish chapter 4.

## Chapter 5 — ser and estar (next, and needs no new tenses)

This is a data-only chapter, so it is the cheapest remaining one to write.

- [ ] **D13. Add `tener`, `deber`, `poner` vocabulary** — plus the weather verbs
      (`llover`, `nevar`, `hacer`) and the emotion set that takes `estar`
      (`contento`, `aburrido`, `preocupado`, `enfermo`, `cansado`).
- [ ] **D14. Add a `serExamples` / `estarExamples` pair to `VerbEntry`** if the
      contrast needs to appear beside the table. Currently `notes` is a single
      string; if the lesson wants a two-column ser/estar comparison per persona,
      a structured field is cleaner than prose. Recommend adding it only if the
      table UI needs it — prose in `notes` may be enough.
- [ ] **D15. Author ~10 lessons**, publish chapter 5.
      Planned: ser recap · estar recap · ser vs estar location · ser vs estar
      condition · the verbs that flip (aburrirse, despertarse, acordarse) ·
      tener hambre/sueño/frío · tener que + noun · weather with hacer · 2
      readings · repaso.

## Chapters 6-10 — shells only, out of scope for now

Locked shells exist with titles/blurbs/levels. They need large vocabulary sets
(food, work, connectors) that the pack lacks.

## Verification checklist (run at the end of each group above)

- [ ] `bun test` — all green
- [ ] `bunx tsc --noEmit` — clean
- [ ] Server smoke: `/`, `/course/es`, every published chapter, every lesson
      returns 200; a locked chapter returns 200 but renders no link
- [ ] Spot-check one rendered story for stray English or broken punctuation
