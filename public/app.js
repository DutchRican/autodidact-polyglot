// Progress lives in localStorage; everything else is server-rendered by htmx.
import {
  chapterRatio,
  courseSummary,
  isChapterComplete,
  resolveChapters,
} from "./progress.js";

const KEY = "habla.progress.v2";
const LEGACY_KEY = "habla.progress.v1";
const THEME_KEY = "habla.theme";

/* ---------- storage ----------
 * Shape: { lessons: { <langCode>: { <lessonId>: { passed, ratio, at } } } }
 * Namespaced per language because lesson ids are only unique within a pack —
 * "saludos" in Spanish must not collide with "saludos" in French.
 */

function readAll() {
  let data = {};
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = JSON.parse(raw);
  } catch {
    /* corrupt or unavailable */
  }
  return data.lessons ?? {};
}

function writeAll(byLanguage) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ lessons: byLanguage }));
  } catch {
    /* private mode or quota; progress is a nicety, not a requirement */
  }
}

/**
 * v1 stored every lesson in one flat map, which breaks the moment a second
 * language exists. Move it under the current language so existing progress
 * survives the upgrade.
 */
function migrateLegacy(lang) {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    const parsed = JSON.parse(legacy);
    const oldLessons = parsed?.lessons;
    if (!oldLessons || typeof oldLessons !== "object") return;

    const all = readAll();
    if (!all[lang]) {
      all[lang] = oldLessons;
      writeAll(all);
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* nothing to migrate */
  }
}

const lang = () => document.body.dataset.lang || "es";

function progress() {
  return readAll()[lang()] ?? {};
}

function record(lessonId, ratio, passed) {
  const all = readAll();
  const mine = { ...(all[lang()] ?? {}) };
  const prev = mine[lessonId];
  // Keep the best attempt, so retrying can't lose a pass.
  mine[lessonId] = {
    passed: Boolean(prev?.passed) || Boolean(passed),
    ratio: Math.max(prev?.ratio ?? 0, ratio),
    at: Date.now(),
  };
  all[lang()] = mine;
  writeAll(all);
  renderAll();
}

/* ---------- reading the page's own data ---------- */

/** Chapter shapes, from whatever chapter cards are on this page. */
function pageChapters() {
  return [...document.querySelectorAll("[data-chapter-card]")].map((el) => ({
    id: el.dataset.chapterCard,
    order: Number(el.dataset.chapterOrder ?? 0),
    status: el.dataset.status === "locked" ? "locked" : "published",
    lessonIds: (el.dataset.lessons || "").split(",").filter(Boolean),
  }));
}

/* ---------- rendering ---------- */

function renderAll() {
  const mine = progress();
  const chapters = pageChapters();

  // Lesson rows and per-lesson scores (chapter page, lesson list).
  for (const el of document.querySelectorAll("[data-lesson-score]")) {
    const entry = mine[el.getAttribute("data-lesson-score")];
    if (!entry) {
      el.textContent = "";
      el.className = "lesson__score";
      continue;
    }
    el.textContent = `${Math.round(entry.ratio * 100)}%`;
    el.className = `lesson__score ${entry.passed ? "is-pass" : "is-partial"}`;
  }

  for (const el of document.querySelectorAll("[data-lesson-card]")) {
    const entry = mine[el.getAttribute("data-lesson-card")];
    el.classList.toggle("is-done", Boolean(entry?.passed));
  }

  // Chapter cards: unlock state, progress, current badge.
  if (chapters.length) renderChapters(chapters, mine);

  // Overall course progress.
  const total = chapters.reduce((n, c) => n + c.lessonIds.length, 0);
  if (total) {
    const done = chapters.reduce(
      (n, c) => n + c.lessonIds.filter((id) => mine[id]?.passed).length,
      0,
    );
    setProgressBar("[data-progress-bar]", done / total);
    setText("[data-progress-label]", `${done} / ${total} lessons · ${Math.round((done / total) * 100)}%`);
    const summary = document.querySelector("[data-progress-summary]");
    if (summary) summary.textContent = done ? `${Math.round((done / total) * 100)}% complete` : "";
  }
}

function renderChapters(chapters, mine) {
  const states = resolveChapters(chapters, mine);
  const byId = new Map(states.map((s) => [s.id, s]));

  for (const card of document.querySelectorAll("[data-chapter-card]")) {
    const state = byId.get(card.dataset.chapterCard);
    if (!state) continue;

    card.classList.toggle("is-locked", !state.open);
    card.classList.toggle("is-current", state.current);
    card.classList.toggle("is-done", state.complete);

    // Take the href away rather than disabling it: a disabled anchor is still
    // focusable, still middle-clickable, and looks clickable.
    const link = card.querySelector("[data-chapter-link]");
    if (link) {
      if (state.open) link.href = card.dataset.chapterHref ?? link.href;
      else link.removeAttribute("href");
      card.setAttribute("aria-disabled", String(!state.open));
    }

    const badge = card.querySelector("[data-current-badge]");
    if (badge) badge.hidden = !state.current;

    const lockedBadge = card.querySelector("[data-locked-badge]");
    if (lockedBadge) lockedBadge.hidden = state.open;

    const score = card.querySelector(`[data-chapter-score="${state.id}"]`);
    if (score) {
      score.textContent = state.total ? `${state.done} / ${state.total}` : "";
      score.className = `chapter-card__score ${state.complete ? "is-pass" : ""}`;
    }

    const soon = card.querySelector("[data-chapter-soon]");
    if (soon) {
      soon.textContent = !state.released
        ? "not released yet"
        : `finish chapter ${state.order - 1} to unlock`;
    }

    setProgressBar(
      card.querySelector(".progress"),
      state.total ? state.done / state.total : 0,
    );
  }

  // Chapter page header: "done / total" for just this chapter.
  const chapterScore = document.querySelector("[data-chapter-score-only]");
  if (chapterScore) {
    const id = chapterScore.getAttribute("data-chapter-score-only");
    const state = byId.get(id);
    if (state) chapterScore.textContent = `${state.done} / ${state.total} lessons`;
  }
}

