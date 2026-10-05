# Content roadmap

Current state: 420 tests passing, typecheck clean. Chapters 1-9 complete
(90 lessons), six tenses, 446 words, 74 verbs, 24 stories. Chapter 10 has a
reviewable plan and no lessons. Every remaining item is self-contained and ends
with a green test run.

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

- [x] **D21. `null` in a comparison group is a claim about the language, so
      audited every one of them course-wide.** A null side renders as "not used
      for this", which asserts the form does not exist. It is a good device —
      it is how the ser/estar table shows which verb owns a category — and it
      is also a trap, because "not taught yet" looks identical to "does not
      exist" in the data. Six were wrong:
        - `Está nublado` was filed under the **hacer** column while its own note
          said "a state, so estar", and the estar side was marked null.
        - `Está soleado` was offered as the everyday form for sun. It is
          `hace sol`, and that is on the hacer side.
        - `está asustado` exists, so the "afraid" row could not claim that
          ser/estar had no form for fear.
        - Chapter 6's restaurant politeness ladder used null to mean "not shown
          at this level". A ladder is not a positional contrast — all four
          orderings are valid — so it is now a text section.
        - Chapter 6's meals table nulled merienda because `meriendas` was
          untaught. Row dropped; desayuno, almuerzo and cena all have pinned
          verbs now.
      `ComparisonGroup.left/right` now documents the distinction in the type.
      Worth re-running this audit whenever comparison rows are authored.

## Chapter 7 — Work and study (done)

Ten lessons with readings. Added the vocabulary the chapter needs and no new
tense: the subjunctive was still two chapters away and chapter 7 had nothing to
pay off with.

## Chapter 8 — Opinions and connectors (done)

The chapter that cashes in the subjunctive. `ojalá` and `esperar que` had
appeared in a chapter 4 reading since chapter 4 shipped and were never
explained; lesson 1 is where that is fixed, and lesson 9's reading uses every
connector the chapter teaches.

## Chapter 9 — Longer reading (done)

The reading chapter: inference, register, suffixes, prefixes, modals, narrative
connectors, past-tense narration, and three long readings. The texts are about
170 words each with 4-5 glosses, against about twenty for a chapter 5 story,
which is the point — the learner is meant to work meaning out of context.

Five of the ten lessons teach the machinery for reading rather than grammar, so
the chapter has three conjugation sections in total (modals, and preterite
against imperfect) rather than the usual spread.

## Chapter 10 — Consolidation (planned, not written)

Ten lessons of outline, so the chapter is reviewable before it is written: the
past-tense decision rules, all six tenses against each other, the irregular
verbs, object pronouns, the imperative, `por` against `para`, `ser` and `estar`
again, timed reading, one long exam, and a closing note on what to study next.
The outline also covers the imperative, which no earlier chapter has.

## D22. Chapter 9 promoted ten verbs from words to conjugatable

The three long readings use `llegar` and `correr` constantly, and the lessons
name `sostener`, `sugerir`, `afirmar`, `permitir`, `impedir` and `anadir`.
Leaving them as `pos: "verb"` words with no verb entry meant a learner reading
"Marta llegó a casa" could not look the verb up in the reference page — and the
orphan-verb lint had climbed from 16 findings to 25 for exactly this reason.

All ten are regular, so they needed `stemByTense` for the future/conditional and
nothing else. Three were not regular in the way I first wrote them:

- `sugerir` is e→ie, and it reaches **yo** (`sugiero`) and keeps the change in
  the preterite third person (`sugirió`), not just tu/el/ellos in the present.
- `sostener` is g-insertion on yo (`sostengo`) plus e→ie, and its subjunctive
  follows the `-er` shape: `sostenga` but `sostenamos`.
- `impedir` is an orthographic e→i verb — `impido`, `impidió`, `impida` — with
  the imperfect the one place nothing happens.
- `coger` is g→j across the whole subjunctive (`coja`, `cojamos`), the same
  shape as the existing `seguir` → `sig`, while its present takes the j only on
  yo (`cojo`, `coges`).

## D23. A lint rule stated a falsehood, and was hiding a real bug behind it

`subjunctive-gar-ellos-takes-no-gu` asserted that a `-gar` verb's subjunctive
ellos form takes no gu. It is wrong: the form is *paguen* and *lleguen*, with the
gu. The rule fired on correct data — including chapter 9's own readings — and its
`includes("gu")` test could not tell *lleguen* from the genuinely wrong *lleguan*.

Worse, the rule only ever looked at `ellos`, so it never checked the five
personae where the gu *does* show. That is how the shipped pack kept `pagen` for
*pagar* — a form the verb reference had been showing as the correct answer to a
subjunctive question since chapter 2 shipped. The corrected `subjunctive-gar-orthography`
table found it immediately.

The rule has been deleted and the `gar` entry extended to all six personae, and
the test now proves the opposite direction from the one the old rule asserted:
five deliberately-wrong personae each have to fire, and the correct forms have to
pass.

This is the second time a lint rule has been wrong rather than the data (the
first was `subjunctive-plural-diphthonged` excluding `-ir`). Both times the rule
was confident, specific, and wrong, and both times the fix was to check the rule
against the RAE rather than argue with it.

## D24. A duplicated distractor in a shipped chapter 2 quiz

The duplicate-option scan found `ch2-saberes` offering `decís` twice — once as
the answer, once as a distractor — plus `deciís`, which is not a Spanish word.
A learner could not have got that question wrong. Replaced with `decen` and
`digo`, the two forms a learner actually reaches for by mistake.

The question lives in `extraQuestions` on a `verbDrill` recipe, because
generated lessons have no quiz object until they are expanded at load time.
Searching the raw JSON for `lesson.quiz` finds nothing for any generated lesson.

## D25. `scripts/play-chapter.ts` replaces hand-run quiz verification

Every chapter has been verified by playing its quizzes, but by hand and by
curl with guessed URLs — which is how a guessed URL produced 63 false failures
before the real route shape was read out of the markup. The script now follows
the browser's sequence: load the quiz page, read `data-attempt`, GET each
question, POST each answer to `hx-post`, GET the results. It reads the correct
answer out of the content and lets the server grade it, so a disagreement between
the two shows up as a failure.

Two things it caught that reading the routes did not:

- The attempt id is in `data-attempt`, and the page *also* contains an empty
  `attempt=` in the htmx template. Grepping for `attempt=` matches the template
  first and every question then 400s.
- The reveal URL is `hx-post`, not `action`.

All 90 quizzes, 700 questions, play clean through it.


## Verification checklist (run at the end of each group above)

- [x] `bun test` — 420 passing
- [x] `bunx tsc --noEmit` — clean
- [x] `bun scripts/play-chapter.ts` — 90 quizzes, 700 questions, 0 failures
- [x] Per-chapter character scan (`findTextProblems`) — 0
- [x] `lintPack` — 0 errors; 15 `review` findings, all orphan verb words
- [x] Duplicate-option scan over every `choice` question in the pack — 0
- [ ] Visual pass in a browser. **Still outstanding since chapter 6.** Layout,
      spacing, the Plan badge and the light palette have only ever been verified
      by HTML assertions, HTTP responses and contrast maths. No browser has been
      connected to this session, so this cannot be done from here.
