import type {
  ComparisonGroup,
  ConjugationTable,
  Persona,
  VerbEntry,
  WordEntry,
} from "../types.ts";
import { escapeHtml, html, raw, render, type SafeHtml } from "./layout.ts";

/** A conjugation table: base on top, then every persona. */
export function conjugationTable(opts: {
  verb: VerbEntry;
  tables: ConjugationTable[];
  personae: Persona[];
  baseLang: string;
  focusPersonae?: string[];
  showMeaning?: boolean;
}): SafeHtml {
  const { verb, tables, personae, baseLang, focusPersonae = [], showMeaning = true } = opts;

  return html`
    <div class="verb">
      ${showMeaning
        ? html`<div class="verb__gloss">${verb.translations[baseLang] ?? ""}</div>`
        : ""}
      <div class="verb__base">
        <span class="verb__label">${verb.infinitive}</span>
        ${verb.notes ? html`<span class="verb__note">${verb.notes}</span>` : ""}
      </div>
      <div class="tables">
        ${tables.map(
          (table) => html`
            <table class="ctable">
              <caption>${table.tenseLabel}</caption>
              <tbody>
                ${personae.map((persona) => {
                  const value = table.forms[persona.id] ?? "";
                  const isIrregular = persona.id in table.irregularForms;
                  const isFocus = focusPersonae.includes(persona.id);
                  return html`
                    <tr
                      class="${isIrregular ? "is-irregular" : ""} ${isFocus ? "is-focus" : ""}"
                    >
                      <th scope="row">
                        <span class="ctable__persona">${persona.label}</span>
                        ${isIrregular ? html`<span class="tag">irregular</span>` : ""}
                      </th>
                      <td>
                        <span class="ctable__form" lang="${opts.verb.infinitive}">${value}</span>
                        ${isIrregular
                          ? html`<button
                              class="speak"
                              type="button"
                              data-speak="${value}"
                              aria-label="Hear ${value}"
                            >
                              🔊
                            </button>`
                          : ""}
                      </td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
          `,
        )}
      </div>
    </div>
  `;
}

/** Flashcards for a vocabulary section. */
export function wordCards(words: WordEntry[], baseLang: string, kind = "words"): SafeHtml {
  return html`
    <div class="cards cards--${kind}">
      ${words.map(
        (word) => html`
          <button
            class="card"
            type="button"
            data-word="${escapeHtml(JSON.stringify({
              value: word.value,
              translations: word.translations[baseLang] ?? "",
            }))}"
            aria-label="Reveal meaning of ${word.value}"
          >
            <span class="card__front">
              <span class="card__value" lang="es">${word.value}</span>
              ${word.pronunciation
                ? html`<span class="card__pron">${word.pronunciation}</span>`
                : ""}
              <span class="card__hint">tap to reveal</span>
            </span>
            <span class="card__back">${word.translations[baseLang] ?? ""}</span>
          </button>
        `,
      )}
    </div>
  `;
}

/**
 * A two-verb comparison as a table.
 *
 * The point is alignment: the same meaning, side by side, so the reader sees
 * where the verbs agree and where swapping them changes the sentence. Prose
 * cannot do this — it can only assert the contrast, not lay it out.
 */
export function comparisonTable(opts: {
  leftLabel: string;
  rightLabel: string;
  groups: ComparisonGroup[];
  baseLang: string;
}): SafeHtml {
  const { leftLabel, rightLabel, groups } = opts;
  return html`
    <div class="comparison" role="table">
      <div class="comparison__head" role="row">
        <span class="comparison__cell comparison__cell--label" role="columnheader"></span>
        <span class="comparison__cell comparison__cell--verb" role="columnheader">
          <span class="comparison__verb" lang="es">${leftLabel}</span>
        </span>
        <span class="comparison__cell comparison__cell--verb" role="columnheader">
          <span class="comparison__verb" lang="es">${rightLabel}</span>
        </span>
      </div>
      ${groups.map(
        (group) => html`
          <div class="comparison__row" role="row">
            <span class="comparison__cell comparison__cell--label" role="rowheader">
              ${group.title}
            </span>
            <span class="comparison__cell ${group.left ? "" : "is-absent"}" role="cell">
              ${group.left
                ? html`
                    <span class="comparison__es" lang="es">${group.left}</span>
                    ${group.leftTranslation
                      ? html`<span class="comparison__en">${group.leftTranslation}</span>`
                      : ""}
                  `
                : html`<span class="comparison__na">not used for this</span>`}
            </span>
            <span
              class="comparison__cell ${group.right ? "" : "is-absent"}"
              role="cell"
            >
              ${group.right
                ? html`
                    <span class="comparison__es" lang="es">${group.right}</span>
                    ${group.rightTranslation
                      ? html`<span class="comparison__en">${group.rightTranslation}</span>`
                      : ""}
                  `
                : html`<span class="comparison__na">not used for this</span>`}
            </span>
            ${group.note
              ? html`<span class="comparison__note">${group.note}</span>`
              : ""}
          </div>
        `,
      )}
    </div>
  `;
}

/** A reading passage. Content words are clickable for a definition popover. */
export function storyView(opts: {
  title: string;
  titleTranslation: string;
  paragraphs: string[];
  glossary: Record<string, string>;
  baseLang: string;
}): SafeHtml {
  return html`
    <article class="story">
      <h3 class="story__title" lang="es">${opts.title}</h3>
      <p class="story__title-en">${opts.titleTranslation}</p>
      ${opts.paragraphs.map((p) => {
        // Keep leading/trailing punctuation outside the button so the word
        // reads normally: "familia." -> [familia][.]
        const rendered = p
          .split(/(\s+)/)
          .map((token) => {
            if (/^\s+$/.test(token)) return escapeHtml(token);
            const match = /^([^\w¡¿¿]*)([\wÁÉÍÓÚÜÑáéíóúüñ]+)([^\w]*)$/.exec(token);
            if (!match) return escapeHtml(token);
            const [, lead = "", word = "", trail = ""] = match;
            const meaning = opts.glossary[word.toLowerCase()];
            if (!meaning) return escapeHtml(token);
            const button = raw(
              `<button class="story__word" type="button" data-gloss="${escapeHtml(
                word.toLowerCase(),
              ).value}" data-meaning="${escapeHtml(meaning).value}">${escapeHtml(word).value}</button>`,
            );
            return html`${lead}${button}${trail}`;
          })
          .reduce<unknown[]>((acc, part) => acc.concat(part), []);
        return html`<p class="story__p" lang="es">${rendered}</p>`;
      })}
    </article>
  `;
}

export { html, escapeHtml, raw };