function setProgressBar(scope, ratio) {
  const bar =
    typeof scope === "string" ? document.querySelector(scope) : scope;
  const fill = bar?.querySelector(".progress__fill") ?? bar;
  if (fill) fill.style.width = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
}

function setText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

/* ---------- quiz progress (question N of total) ---------- */

function renderQuizProgress() {
  const root = document.querySelector("[data-quiz-root]");
  if (!root) return;
  const total = Number(root.dataset.total ?? 0);
  if (!total) return;

  const q = document.querySelector("[data-question]");
  const results = document.querySelector("[data-results]");
  const done = results ? total : q ? Number(q.dataset.question ?? "0") + 1 : 0;

  setProgressBar(".quiz-progress .progress", done / total);
  setText(".quiz-progress [data-progress-label]", `${Math.min(done, total)} / ${total}`);
}

/* ---------- theme ---------- */

function currentTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* theme just won't persist */
  }
  const icon = document.querySelector("[data-theme-icon]");
  if (icon) icon.textContent = theme === "light" ? "☀️" : "🌙";
  const label = document.querySelector("[data-theme-label]");
  if (label) label.textContent = theme === "light" ? "Light" : "Dark";
  document
    .querySelector("[data-theme-toggle]")
    ?.setAttribute("aria-pressed", String(theme === "light"));
}

/* ---------- wiring ---------- */

document.addEventListener("DOMContentLoaded", () => {
  migrateLegacy(lang());
  applyTheme(currentTheme());
  renderAll();
  renderQuizProgress();

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest("[data-theme-toggle]")) {
      applyTheme(currentTheme() === "light" ? "dark" : "light");
      return;
    }

    const card = target.closest("[data-word]");
    if (card) {
      card.classList.toggle("is-flipped");
      return;
    }

    const gloss = target.closest("[data-gloss]");
    if (gloss) {
      showGlossary(gloss.getAttribute("data-meaning"), gloss);
      return;
    }

    const speak = target.closest("[data-speak]");
    if (speak) {
      speak(speak.getAttribute("data-speak"));
      return;
    }

    // Save a passing score. The server decided pass/fail; this only records it.
    const results = target.closest("[data-results]");
    if (results?.dataset.lesson) {
      record(
        results.dataset.lesson,
        Number(results.dataset.ratio ?? 0),
        results.dataset.passed === "true",
      );
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const input = event.target instanceof Element ? event.target.closest(".fill__input") : null;
    if (input instanceof HTMLInputElement && input.form) {
      event.preventDefault();
      input.form.requestSubmit();
    }
  });

  document.querySelector("[data-reset-progress]")?.addEventListener("click", () => {
    if (!confirm("Delete all lesson progress?")) return;
    const all = readAll();
    delete all[lang()];
    writeAll(all);
    renderAll();
  });

  // Follow the OS only while the learner hasn't made an explicit choice.
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
    let stored = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch {}
    if (!stored) applyTheme(e.matches ? "light" : "dark");
  });
});

// htmx swaps fragments in; re-render the bars for whatever just landed.
document.body?.addEventListener("htmx:afterSwap", () => {
  renderQuizProgress();
  renderAll();
});

function showGlossary(meaning, anchor) {
  document.querySelector(".gloss-pop")?.remove();
  const pop = document.createElement("span");
  pop.className = "gloss-pop";
  pop.textContent = meaning ?? "";
  document.body.appendChild(pop);

  const rect = anchor.getBoundingClientRect();
  const top = rect.bottom + window.scrollY + 6;
  let left = rect.left + window.scrollX;
  pop.style.top = `${top}px`;
  pop.style.left = `${left}px`;

  requestAnimationFrame(() => {
    const width = pop.offsetWidth;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
      pop.style.left = `${left}px`;
    }
  });

  const close = (e) => {
    if (!pop.contains(e.target) && e.target !== anchor) {
      pop.remove();
      document.removeEventListener("click", close, true);
    }
  };
  setTimeout(() => document.addEventListener("click", close, true), 0);
}

/** Free text-to-speech; no audio files, no dependencies. */
function speak(text) {
  if (!text || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  utterance.rate = 0.85;
  const es = speechSynthesis.getVoices().find((v) => v.lang?.startsWith("es"));
  if (es) utterance.voice = es;
  speechSynthesis.speak(utterance);
}
