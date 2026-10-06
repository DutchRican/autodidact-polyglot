import { buildApp } from "./server/app.ts";

const app = await buildApp();
const port = Number(process.env["PORT"] ?? 3000);

// Vercel's Bun preset picks up this Bun.serve() call at module scope.
// `port`/`hostname` only matter when running locally (`bun run dev`).
Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`autodidact-polyglot → http://localhost:${port}`);
