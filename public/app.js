// Progress lives in localStorage; everything else is server-rendered by htmx.
const KEY = "habla.progress.v1";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode, quota — progress is a nicety, not a requirement */
  }
}

/** lessonId -> { passed, ratio, at } */
function progress() {
  return read().lessons ?? {};
}

function record(lessonId, ratio) {
  const all = read();
  const prev = all.lessons?.[lessonId];
  all.lessons = {
    ...(all.lessons ?? {}),
    // Keep the best attempt, so retrying can't lose a pass.
    [lessonId]: {
      passed: Boolean(prev?.passed) || ratio >= 0.8,
      ratio: Math.max(prev?.ratio ?? 0, ratio),
      at: Date.now(),
    },
  };
  write(all);
  renderAll();
}

function lessonCount() {
  return document.querySelectorAll("[data-lesson-card]").length;
}

function renderAll() {
  const data = progress();

  for (const el of document.querySelectorAll("[data-lesson-score]")) {
    const id = el.getAttribute("data-lesson-score");
    const entry = data[id];
    if (!entry) {
      el.textContent = "";
      el.className = "lesson__score";
      continue;
    }
    el.textContent = `${Math.round(entry.ratio * 100)}%`;
    el.className = `lesson__score ${entry.passed ? "is-pass" : "is-partial"}`;
  }

  for (const el of document.querySelectorAll("[data-lesson-card]")) {
    const id = el.getAttribute("data-lesson-card");
    el.classList.toggle("is-done", Boolean(data[id]?.passed));
  }

  // Per-chapter progress, from the lesson cards that sit inside each chapter.
  for (const chapter of document.querySelectorAll("[data-chapter]")) {
    const cards = chapter.querySelectorAll("[data-lesson-card]");
    if (!cards.length) continue;
    let done = 0;
    for (const card of cards) {
      if (data[card.getAttribute("data-lesson-card")]?.passed) done++;
    }
    const pct = Math.round((done / cards.length) * 100);
    const bar = chapter.querySelector(".progress__fill");
    if (bar) bar.style.width = `${pct}%`;

    const score = document.querySelector(`[data-chapter-score="${chapter.dataset.chapter}"]`);
    if (score) {
      score.textContent = `${done} / ${cards.length}`;
      score.className = `chapter__score ${done === cards.length ? "is-pass" : ""}`;
    }
  }

  const total = lessonCount();
  if (!total) return;

  const passed = Object.values(data).filter((e) => e.passed).length;
  const pct = Math.round((passed / total) * 100);
  const bar = document.querySelector("[data-progress-bar] .progress__fill");
  if (bar) bar.style.width = `${pct}%`;
  const label = document.querySelector("[data-progress-label]");
  if (label) label.textContent = `${passed} / ${total} lessons · ${pct}%`;
  const summary = document.querySelector("[data-progress-summary]");
  if (summary) summary.textContent = passed ? `${pct}% complete` : "";
}

// Quiz progress bar (question N of total) — updated from the rendered question.
function renderQuizProgress() {
  const root = document.querySelector("[data-quiz-root]");
  if (!root) return;
  const q = document.querySelector("[data-question]");
  const results = document.querySelector("[data-results]");
  const total = Number(root.dataset.total ?? 0);
  if (!total) return;

  let done = 0;
  if (results) done = total;
  else if (q) done = Number(q.dataset.question ?? "0") + 1;

  const bar = document.querySelector(".quiz-progress .progress__fill");
  if (bar) bar.style.width = `${Math.round((done / total) * 100)}%`;
  const label = document.querySelector(".quiz-progress [data-progress-label]");
  if (label) label.textContent = `${Math.min(done, total)} / ${total}`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  renderQuizProgress();

  // Flashcards: click to flip.
  document.addEventListener("click", (event) => {
    const card = event.target.closest("[data-word]");
    if (card) {
      card.classList.toggle("is-flipped");
      return;
    }

    const gloss = event.target.closest("[data-gloss]");
    if (gloss) {
      event.stopPropagation();
      showGlossary(gloss.getAttribute("data-meaning"), gloss);
      return;
    }

    const speak = event.target.closest("[data-speak]");
    if (speak) {
      event.stopPropagation();
      speak(speak.getAttribute("data-speak"));
      return;
    }

    // Save a passing score. The server decided pass/fail; this only records it.
    const results = event.target.closest("[data-results]");
    if (results?.dataset.lesson) {
      record(results.dataset.lesson, Number(results.dataset.ratio ?? 0));
    }
  });

  // Enter submits the fill-in-the-blank answer.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const input = event.target.closest(".fill__input");
    if (input?.form) {
      event.preventDefault();
      input.form.requestSubmit();
    }
  });

  const reset = document.querySelector("[data-reset-progress]");
  reset?.addEventListener("click", () => {
    if (confirm("Delete all lesson progress?")) {
      write({ lessons: {} });
      renderAll();
    }
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

  // Keep it on screen.
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
  const voices = speechSynthesis.getVoices();
  const es = voices.find((v) => v.lang?.startsWith("es"));
  if (es) utterance.voice = es;
  speechSynthesis.speak(utterance);
}
