import { describe, expect, test } from "bun:test";
import { createApp } from "../src/server/app.ts";
import { loadLanguages } from "../src/server/languages.ts";

const catalog = await loadLanguages("content");
const app = createApp({ catalog });
const css = await Bun.file("public/styles.css").text();

/** Variable names declared inside a given at-rule block. */
function varsIn(selector: string): Set<string> {
  const start = css.indexOf(selector);
  expect(start).toBeGreaterThan(-1);
  const open = css.indexOf("{", start);
  const close = css.indexOf("\n}", open);
  const body = css.slice(open, close);
  return new Set([...body.matchAll(/^\s*(--[\w-]+):/gm)].map((m) => m[1]!));
}

/** Variables that are geometry, not colour, so themes may share them. */
const SHARED = new Set(["--radius"]);

describe("themes", () => {
  const dark = varsIn(":root {");
  const light = varsIn(':root[data-theme="light"] {');
  const colours = (vars: Set<string>) => [...vars].filter((n) => !SHARED.has(n));

  test("both themes declare variables", () => {
    expect(dark.size).toBeGreaterThan(10);
    expect(light.size).toBeGreaterThan(10);
  });

  test("light theme overrides every dark colour variable", () => {
    // A missing override silently falls back to the dark value, which is how
    // you end up with dark text on a light background.
    const missing = colours(dark).filter((name) => !light.has(name));
    expect(missing).toEqual([]);
  });

  test("light theme declares nothing dark-only", () => {
    const extra = colours(light).filter((name) => !dark.has(name));
    expect(extra).toEqual([]);
  });

  test("neither theme hardcodes colour outside the variable blocks", () => {
    const themeBlock = css.slice(0, css.indexOf("\n}\n", css.indexOf(':root[data-theme="light"]')) + 3);
    const rest = css.slice(themeBlock.length);
    const offenders = rest
      .split("\n")
      .map((line, i) => [i, line] as const)
      .filter(([, line]) => {
        if (!line.includes("color") && !line.includes("background") && !line.includes("border")) {
          return false;
        }
        return /#[0-9a-f]{3,8}\b/i.test(line) || /rgb\(/.test(line);
      })
      .map(([i, line]) => `line ${i}: ${line.trim()}`);
    expect(offenders).toEqual([]);
  });

  test("colour-mix tints derive from variables", () => {
    const mixes = [...css.matchAll(/color-mix\(in oklab, (var\(--[\w-]+\))/g)].map((m) => m[1]!);
    expect(mixes.length).toBeGreaterThan(3);
    for (const mix of mixes) {
      const name = mix.replace("var(", "").replace(")", "");
      expect(light.has(name)).toBe(true);
    }
  });

  test("both themes set color-scheme so form controls follow", () => {
    expect(css).toMatch(/color-scheme:\s*dark/);
    expect(css).toMatch(/color-scheme:\s*light/);
  });
});

describe("theme toggle", () => {
  const pages = [
    "/",
    "/course/es",
    "/course/es/verbs",
    "/course/es/chapters/chapter-1",
    "/course/es/lessons/saludos",
    "/course/es/lessons/saludos/quiz",
  ];

  test("every page has a toggle", async () => {
    for (const path of pages) {
      const html = await (await app.request(`http://localhost${path}`)).text();
      expect(html).toContain("data-theme-toggle");
      expect(html).toContain("data-theme-icon");
      expect(html).toContain("data-theme-label");
    }
  });

  test("the theme is applied before first paint, so it cannot flash", async () => {
    for (const path of pages) {
      const html = await (await app.request(`http://localhost${path}`)).text();
      const scriptAt = html.indexOf("habla.theme");
      const styleAt = html.indexOf('href="/styles.css"');
      expect(scriptAt).toBeGreaterThan(-1);
      // The inline script has to come before the stylesheet it themes.
      expect(scriptAt).toBeLessThan(styleAt);
      expect(html).toContain("prefers-color-scheme: light");
    }
  });

  test("the client script reads and writes the same key", async () => {
    const js = await Bun.file("public/app.js").text();
    expect(js).toContain('const THEME_KEY = "habla.theme"');
    expect(js).toContain("localStorage.setItem(THEME_KEY, theme)");
    expect(js).toContain("data-theme-toggle");
  });
});
