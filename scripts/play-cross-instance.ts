/**
 * End-to-end check that a quiz can be answered across *separate server
 * processes*, which is the shape of a serverless deploy.
 *
 * Starts two `bun src/server/index.ts` processes on different ports with the
 * same QUIZ_SECRET, loads the quiz page from one, answers every question
 * against the other, then reads the results back from the first. Every answer
 * lands on a process that has never seen the attempt.
 */
const SECRET = "cross-process-test-secret-value";
const env = { ...process.env, QUIZ_SECRET: SECRET, NODE_ENV: "production" };

const procs: Bun.Subprocess[] = [];
async function start(port: number) {
  const p = Bun.spawn(["bun", "src/server/index.ts"], {
    port,
    env: { ...env, PORT: String(port) },
    stdout: "pipe",
    stderr: "pipe",
  });
  procs.push(p);
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://localhost:${port}/`);
      if (r.ok) return p;
    } catch {}
    await Bun.sleep(100);
  }
  throw new Error(`server on ${port} never came up: ${await new Response(p.stderr).text()}`);
}

function die(msg: string): never {
  console.error("FAIL:", msg);
  for (const p of procs) p.kill();
  process.exit(1);
}

try {
  await start(4111);
  await start(4112);

  const lessonId = "hablar-presente";
  const page = await (await fetch(`http://localhost:4111/course/es/lessons/${lessonId}/quiz`)).text();
  let attempt = /data-attempt="([^"]+)"/.exec(page)?.[1];
  if (!attempt) die("no attempt token on quiz page");
  console.log(`attempt token: ${attempt.slice(0, 24)}... (${attempt.length} chars)`);

  const quizId = /\/quizzes\/([^/]+)\/question\/0/.exec(page)?.[1]!;
  const total = (page.match(/data-total="(\d+)"/)?.[1] ?? "0") as unknown as number;
  if (!total) die("no question count on quiz page");

  // Read the correct answers out of the pack, then grade against the server.
  const { loadLanguages } = await import("../src/server/languages.ts");
  const { indexPack } = await import("../src/engine/content.ts");
  const { conjugate } = await import("../src/engine/conjugation.ts");
  const catalog = await loadLanguages("content");
  const pack = catalog.packs.get("es")!;
  const lesson = indexPack(pack).lessons().find((l) => l.id === lessonId)!;

  for (let i = 0; i < total; i++) {
    const q = lesson.quiz.questions[i]!;
    const answer =
      q.type === "conjugation"
        ? conjugate(pack.verbs.find((v) => v.id === q.verbId)!, pack.conjugation, q.tense).forms[
            q.persona
          ]!
        : q.type === "choice"
          ? q.options.find((o) => o.correct)!.value
          : q.answer;

    // Question from instance B, answer to instance B.
    const asked = await fetch(
      `http://localhost:4112/api/es/quizzes/${quizId}/question/${i}?attempt=${attempt}`,
    );
    if (asked.status !== 200) die(`GET question ${i} -> ${asked.status}`);

    const revealed = await fetch(
      `http://localhost:4112/api/es/quizzes/${quizId}/reveal/${i}`,
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ attempt, response: answer }),
      },
    );
    if (revealed.status !== 200) {
      die(`POST reveal ${i} -> ${revealed.status} (this is the deployed bug)`);
    }
    const feedback = await revealed.text();
    if (feedback.includes('data-correct="false"')) die(`question ${i} graded wrong`);
    // The signed token is rotated by each reveal. Fall back to the previous one
    // when the response carries no token, so this script also runs against a
    // server that keeps attempts in memory -- where it should fail loudly.
    attempt = /data-attempt="([^"]+)"/.exec(feedback)?.[1] ?? attempt;
  }

  // Results read back from instance A, which only ever saw the first request.
  const results = await (
    await fetch(`http://localhost:4111/api/es/quizzes/${quizId}/question/${total}?attempt=${attempt}`)
  ).text();

  if (!results.includes(`${total}/${total}`)) die("results did not report a perfect score");
  if (!results.includes("Lesson complete")) die("quiz did not pass");
  console.log(`OK: ${total}/${total} answered across two separate processes, results verified`);
} finally {
  for (const p of procs) p.kill();
}