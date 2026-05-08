# BEK self-healing + streaming observability — implementation plan (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Per project CLAUDE.md §22, the implementer is **cursor-agent via `cursor-dispatch.mjs`**, not a generic Claude subagent.

**Goal:** Detect a hung BEK Claude subprocess in ≤2 minutes and recover automatically, while exposing every Claude tool call and text chunk to a `tail -f`-able log so the operator can see in real time what the daemon is doing — without adding a second Telegram channel or webhook surface.

**Architecture:** Two PM2 apps (`quantumbek` daemon + new `bek-watchdog` poller) communicating only through files: a per-message stream log under `.claude/logs/bek-stream/`, an atomic `bek-heartbeat.json` rewritten on every Claude stream chunk, and a zero-byte `bek-restart.flag` file polled every 5s by the daemon to trigger graceful exit + PM2 autorestart. No `pm2`-CLI-from-pm2, no second alert channel.

**Tech Stack:** Node v24, gramio (existing), p-queue (existing), PM2 ecosystem config. New code uses only Node stdlib (`fs/promises`, `node:path`, `setInterval`, `process.exit`). Tests via `node --test` (the bek package's existing test runner).

**Design spec:** [docs/superpowers/specs/2026-04-25-bek-self-healing-design.md](../specs/2026-04-25-bek-self-healing-design.md)

**Context7 research note:** Skipped intentionally. No new library APIs are introduced. The implementation calls only:
- `gramio` APIs already used in `bek-daemon.mjs` (`ctx.send`, `bot.api.sendMessage`, `bot.start`) — wiring change only (add `.catch()`).
- `p-queue` APIs already used (`queue.on('idle', ...)`).
- Node stdlib (`fs/promises.writeFile`, `rename`, `readFile`, `unlink`, `mkdir`, `readdir`, `appendFile`, `copyFile`, `stat`).

Recording this here so the next reader knows research was deliberately skipped, not forgotten.

---

## v2 changes from v1

1. **Task 0 added** (catch-fix + boot stale-flag cleanup) — independent hot-fix, ships first, smallest diff, biggest immediate safety value.
2. **All magic numbers and the phase taxonomy pinned** at the top of this plan so cursor-agent never invents values.
3. **Task 3 owns the new `tool_use`/`tool_result` parsing** (v1 silently glossed over this — current `claude-runner.mjs` only iterates `text` blocks).
4. **`current.log` strategy switched** from O(N²) re-copy to append-to-both (per-message file AND `current.log`).
5. **Watchdog gets a tool/text threshold split + circuit breaker** (kills false positives from legitimate slow tools; prevents infinite restart loops on genuine breakage).
6. **Watchdog read errors → "unknown" not "stale"** (no more EBUSY-triggered restarts).
7. **Daily `purgeOld` timer in daemon** (in addition to per-open purge — prevents directory bloat during silent days).
8. **Stream-log gets a 1000-event hard cap** per message file.
9. **SOT updates promoted to Task 5 deliverables** (new ADR-021, HOT.md landmine, INDEX.md one-liners).
10. **Tasks 3 + 4 + 5 grow real automated tests.**
11. **Slug pinned to `<chatId>-<messageId>`** (ASCII, never collides on identical text).
12. **Post-ship measurement carved out** as a `/schedule`-able follow-up, not a code task.

---

## Concrete constants — pinned, do NOT let cursor-agent invent values

```js
// Watchdog timing
const POLL_MS                  = 30_000;           // watchdog poll interval
const STALE_TEXT_MS            = 90_000;           // threshold for idle|opening|init|text|signal|closing phases
const STALE_TOOL_MS            = 300_000;          // threshold for tool_running:* phases
const RESTART_COOLDOWN_MS      = 300_000;          // 5 min between watchdog-triggered restarts
const CIRCUIT_BREAKER_LIMIT    = 3;                // max restarts before watchdog gives up
const CIRCUIT_BREAKER_WINDOW_MS = 1_800_000;       // 30 min sliding window

// Daemon timing
const FLAG_POLL_MS             = 5_000;            // daemon polls bek-restart.flag every 5s
const STREAM_PURGE_AGE_MS      = 604_800_000;      // 7 days
const STREAM_PURGE_INTERVAL_MS = 86_400_000;       // daily sweep timer
const STREAM_PURGE_BOOT_DELAY_MS = 60_000;         // first sweep 60s after boot

// Stream-log limits
const STREAM_EVENT_LIMIT       = 1000;             // hard event cap per message file
const STREAM_SUMMARY_TOOL_MAX  = 80;               // chars
const STREAM_SUMMARY_TEXT_MAX  = 120;              // chars

// Slug format
// stream-log filename = <ISO-ts-with-colons-replaced-by-hyphens>-<chatId>-<messageId>.log
// e.g. 2026-04-25T03-05-52.341Z--100123456789-42.log

// Phase taxonomy (frozen — do NOT add/rename without updating watchdog threshold logic)
const PHASES = Object.freeze({
  IDLE:    'idle',     // queue drained, no work
  OPENING: 'opening',  // handleMessage entry, before runClaude spawned
  INIT:    'init',     // claude-runner received system/init chunk
  TEXT:    'text',     // assistant text block streaming
  SIGNAL:  'signal',   // parsed TELEGRAM/STATE/LEARN/ARCHIVE_SESSION
  CLOSING: 'closing',  // daemon writing final heartbeat before process.exit
});
// Tool phases are dynamic: `tool_running:<tool_name>` (e.g. `tool_running:Bash`).
```

---

## Dependency DAG

```
Task 0 (catch-fix + boot cleanup) ─── independent, ships first
    │
    ├─ Task 1 (stream-log.mjs)  ──┐
    ├─ Task 2 (heartbeat.mjs)   ──┤
    │                              ├──> Task 3 (runner) ──> Task 4 (daemon)
    │                              └──> Task 5 (watchdog + pm2 + SOT)
```

## Merge order

0. Task 0 — `feat/bek-selfheal-hotfixes` — independent, ship before everything else.
1. Task 1 — `feat/bek-selfheal-stream-log` — pure module, no deps.
2. Task 2 — `feat/bek-selfheal-heartbeat` — pure module, parallel-safe with Task 1.
3. Task 3 — `feat/bek-selfheal-runner` — depends on Tasks 1 + 2 merged.
4. Task 4 — `feat/bek-selfheal-daemon` — depends on Task 3 merged.
5. Task 5 — `feat/bek-selfheal-watchdog` — depends on Task 2 merged. Parallel-safe with 3 + 4 (only reads heartbeat.json — frozen contract).

Recommended sequential execution: 0 → 1 → 2 → 3 → 4 → 5. Parallel option: run 5 alongside 3+4 once Task 2 merges.

---

## Task summary

### Task 0 — Hot-fix the deadlock vector and stale-flag-on-boot
Prompt: `.claude/prompts/out/bek-selfheal-task-0.md`
Branch: `feat/bek-selfheal-hotfixes`
Depends on: nothing
Summary: Two independent surgical edits to `.claude/bek/bek-daemon.mjs`. (a) In the `handleMessage` catch block (currently line 175), change `await ctx.send(msg)` to `ctx.send(msg).catch(() => {})` — Telegram outage during error reply currently deadlocks the p-queue. (b) On daemon boot, immediately `unlink('.claude/logs/bek-restart.flag').catch(() => {})` so a leftover flag doesn't cause an instant re-exit. Manual verification only. Ships immediately.

### Task 1 — Stream log helper module
Prompt: `.claude/prompts/out/bek-selfheal-task-1.md`
Branch: `feat/bek-selfheal-stream-log`
Depends on: nothing
Summary: Create `.claude/bek/stream-log.mjs` exporting `openStream({ chatId, messageId, msgPreview })`, `writeEvent(handle, type, summary)`, `closeStream(handle, { exitCode, durationMs })`, and `purgeOld(maxAgeMs)`. Per-message log file under `.claude/logs/bek-stream/<ISO-ts>-<chatId>-<messageId>.log`. `current.log` strategy: `openStream` truncates and writes a header; `writeEvent` appends to BOTH the per-message file and `current.log`. Hard cap: 1000 events per stream → write `[truncated]` once, ignore further events. All write failures non-fatal (log to stderr, continue). Tests cover formatting, append-to-both, event cap, purge-skips-current-log, no-op-handle on open failure.

### Task 2 — Heartbeat helper module
Prompt: `.claude/prompts/out/bek-selfheal-task-2.md`
Branch: `feat/bek-selfheal-heartbeat`
Depends on: nothing
Summary: Create `.claude/bek/heartbeat.mjs` exporting `writeHeartbeat({ phase, streamFile, messageStartedAt })` (atomic via `.tmp` + `rename` with Windows EEXIST tolerance) and `readHeartbeat()` (returns parsed JSON or `null` on ANY error — never throws). Plus a frozen `PHASES` enum const. Path is `.claude/logs/bek-heartbeat.json`. Tests cover round-trip, tmp cleanup, null-on-missing, null-on-malformed.

### Task 3 — Wire stream + heartbeat into claude-runner.mjs
Prompt: `.claude/prompts/out/bek-selfheal-task-3.md`
Branch: `feat/bek-selfheal-runner`
Depends on: Tasks 1 + 2 merged
Summary: Edit `.claude/bek/claude-runner.mjs`. (a) Add optional `streamHandle` param to `runClaude` — when null/undefined, runner emits zero stream/heartbeat events (preserves existing `summarizeConversation` caller). (b) Extract chunk parsing into a testable `parseStreamChunk(line)` helper. (c) Add NEW parsing for `tool_use` blocks (assistant content) and `tool_result` blocks (user content) which the runner currently ignores. (d) For every parsed chunk emit a stream event AND update heartbeat with the appropriate phase per the pinned taxonomy. (e) `tool_use` chunks → `phase: tool_running:<name>` (this is what defeats the false-positive risk). Tests: unit tests for `parseStreamChunk` over each chunk shape, plus a driver test that pipes a fake stdout sequence through the runner with mocked stream/heartbeat helpers, plus a regression test that `runClaude` with `streamHandle = null` doesn't throw.

### Task 4 — Wire daemon: stream open/close, flag-poller, queue-idle heartbeat, daily purge
Prompt: `.claude/prompts/out/bek-selfheal-task-4.md`
Branch: `feat/bek-selfheal-daemon`
Depends on: Task 3 merged. Task 0 must already be on main (catch-fix + boot delete).
Summary: Edit `.claude/bek/bek-daemon.mjs`. (a) `handleMessage` derives slug from `ctx.chat.id + ctx.id`, calls `openStream`, passes the handle to `runClaude`, calls `closeStream` in `finally`. (b) Boot installs `setInterval(FLAG_POLL_MS = 5_000)` checking `bek-restart.flag` — if present, unlink it, write `phase: closing` heartbeat, `process.exit(0)`. (c) `queue.on('idle', ...)` writes the `idle` heartbeat. Also write `idle` once on boot after crash-recovery branch. (d) `setInterval(STREAM_PURGE_INTERVAL_MS = 24h)` calling `purgeOld(7d)`; first sweep 60s after boot. (e) NOT in scope here: catch-fix and boot-flag-delete (Task 0 already shipped them). Tests: unit-test the slug derivation and the flag-poller in isolation (stub `process.exit`).

### Task 5 — Watchdog process + PM2 registration + SOT updates
Prompt: `.claude/prompts/out/bek-selfheal-task-5.md`
Branch: `feat/bek-selfheal-watchdog`
Depends on: Task 2 merged
Summary: (a) Create `.claude/bek/bek-watchdog.mjs` — polls every 30s, reads heartbeat (null → "unknown", skip — never trigger), reads session via `SessionManager` import from `session-manager.mjs` (do not duplicate session-loading), picks threshold per phase (`STALE_TOOL_MS` for `tool_running:*`, `STALE_TEXT_MS` otherwise), writes incidents to `bek-incidents.log`, touches `bek-restart.flag`, enforces 5-min cooldown, enforces 3-restart-in-30-min circuit breaker (then logs `GIVING_UP` and stops touching flag for the rest of the process). (b) Edit `.claude/bek/ecosystem.config.cjs` to add a second app block named `bek-watchdog` with `restart_delay: 5000` (the existing `quantumbek` block keeps `restart_delay: 62000` per ERR-038). (c) Update SOT: new ADR-021 in `.claude/sot/DECISIONS.md` documenting the file-based restart mechanism, a new landmine entry in `.claude/sot/HOT.md` about the flag-file contract, and one-liner pointers in `.claude/sot/INDEX.md`. Tests: 7 cases for stale-detection + cooldown + circuit-breaker logic.

---

## End-to-end verification (run after Tasks 0–5 all merged)

Manual on the Windows dev box. There is no `bun run typecheck` / `bun run lint` here — the bek package is JS-only with `node --test`.

- `pm2 stop quantumbek` (if running) → `pm2 start .claude/bek/ecosystem.config.cjs` → `pm2 list` shows BOTH `quantumbek` AND `bek-watchdog` as `online`.
- Send a normal Telegram message to the BEK group → daemon replies → `Get-Content -Wait .claude/logs/bek-stream/current.log` (PowerShell tail) shows live `[open] [init] [tool] [text] [tool] [signal] [close]` entries.
- After reply lands, `cat .claude/logs/bek-heartbeat.json` shows `"phase": "idle"`.
- Force a hang: trigger a Bash tool with `node -e "setTimeout(()=>{}, 600000)"` (no output for 10 min). Within ~120s observe:
  - `bek-incidents.log` gets a new line containing `RESTART stale=...`
  - `bek-restart.flag` appears, then disappears within 5s
  - `pm2 logs quantumbek` shows daemon exit, ~62s wait, restart
  - Daemon posts "Где остановились? Перечитал контекст." in the group
- After restart, send a fresh message → it processes cleanly. New stream file appears in `bek-stream/`.
- Block `api.telegram.org` via hosts file → trigger an error (e.g. force a Claude timeout) → daemon logs the runner error, error toast send `.catch()`-swallowed, queue drains to idle. **Watchdog does NOT trigger** (heartbeat returned to `idle`).
- Restore hosts file. Manually `touch .claude/logs/bek-restart.flag` while daemon is idle → within 5s daemon exits, ~62s later PM2 restarts, flag is gone, no loop.
- Trigger two hangs within 5 minutes → only the first restart fires; second logs `COOLDOWN` and skips.
- Trigger four hangs spaced ~6 min apart → restarts 1, 2, 3 fire; the 4th logs `GIVING_UP` and no flag is written until the watchdog process itself restarts.
- Force a long *legitimate* Bash (200s, no streaming output) — `phase: tool_running:Bash` — watchdog does NOT trigger (under 300s tool threshold).

---

## Self-review checklist (blocks "done" — every box must be ticked)

- [x] Every gap in the design spec's gap list has a task that fixes it.
- [x] Every cross-file collision has an explicit resolution sentence in every affected task prompt. (Task 3's `parseStreamChunk` extraction is the only shared contract; Task 4 imports it untouched. Task 5 imports `readHeartbeat` from Task 2 only — frozen contract.)
- [x] Every file path referenced in any task prompt has been Glob-verified (existing paths) or declared as new (new files explicitly marked).
- [x] Every Context7 citation has a real URL. (Skipped — no new library APIs; justification recorded above.)
- [x] DAG above matches the SCOPE dependency declarations in every task prompt.
- [x] Each task VERIFICATION section has ≥3 observable-state items.
- [x] Each task DONE CRITERIA names exact branch + file count + return string.
- [x] All constants pinned in this plan; no cursor-agent guessing.
- [x] Phase taxonomy frozen; watchdog's threshold logic references it.
- [x] False-positive mitigation (tool-running phase + `STALE_TOOL_MS`) shipped as part of v1, not deferred.
- [x] Circuit breaker prevents infinite restart loops on genuinely-broken builds.
- [x] IF the design spec declares terminology locks: spec declares none.
- [x] IF the design spec declares out-of-scope items: no task prompt references webhook, idempotent replay, second-channel alerts, or per-state thresholds beyond the text/tool split.

---

## Risks and rollback

| Risk | Mitigation |
|---|---|
| Tool with NO `tool_use` content (custom tool / model variant) | Phase falls back to `text`. Threshold is 90s. Rare edge case — accept; tune if it surfaces in production. |
| Watchdog itself hangs | PM2 autorestart + 5s `restart_delay`. Watchdog has no I/O wait beyond `fs/promises` reads (fast on local disk). |
| `current.log` re-truncate races with `tail -f` on Windows | Tail loses one file handle per `openStream` (once per message). Operator restarts `Get-Content -Wait` if affected. Documented; not solved in v1. |
| Heartbeat write fails silently for >threshold | `readHeartbeat` returns `null` → watchdog records "unknown" → no false restart. If `ts` field is stale (write succeeded long ago), watchdog correctly treats as stuck. |
| ERR-038 reintroduction (409 loop) if `restart_delay` lowered | `quantumbek` keeps `restart_delay: 62_000`. Watchdog has its own `restart_delay: 5_000` (it does not poll Telegram, so 409 doesn't apply). Documented in Task 5. |
| `bek-restart.flag` left across reboots | Task 0 deletes on boot. Watchdog `writeFile('')` is idempotent — re-creating an existing flag is fine. |
| Phase taxonomy drift | Plan pins the enum. Task 3 prompt references the same constants. Reviewer checks no new phase strings invented. |
| Stream-log dir grows unbounded if daemon crashes mid-purge | Daily timer in Task 4 resumes purges on next interval. Per-open purge is also a fallback. |

**Rollback:** Single-commit revert per task (each task is one branch). To fully roll back: revert Task 5 (watchdog goes silent), then 4 (daemon stops writing flag-poller + stream open), then 3, 2, 1, 0. PM2 `delete bek-watchdog` removes the second app. Task 0 is independently revertable (its two changes are pure improvements; no reason to revert in practice).

---

## Out of scope (deferred — see design spec §1 "Non-goals")

- Webhook mode for Telegram (keeps current long-polling).
- Idempotent message replay after restart (user resends manually if needed).
- Per-state thresholds beyond the text/tool split (PLAN_READY tolerates hours; BRAINSTORMING tighter — deferred).
- Detecting correctness failures ("Claude replied, but wrong"). Liveness only.
- Second alert channel (no second bot, no email, no ntfy.sh). User explicitly rejected this in brainstorm.

---

## Post-ship measurement (NOT a cursor-agent task)

After 7 days on main:
1. `wc -l .claude/logs/bek-incidents.log` and breakdown by `RESTART` / `COOLDOWN` / `GIVING_UP`.
2. Count successful sessions in `bek-daemon.log` over the same window.
3. Compute false-positive rate: of restarts, how many had a corresponding genuine hang signal vs. were a long-legitimate-tool false positive (cross-reference last `phase` in `incidents.log` against the matching stream file).
4. If FP rate > 5%: bump `STALE_TOOL_MS` to 600_000 (10 min) or split tool thresholds further (Bash longer than Read/Glob).
5. Update DECISIONS.md ADR-021 with measured numbers.

Suggest scheduling this as a one-shot remote agent at `+7 days` via `/schedule`.
