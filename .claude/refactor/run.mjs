#!/usr/bin/env node
// run.mjs — refactor loop driver (orchestrator-run on the mini).
// Thin mechanics only. The INTELLIGENCE (prompt authoring + self-evolution) lives in the
// Claude orchestrator loop; this script dispatches, gates, integrates, and tracks state.
//
// Commands:
//   node run.mjs next                       -> JSON of next runnable task (deps integrated, attempts<max)
//   node run.mjs dispatch <id>              -> run dispatch-cursor.mjs --worktree for <id> using out/<id>.md
//   node run.mjs integrate <id>            -> merge agent/<slug> into integration branch + run gates
//   node run.mjs set <id> <status> [note]  -> update status/attempts/note
//   node run.mjs report                     -> regenerate TASKS.md + PROGRESS.md
//   node run.mjs show <id>                  -> JSON of one task
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));         // .../provodnik/.claude/refactor
const TASKS = join(HERE, "tasks.json");
const OUT = join(HERE, "out");
const RUNS = join(HERE, "runs");
mkdirSync(OUT, { recursive: true });
mkdirSync(RUNS, { recursive: true });

const db = JSON.parse(readFileSync(TASKS, "utf8"));
const M = db.meta;
const WS = M.workspace;
const DISPATCH = M.dispatcher;

function save() { writeFileSync(TASKS, JSON.stringify(db, null, 2)); }
function task(id) { return db.tasks.find((t) => t.id === id); }
function slug(id) { return id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
  return { code: r.status ?? 1, out: (r.stdout || "").trim(), err: (r.stderr || "").trim() };
}
function git(args) { return sh("git", ["-C", WS, ...args]); }

const cmd = process.argv[2];
const id = process.argv[3];

if (cmd === "next") {
  const isDone = (t) => t.status === "integrated";
  const next = db.tasks.find(
    (t) => (t.status === "pending" || t.status === "failed") &&
      t.attempts < M.max_attempts &&
      (t.deps || []).every((d) => isDone(task(d))),
  );
  console.log(JSON.stringify(next ? { id: next.id, phase: next.phase, executor: next.executor, status: next.status, attempts: next.attempts, scope: next.scope, libs: next.libs || [], symbol: next.symbol, deps: next.deps, title: next.title } : { done: true }, null, 2));
  process.exit(0);
}

if (cmd === "show") { console.log(JSON.stringify(task(id), null, 2)); process.exit(task(id) ? 0 : 1); }

if (cmd === "set") {
  const t = task(id); if (!t) { console.error("no such task"); process.exit(1); }
  t.status = process.argv[4];
  const note = process.argv.slice(5).join(" ");
  if (note) t.note = note;
  save(); regen();
  console.log(`set ${id} -> ${t.status}`); process.exit(0);
}

if (cmd === "dispatch") {
  const t = task(id); if (!t) { console.error("no such task"); process.exit(1); }
  const promptFile = join(OUT, `${id}.md`);
  if (!existsSync(promptFile)) { console.error(`MISSING prompt file: ${promptFile} (orchestrator must author it first)`); process.exit(2); }
  t.attempts = (t.attempts || 0) + 1;
  t.status = "in_progress";
  save();

  const args = [DISPATCH, "--prompt-file", promptFile, "--workspace", WS, "--worktree", "--name", id, "--model", "auto", "--mcp", "context7"];
  for (const lib of (t.libs || [])) args.push("--lib", lib);
  if (t.symbol) args.push("--symbol", t.symbol);
  for (const s of (t.scope || [])) args.push("--scope", s);

  const started = new Date().toISOString().replace(/[:.]/g, "-");
  console.error(`[run] dispatch ${id} attempt ${t.attempts}: node ${args.join(" ")}`);
  const r = sh(process.execPath, args, { stdio: ["inherit", "inherit", "pipe"] });
  const stderr = r.err || "";
  const runRec = join(RUNS, `${id}-a${t.attempts}-${started}.json`);
  // Pull the gate summary lines the wrapper prints.
  const gateLines = stderr.split("\n").filter((l) => /\[gate\]|POST-DISPATCH GATES|All post-dispatch gates|FAILED:|context7-used|scope-guard|hygiene|non-empty|spec-diff|\[worktree\]/.test(l));
  const result = { id, attempt: t.attempts, exit: r.code, gates: gateLines, stderr_tail: stderr.split("\n").slice(-40).join("\n") };
  writeFileSync(runRec, JSON.stringify(result, null, 2));

  if (r.code === 0) { t.status = "passed"; }
  else { t.status = "failed"; t.last_failure = gateLines.join("\n") || `exit ${r.code}`; }
  save(); regen();
  console.log(JSON.stringify({ id, exit: r.code, status: t.status, gates: gateLines, run_record: runRec }, null, 2));
  process.exit(r.code === 0 ? 0 : 3);
}

