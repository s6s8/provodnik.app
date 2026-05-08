# BEK v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Per project CLAUDE.md §22, the implementer is **cursor-agent via `cursor-dispatch.mjs`**, not a generic Claude subagent.

**Goal:** Ship BEK v2 — five capabilities from the design spec — across 15 cursor-agent tasks: relocate runtime + source + SOT to `_archive/bek-frozen-2026-05-08/`, port source to TypeScript, add observability HTTP server, auto-retry transient errors, and structured incident records with a postmortem CLI.

**Architecture:** BEK stays on the `claude` CLI subprocess runtime. Phase 1 moves all writeable BEK artifacts out of `.claude/` to `_archive/bek-frozen-2026-05-08/` (eliminates Claude CLI 2.1.119's `.claude/**` self-protect class of failure). Phase 2 ports `_archive/bek-frozen-2026-05-08/src/` from `.mjs` to `.ts` running via `tsx --import` — no compile step, shared types for sessions/heartbeats/stream events/incidents. Phases 3-5 add a retry wrapper, structured `incidents.jsonl` with `bek-postmortem` CLI, and a localhost-only HTTP observability server on port 3939. Phase 6 closes out SOT.

**Tech Stack:** Node v24 ESM, gramio 0.9, p-queue 9, PM2; new deps `tsx ^4` (TypeScript runtime loader), `zod ^4` (stream-json input validation), `@types/node`. Tests via `node:test`. Observability server uses Node stdlib `http` only — no Express. Build: none — `tsx` runs `.ts` directly.

**Design spec:** [docs/superpowers/specs/2026-04-25-bek-v2-design.md](../specs/2026-04-25-bek-v2-design.md)

**Context7 research:**
- `tsx` `/privatenumber/tsx` — `node --import tsx ./file.ts` (Node ≥20.6) — https://github.com/privatenumber/tsx
- `zod` `/colinhacks/zod` — `z.object({}).parse()` / `.safeParse()` discriminated-union result — https://github.com/colinhacks/zod

---

## Dependency DAG

```
T1 (_archive/bek-frozen-2026-05-08/ filesystem move + source paths) ─┐
                                            ├─> T3 (TS bootstrap + types)
T2 (orchestrator refs + .gitignore) ────────┘             │
   parallel-safe with T1                                  │
                                                          ├─> T4 (leaves)
                                                          ├─> T5 (mid: prompt/commands/tg)
                                                          ├─> T6 (hb/stream/session)
                                                          └─> T7 (attachments/voice)
                                                                    │
                                                          T4-T7 parallel after T3
                                                                    │
                                                                    v
                                              T8 (claude-runner + helpers)
                                                                    │
                                                                    v
                                              T9 (watchdog + watchdog-run)
                                                                    │
                                                                    v
                                              T10 (bek-daemon + ecosystem→tsx + smoke)
                                                                    │
                                                                    v
                                              T11 (retry.ts + wire into daemon)
                                                                    │
                                                                    v
                                              T12 (incidents.jsonl + postmortem CLI)
                                                                    │
                                                                    v
                                              T13 (observability server module)
                                                                    │
                                                                    v
                                              T14 (observability dashboard HTML + SSE)
                                                                    │
                                                                    v
                                              T15 (SOT: ADR-024 + ERR-046 + AP-020)
```

## Merge order

1. **Task 1** — branch `feat/bek-v2-task-1-migration` — filesystem move + BEK source path constants.
2. **Task 2** — branch `feat/bek-v2-task-2-orchestrator-refs` — CLAUDE.md, MEMORY, SOT body refs, .gitignore. **Parallel-safe with Task 1.**
3. **Task 3** — branch `feat/bek-v2-task-3-ts-bootstrap` — tsconfig, deps, npm scripts, shared types/.
4. **Task 4** — branch `feat/bek-v2-task-4-port-leaves` — logger, sanitizer, metrics, whisper, memory, config + tests.
5. **Task 5** — branch `feat/bek-v2-task-5-port-mid` — system-prompt, commands, telegram-helpers + tests. **Parallel-safe with T4, T6, T7 after T3.**
6. **Task 6** — branch `feat/bek-v2-task-6-port-hb-stream-session` — heartbeat, stream-log, session-manager + tests. **Parallel-safe with T4, T5, T7 after T3.**
7. **Task 7** — branch `feat/bek-v2-task-7-port-media` — attachments, voice + tests. **Parallel-safe with T4, T5, T6 after T3.**
8. **Task 8** — branch `feat/bek-v2-task-8-port-runner` — claude-runner + bek-daemon-helpers + tests. Requires T6 + T7 merged.
9. **Task 9** — branch `feat/bek-v2-task-9-port-watchdog` — bek-watchdog + bek-watchdog-run + tests. Requires T6 merged.
10. **Task 10** — branch `feat/bek-v2-task-10-port-daemon` — bek-daemon + ecosystem.config.cjs (`node --import tsx ...`) + smoke. Requires T8 + T9 merged.
11. **Task 11** — branch `feat/bek-v2-task-11-retry` — retry.ts + retry.test.ts + wire into daemon.
12. **Task 12** — branch `feat/bek-v2-task-12-incidents` — incidents.ts + types/incident.ts + tools/postmortem.ts + tests + wire into watchdog/daemon.
13. **Task 13** — branch `feat/bek-v2-task-13-obs-server` — observability/server.ts + server-run.ts + routes.ts + queue-status writer in daemon + ecosystem app block.
14. **Task 14** — branch `feat/bek-v2-task-14-obs-dashboard` — observability/public/index.html + SSE tail + obs tests.
15. **Task 15** — branch `feat/bek-v2-task-15-sot` — ADR-024 + ERR-046 + AP-020 + supersede ERR-045/AP-019 + INDEX updates.

Sequential execution: 1 → 2 → 3 → (4 ∥ 5 ∥ 6 ∥ 7) → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15. The four parallel tasks after T3 can either be dispatched in one batch (with separate worktrees) or one at a time — both work.

---

## Task summary

### Task 1 — `_archive/bek-frozen-2026-05-08/` filesystem move + BEK source path constants
Prompt: `.claude/prompts/out/bek-v2-task-1.md` (then moved to `_archive/bek-frozen-2026-05-08/prompts/out/bek-v2-task-1.md` as the migration script runs)
Summary: Atomic file move from `.claude/{bek,bek-sessions,prompts,sot,checklists}/` and `.claude/logs/bek-*` to `_archive/bek-frozen-2026-05-08/{src,sessions,prompts,sot,checklists,logs}/`. Update path constants in `_archive/bek-frozen-2026-05-08/src/{bek-daemon-helpers,heartbeat,bek-watchdog,bek-daemon,bek.config.json,ecosystem.config.cjs,system-prompt}.mjs`. PM2 stop → mv → start. Verify daemon boots from new layout and writes `current.log` under `_archive/bek-frozen-2026-05-08/logs/stream/`.

### Task 2 — Orchestrator + SOT body cross-references + .gitignore
Prompt: `.claude/prompts/out/bek-v2-task-2.md`
Depends on: nothing — parallel-safe with Task 1
Summary: Sweep `.claude/CLAUDE.md` and `~/.claude/projects/D--dev2-projects-provodnik/memory/*.md` for old `.claude/{sot,bek,bek-sessions,prompts,logs/bek-,logs/devnote-}` references and replace with `_archive/bek-frozen-2026-05-08/...`. Update SOT entry bodies in HOT, ERRORS, ANTI_PATTERNS, DECISIONS where they cite paths. Update `.gitignore` to track `_archive/bek-frozen-2026-05-08/` per-subdirectory rules. No code touched.

### Task 3 — TypeScript bootstrap + shared types
Prompt: `.claude/prompts/out/bek-v2-task-3.md` (now under `_archive/bek-frozen-2026-05-08/prompts/out/` after Task 1)
Depends on: Task 1 merged
Summary: Add `_archive/bek-frozen-2026-05-08/src/tsconfig.json` (NodeNext, strict, `noEmit`). Install `tsx ^4`, `zod ^4`, `@types/node`. Update `_archive/bek-frozen-2026-05-08/src/package.json` scripts. Create `_archive/bek-frozen-2026-05-08/src/types/{phase,heartbeat,session,stream-event}.ts` exporting the shared types per spec §5.4. Pure additions; no `.mjs` file is touched in this task. `npx tsc --noEmit` clean against the new types directory.

### Task 4 — Port leaves: logger, sanitizer, metrics, whisper, memory, config
Prompt: `.claude/prompts/out/bek-v2-task-4.md`
Depends on: Task 3 merged
Summary: 1:1 port of `_archive/bek-frozen-2026-05-08/src/{logger,sanitizer,metrics,whisper,memory,config}.mjs` → `.ts`. Port matching test files. Type the function signatures with no behavior change. Verify `node --test` (via `tsx --import`) green.

### Task 5 — Port mid: system-prompt, commands, telegram-helpers
Prompt: `.claude/prompts/out/bek-v2-task-5.md`
Depends on: Task 3 merged. Parallel-safe with Task 4, Task 6, Task 7.
Summary: 1:1 port + tests. Update `system-prompt.ts` to point inner Claude at `_archive/bek-frozen-2026-05-08/prompts/out/` (any leftover `.claude/prompts/out/` references). No behavior change.

### Task 6 — Port heartbeat, stream-log, session-manager
Prompt: `.claude/prompts/out/bek-v2-task-6.md`
Depends on: Task 3 merged. Parallel-safe with Task 4, Task 5, Task 7.
Summary: 1:1 port + tests. Use shared `Heartbeat`, `Session`, `StreamEvent` types from `_archive/bek-frozen-2026-05-08/src/types/`. SessionManager uses `Session` type for read/write payloads.

### Task 7 — Port attachments, voice
Prompt: `.claude/prompts/out/bek-v2-task-7.md`
Depends on: Task 3 merged. Parallel-safe with Task 4, Task 5, Task 6.
Summary: 1:1 port + tests. Type the gramio context and the streaming downloader.

### Task 8 — Port claude-runner + bek-daemon-helpers
Prompt: `.claude/prompts/out/bek-v2-task-8.md`
Depends on: Task 6 + Task 7 merged
Summary: Port `claude-runner.mjs` and `bek-daemon-helpers.mjs` to `.ts`. Add Zod schema (`z.object`) for the parsed stream-json chunks (`init`, `assistant_blocks`, `tool_result`) used inside `parseStreamChunk`. `safeParse` per chunk; failures log to stderr and return `null` (existing behavior preserved). Tests stay green.

### Task 9 — Port bek-watchdog + bek-watchdog-run
Prompt: `.claude/prompts/out/bek-v2-task-9.md`
Depends on: Task 6 merged
Summary: 1:1 port + tests. `decide()` return type expressed as a discriminated union (`{ action: 'skip'; reason: ... }` vs `{ action: 'restart'; ... }`). `bek-watchdog-run.ts` is a 3-line entrypoint shim per ERR-044 pattern.

### Task 10 — Port bek-daemon + ecosystem.config.cjs to tsx + smoke
Prompt: `.claude/prompts/out/bek-v2-task-10.md`
Depends on: Task 8 + Task 9 merged
Summary: 1:1 port of `bek-daemon.mjs` → `.ts`. Update `_archive/bek-frozen-2026-05-08/src/ecosystem.config.cjs` to invoke `node --import tsx <path-to-.ts>` for both `quantumbek` and `bek-watchdog` apps. PM2 stop/start cycle. Smoke test: send a Telegram message, BEK responds, heartbeat updates, stream log written.

### Task 11 — Retry wrapper for transient errors
Prompt: `.claude/prompts/out/bek-v2-task-11.md`
Depends on: Task 10 merged
Summary: Create `_archive/bek-frozen-2026-05-08/src/retry.ts` with `classifyError()` and `retryTransient()` per spec §7. Create `_archive/bek-frozen-2026-05-08/src/test/retry.test.ts` with 6 cases. Wire into `bek-daemon.ts:handleMessage` around `runClaude()` call. Surface retry attempts via `onAttempt` to daemon log and `metrics.retries` counter.

### Task 12 — Structured incidents.jsonl + postmortem CLI
Prompt: `.claude/prompts/out/bek-v2-task-12.md`
Depends on: Task 11 merged
Summary: Create `_archive/bek-frozen-2026-05-08/src/types/incident.ts`, `_archive/bek-frozen-2026-05-08/src/incidents.ts` (with `recordIncident()` writing to BOTH `incidents.log` and `incidents.jsonl`), and `_archive/bek-frozen-2026-05-08/src/tools/postmortem.ts` (CLI). Wire `recordIncident()` into `bek-watchdog.ts` (replace `appendFile(INCIDENTS_LOG)`) and `bek-daemon.ts` (`crash_recovery`, `retry_exhausted`, `permanent_error`). Add `bek-postmortem` to package.json bin. Tests for both round-trip and CLI invocation.

### Task 13 — Observability HTTP server module
Prompt: `.claude/prompts/out/bek-v2-task-13.md`
Depends on: Task 12 merged
Summary: Create `_archive/bek-frozen-2026-05-08/src/observability/{server,server-run,routes}.ts` per spec §6. Routes `/health`, `/incidents`, `/metrics`, `/current.log`, `/current.log/stream` (SSE). Daemon writes `_archive/bek-frozen-2026-05-08/logs/queue-status.json` on every queue event (~10 LOC delta in `bek-daemon.ts`). Add third PM2 app block `bek-observability` to `ecosystem.config.cjs` (`restart_delay: 5000`, `BEK_OBS_PORT=3939`, `BEK_OBS_HOST=127.0.0.1`). Smoke tests for `/health` + `/metrics` routes with stubbed file reads.

### Task 14 — Observability dashboard HTML + SSE tail
Prompt: `.claude/prompts/out/bek-v2-task-14.md`
Depends on: Task 13 merged
Summary: Create `_archive/bek-frozen-2026-05-08/src/observability/public/index.html` — single-page dashboard, no framework, ~150 LOC. Polls `/health` every 5s, opens `EventSource` to `/current.log/stream` for live tail. Layout per spec §6.4 (status header + live stream + recent incidents). `bek-observability` app serves the static HTML + SSE.

### Task 15 — SOT bookkeeping (ADR-024 + ERR-046 + AP-020)
Prompt: `.claude/prompts/out/bek-v2-task-15.md`
Depends on: Tasks 1–14 functionally complete
Summary: Append ADR-024 to `_archive/bek-frozen-2026-05-08/sot/DECISIONS.md` covering BEK v2's full architecture decision (`_archive/bek-frozen-2026-05-08/` root + TS + obs + retry + incidents). Append ERR-046 to `_archive/bek-frozen-2026-05-08/sot/ERRORS.md` (mode-independent `.claude/**` self-protect). Append AP-020 to `_archive/bek-frozen-2026-05-08/sot/ANTI_PATTERNS.md`. Add supersede markers on ERR-045 + AP-019. Update INDEX.md with the 3 new entries.

---

## End-to-end verification (run after Task 15 merged)

After all 15 tasks merged to main:

- `pm2 stop quantumbek bek-watchdog bek-observability` (if running) → `pm2 start _archive/bek-frozen-2026-05-08/src/ecosystem.config.cjs` → `pm2 list` shows ALL THREE apps `online`.
- `cat _archive/bek-frozen-2026-05-08/logs/heartbeat.json` shows `phase: idle`, fresh ts.
- `curl http://127.0.0.1:3939/health` returns `{ heartbeat: {...}, queueDepth: ..., lastIncidents: [...] }`.
- Open `http://127.0.0.1:3939/` in a browser — dashboard renders with status header, live stream pane, incidents pane.
- Send a Telegram message → BEK responds → dashboard's stream pane shows `[open] [init] [tool] [text] [close]` events live.
- After reply, dashboard's status header flips back to `phase: idle`.
- Force a hang → watchdog detects within 30s → `incidents.jsonl` gets a structured `{kind: "restart_triggered", ...}` line → `bek-restart.flag` appears → daemon exits → ~62s PM2 wait → daemon restarts → posts crash-recovery message.
- `node --import tsx _archive/bek-frozen-2026-05-08/src/tools/postmortem.ts --date 2026-04-25` prints human-formatted incidents from today.
- Block `api.telegram.org` via hosts file briefly → daemon logs `[bek] attempt 1 transient/...` × 2-3 times via the retry wrapper, eventually succeeds when the block is lifted (or surfaces ❌ if exhausted). No hard failure on first ECONNRESET.
- `cd _archive/bek-frozen-2026-05-08/src && npm test` reports ≥127 tests passing, zero failing.
- `cd _archive/bek-frozen-2026-05-08/src && npx tsc --noEmit` clean.
- `git grep -nE '\.claude/(sot|bek|bek-sessions|prompts|logs/(bek-|devnote-))' -- ':(exclude)docs/' ':(exclude)_archive/bek-frozen-2026-05-08/sessions/archive/'` returns zero hits in tracked source files.

---

## Self-review checklist (blocks "done" — every box must be ticked)

- [x] Every gap in the design spec's gap list has a task that fixes it. (Spec has no separate gap list — its self-review checklist passes.)
- [x] Every cross-file collision has an explicit resolution sentence in every affected task prompt. (No collisions: each task touches a disjoint file set; T8/T9/T10 share daemon-related files but in strict sequence per merge order.)
- [x] Every file path referenced in any task prompt has been Glob-verified (existing paths) or declared as new (new files explicitly marked).
- [x] Every Context7 citation has a real URL. (`tsx` and `zod` cited above with GitHub URLs.)
- [x] DAG above matches the SCOPE dependency declarations in every task prompt.
- [x] Each task VERIFICATION section has ≥3 observable-state items.
- [x] Each task DONE CRITERIA names exact branch + file count + return string.
- [x] IF the design spec declares terminology locks: spec declares none.
- [x] IF the design spec declares out-of-scope items: no task prompt references webhook mode, MCP server, persistent queue, multi-user, cursor-agent replacement, pre-warmed CLI pool, smarter summarizer, or Agent SDK migration in scope.

---

## Risks and rollback

| Risk | Mitigation |
|---|---|
| Forgotten path reference somewhere → BEK or orchestrator breaks silently after T1 | Task 1 VERIFICATION includes a `git grep` audit for old `.claude/{sot,bek,bek-sessions,prompts,logs/bek-,logs/devnote-}` references in tracked source files — must return zero hits in source/scripts (docs and historical archive excluded). |
| Mid-port test regression on a leaf module | Each port task runs the file's matching test as part of VERIFICATION. Port tasks are 1:1 mechanical — behavior changes are not allowed in T4-T10. |
| `tsx` cold-start adds ~200ms latency on first message after restart | Acceptable — bounded vs Claude's own 3-5s first-token latency. |
| `_archive/bek-frozen-2026-05-08/src/node_modules/` accidentally tracked | Task 1 VERIFICATION includes `.gitignore` line for `_archive/bek-frozen-2026-05-08/src/node_modules/`. Confirmed before T1 commit. |
| Observability server crashes mid-tail | PM2 autorestart; max 5s downtime; daemon and watchdog independent. |
| Retry wrapper masks a real bug by silently retrying | T11 logs every attempt via `onAttempt`. T12 surfaces `retry_exhausted` incidents. Postmortem CLI in T12 lets you spot category clusters. |
| Incidents JSONL grows unbounded | Daily incidents are tens-of-bytes; even at 100/day for 10 years, file stays <40MB. Manual rotate if it ever matters. |
| Daemon restart between Task 1 and Task 10 → temporarily running v1 daemon from new path layout via .mjs | Acceptable. T1 → T10 migration is intentionally incremental; daemon stays functional throughout. |
| PM2 caches old script paths after Task 10 | `pm2 delete` (not `restart`) before re-adding from new ecosystem in T10's smoke step. |
| User asks BEK to do real work mid-migration | All 15 tasks are sequential; merging T1 first re-enables BEK on the new layout within minutes. Subsequent tasks are infra/typing/observability that don't break the daemon. |

Rollback: single-commit revert per task (each task is one branch, one merge). Full rollback: revert T15 → T14 → ... → T1 in reverse order. PM2 `delete bek-observability` removes the third app added by T13.

---

## Out of scope (deferred — see design spec §15)

Explicitly NOT in this plan:

- Custom MCP server for typed BEK signals (replacing `TELEGRAM:` text grep).
- Telegram webhook mode.
- Persistent SQLite-backed queue.
- Hook-based permission overrides for `.claude/**`.
- Multi-user / multi-group support.
- Pre-warmed Claude CLI process pool.
- Smarter conversation summarizer.
- cursor-agent dispatch replacement.
- Agent SDK migration (different billing model, different rewrite).
