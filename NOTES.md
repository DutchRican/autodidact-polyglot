# Content roadmap

Current state: 125 tests passing, typecheck clean, Chapter 1 complete.
Every item below is self-contained. Each ends with a green test run.

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

## Now (in flight)

- [ ] **D1. Fix `manana2` / `mañana2` mismatch** in `scripts/add-ch2-content.ts`
      - The word list has id `mañana2` (with tilde); both stories reference
        `manana2`. "la mañana" already exists as id `manana` — use that id in the
        glossary and drop the duplicate word entirely.
      - Then run `bun scripts/add-ch2-content.ts` and confirm it validates.
- [ ] **D2. Commit Chapter 2 verbs + vocabulary** once D1 is green.

## Chapter 2 — Everyday verbs (10 lessons)

Verbs and vocabulary are already added. Only the lessons are missing.

- [ ] **D3. Author the 10 lessons** into `chapter-2.lessons`, then set
      `chapter-2.status = "published"`.
      Planned shape (conjugation drills via the `verbDrill` generator, so each
      costs one line of JSON):
      1. `ch2-querer-decir` — the two most frequent verbs
      2. `ch2-poder-saber` — ability vs knowledge (the classic confusion)
      3. `ch2-hacer-dar` — hacer as a weather verb
      4. `ch2-venir-salir` — motion, with the e→ie stem change
      5. `ch2-reflexivos` — new: `reflexivePronouns`, me/te/se/nos/os
      6. `ch2-futuro-inmediato` — `ir a` + infinitive
      7. `ch2-obligacion` — `tener que` + infinitive
      8. `ch2-lectura-cafe` — story: *En el café* (data ready)
      9. `ch2-lectura-rutina` — story: *La rutina* (data ready)
      10. `ch2-repaso` — mixed review
- [ ] **D4. Add a server test** that every published chapter has >= 1 lesson and
      every lesson has a quiz. Catches an empty chapter slipping through.

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
