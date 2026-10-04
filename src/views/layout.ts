/** Tiny HTML helpers. No framework, no templating engine, no build step. */

/** Markup that is known to be safe: produced by `html` or wrapped in `raw`. */
export class SafeHtml {
  constructor(readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

/**
 * Escape a value for use in HTML text or an attribute. The result is SafeHtml,
 * so nesting it inside `html` does not escape it a second time.
 */
export function escapeHtml(value: unknown): SafeHtml {
  return new SafeHtml(
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;"),
  );
}

/** Opt out of escaping for markup you built yourself. */
export function raw(value: string): SafeHtml {
  return new SafeHtml(value);
}

function isSafe(value: unknown): value is SafeHtml {
  return value instanceof SafeHtml;
}

/** Escape everything that is not already safe markup. */
export function render(value: unknown): string {
  if (value == null || value === false || value === true) return "";
  if (Array.isArray(value)) return value.map(render).join("");
  if (isSafe(value)) return value.value;
  return escapeHtml(value).value;
}

/**
 * Tagged template that escapes every interpolation. Returns SafeHtml so that
 * nested `html` calls are not escaped a second time.
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): SafeHtml {
  let out = strings[0] ?? "";
  for (let i = 0; i < values.length; i++) {
    out += render(values[i]) + (strings[i + 1] ?? "");
  }
  return new SafeHtml(out);
}

export const h = html;