if (cmd === "integrate") {
  const t = task(id); if (!t) { console.error("no such task"); process.exit(1); }
  const br = `agent/${slug(id)}`;
  // Ensure we are on the integration branch.
  git(["fetch", "origin", "--quiet"]);
  let cur = git(["rev-parse", "--abbrev-ref", "HEAD"]).out;
  if (cur !== M.integration_branch) {
    const co = git(["checkout", M.integration_branch]);
    if (co.code !== 0) { console.error(`cannot checkout ${M.integration_branch}: ${co.err}`); process.exit(1); }
  }
  // Merge the agent branch (no-ff to preserve task boundary). Conflicts -> abort + report.
  const mg = git(["merge", "--no-ff", "-m", `merge(${id}): ${t.title}`, br]);
  if (mg.code !== 0) {
    git(["merge", "--abort"]);
    t.status = "passed"; t.note = `integrate conflict: ${(mg.err || mg.out).slice(-300)}`;
    save(); regen();
    console.log(JSON.stringify({ id, integrated: false, reason: "merge_conflict", detail: (mg.err || mg.out).slice(-300) }, null, 2));
    process.exit(3);
  }
  // Orchestrator final verify on the integration branch.
  const checks = [];
  for (const c of (t.verify || ["bun run typecheck"])) {
    const parts = c.split(" ");
    const v = sh(parts[0], parts.slice(1), { cwd: WS, env: { ...process.env, PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}:/opt/homebrew/bin` } });
    checks.push({ cmd: c, code: v.code, tail: (v.out + "\n" + v.err).split("\n").slice(-15).join("\n") });
    if (v.code !== 0) {
      t.status = "failed"; t.last_failure = `integration verify failed: ${c}\n${checks.at(-1).tail}`;
      git(["reset", "--hard", "HEAD~1"]); // undo the merge so the branch stays green
      save(); regen();
      console.log(JSON.stringify({ id, integrated: false, reason: "verify_failed", checks }, null, 2));
      process.exit(3);
    }
  }
  // Clean up the worktree (agent branch already merged).
  sh("git", ["-C", WS, "worktree", "remove", "--force", join(process.env.HOME, "sdk-worktrees", "provodnik", slug(id))]);
  t.status = "integrated"; t.note = "merged to integration branch; gates green";
  save(); regen();
  appendFileSync(join(HERE, "INTEGRATED.log"), `${new Date().toISOString()} ${id} ${t.title}\n`);
  console.log(JSON.stringify({ id, integrated: true, checks }, null, 2));
  process.exit(0);
}

if (cmd === "report") { regen(); console.log("regenerated TASKS.md + PROGRESS.md"); process.exit(0); }

console.error("usage: run.mjs <next|show|dispatch|integrate|set|report> [id] ...");
process.exit(2);

function regen() {
  const byPhase = {};
  for (const t of db.tasks) (byPhase[t.phase] ||= []).push(t);
  const icon = (s) => ({ pending: "⬜", in_progress: "🔄", passed: "🟡", integrated: "✅", failed: "❌", blocked: "🛑" }[s] || "?");
  const phaseName = { 1: "Security & Correctness", 2: "Dead Weight", 3: "Error/Observability", 4: "Architecture", 5: "UI Quality", 6: "Performance", 7: "Tests/Docs" };
  let md = `# Provodnik Refactor — TASKS\n\n> Driver: \`.claude/refactor/run.mjs\`. Integration branch: \`${M.integration_branch}\`. **No push to origin/main without user approval.**\n> Legend: ⬜ pending · 🔄 in-progress · 🟡 gates-passed · ✅ integrated · ❌ failed · 🛑 blocked\n\n`;
  let counts = { pending: 0, in_progress: 0, passed: 0, integrated: 0, failed: 0, blocked: 0 };
  for (const ph of Object.keys(byPhase).sort()) {
    md += `## Phase ${ph} — ${phaseName[ph] || ""}\n\n| | id | task | exec | attempts | deps |\n|---|---|---|---|---|---|\n`;
    for (const t of byPhase[ph]) {
      counts[t.status] = (counts[t.status] || 0) + 1;
      md += `| ${icon(t.status)} | \`${t.id}\` | ${t.title} | ${t.executor} | ${t.attempts}/${M.max_attempts} | ${(t.deps || []).join(", ") || "—"} |\n`;
    }
    md += "\n";
  }
  writeFileSync(join(HERE, "TASKS.md"), md);

  const total = db.tasks.length;
  let prog = `# Provodnik Refactor — PROGRESS\n\nUpdated: ${new Date().toISOString()}\n\n`;
  prog += `**${counts.integrated || 0}/${total} integrated** · 🟡 ${counts.passed || 0} awaiting-integrate · 🔄 ${counts.in_progress || 0} · ❌ ${counts.failed || 0} · 🛑 ${counts.blocked || 0} · ⬜ ${counts.pending || 0}\n\n`;
  prog += `## Integrated\n`;
  for (const t of db.tasks.filter((t) => t.status === "integrated")) prog += `- ✅ \`${t.id}\` — ${t.title}\n`;
  prog += `\n## Failed / Blocked (need attention)\n`;
  for (const t of db.tasks.filter((t) => t.status === "failed" || t.status === "blocked")) prog += `- ${t.status === "blocked" ? "🛑" : "❌"} \`${t.id}\` (attempt ${t.attempts}/${M.max_attempts}) — ${t.title}\n  - ${(t.last_failure || t.note || "").split("\n").join(" / ").slice(0, 240)}\n`;
  writeFileSync(join(HERE, "PROGRESS.md"), prog);
}
