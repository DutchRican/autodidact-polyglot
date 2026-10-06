import { buildApp } from "./app.ts";

const app = await buildApp();
const port = Number(process.env["PORT"] ?? 3000);

export default {
  port,
  fetch: app.fetch,
};

console.log(`autodidact-polyglot → http://localhost:${port}`);
