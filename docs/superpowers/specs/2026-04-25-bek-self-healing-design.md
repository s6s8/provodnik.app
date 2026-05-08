# BEK self-healing + streaming observability — design spec

**Date:** 2026-04-25
**Status:** Draft — awaiting user review
**Author:** orchestrator (Claude, Opus 4.7)
**Related:** ERR-038 (409 loop), commit `7f69767` (old watchdog deletion), bek-daemon incident 2026-04-24T23:05Z

## 1. Context

At 2026-04-24T23:05:52Z the BEK daemon received a user message, spawned a Claude subprocess to generate a reply, and logged `running Claude — isFirst=false`. Nothing happened after that: no completion log, no `[BEK]:` line appended to `conversation.md`, no error in `bek-daemon.log`. The user's message was silently dropped. The daemon process itself stayed alive (pm2 `online`, 5h uptime), but its in-flight work was stuck.

Current safety nets that did **not** catch this:

- `claude_timeout_ms = 1_500_000` (25 min) in `claude-runner.mjs` — SIGKILLs the Claude subprocess on expiry and rejects the promise. Either it never fired, or its catch handler (which does `await ctx.send('Завис. Попробуй ещё раз.')`) hung on Telegram network errors (`ECONNRESET` / `ConnectTimeoutError` seen in `bek-pm2.err.log` at 02:20Z and 03:20Z).
- PM2 autorestart — only triggers on process **exit**. A hung process never exits.
- Crash-recovery on startup — only runs after a restart, which never happened.
- Old external watchdog (`bek-watchdog.mjs`) — existed on 2026-04-17 (logs still present), **deleted in commit `7f69767`** as part of a simplification pass after the `EXECUTING` state was removed, since the watchdog's stuck-state check could no longer fire. Not deleted for misfiring.

The observability gap is equally important: even if a watchdog had restarted the daemon, we cannot today see **what Claude was doing** — the `stream-json` output from `claude-runner.mjs` is parsed for signals (`TELEGRAM:` / `STATE:` / `LEARN:`) and everything else is discarded. "Stuck" and "thinking hard" look identical from outside. This is why manual inspection was needed to diagnose the incident.

### Goals

- A stuck Claude subprocess gets detected and recovered from in ≤ 2 minutes, with no human input.
- At any moment, an operator can run one command and see in real time what Claude is currently doing (which tool, which file, which assistant text chunk).
- The recovery path does not depend on the Telegram API being reachable.
- The recovery path respects the existing ERR-038 constraint (restart_delay ≥ 62s to avoid the 409 polling loop).
- No second communication channel (no second Telegram bot, no email, no Slack DM).

### Non-goals

- Webhook mode for Telegram (keeps current long-polling).
- Idempotent message replay after restart.
- Detecting correctness failures ("Claude replied, but wrong"). This spec covers liveness only.
- Per-state thresholds (PLAN_READY vs. BRAINSTORMING). v1 uses one global threshold.

## 2. Architecture

Three new files / two edited files, one new PM2 app.

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│    PM2: quantumbek           │        │    PM2: bek-watchdog         │
│    (existing, edited)        │        │    (new)                     │
│                              │        │                              │
│  bek-daemon.mjs              │        │  bek-watchdog.mjs            │
│    └─ claude-runner.mjs      │        │    └─ polls every 30s        │
│         ├─ stream logger ────┼──►     │    └─ reads heartbeat.json   │
│         └─ heartbeat writer ─┼──►     │    └─ reads session.json     │
│                              │        │    └─ stale + not IDLE       │
│  handleMessage catch fix ────┼──►     │         → touch RESTART flag │
│  flag-file poller (5s) ──────┼───────►│    └─ logs bek-incidents.log │
│    on RESTART flag exit(0)   │        │                              │
└──────────────────────────────┘        └──────────────────────────────┘
            │
            ▼
   .claude/logs/bek-stream/
     2026-04-25T03-05-52-<slug>.log   ← per-message activity
     current.log                      ← symlink/copy of active stream
     <older files auto-purged>
   .claude/logs/bek-heartbeat.json
   .claude/logs/bek-incidents.log
   .claude/logs/bek-restart.flag      ← trigger file (zero-byte)
```

### Component responsibilities

**`claude-runner.mjs` (edited):**
- For every `stream-json` line received from the Claude subprocess, also write a human-readable entry to a per-message stream file.
- Update `bek-heartbeat.json` on every entry.
- No change to signal parsing or timeout semantics.

**`bek-daemon.mjs` (edited):**
- Open a new stream file on entry to `handleMessage`, close it on exit (success or error).
- Copy the active stream file path to `current.log` at open time. (Windows symlinks require admin/dev-mode; we always copy. `tail -f current.log` sees subsequent appends because the daemon writes to the per-message file and `current.log` is a lightweight shim that re-`cp`s on each new event — simplest correct option. If this proves too expensive in practice, switch to a tiny FIFO-like re-exec that tails the per-message file; deferred until evidence.)
- Update `bek-heartbeat.json` with `phase: "idle"` when the queue drains to empty.
- Replace `await ctx.send(msg)` in the `handleMessage` catch block with `ctx.send(msg).catch(() => {})` so a Telegram outage cannot deadlock the queue.
- On startup, install a 5-second `setInterval` that checks for `bek-restart.flag`. If present, delete the flag and call `process.exit(0)`. PM2 restarts the process 62s later.

**`bek-watchdog.mjs` (new):**
- Poll every 30s.
- Read `bek-heartbeat.json` and `session.json`.
- If `session.state !== 'IDLE'` AND (`now - heartbeat.ts`) > 90s → write incident entry to `bek-incidents.log` (ISO timestamp, session_id, last phase, stream file path), then `touch` the `bek-restart.flag` file. Cooldown: 5 minutes between restart triggers (last-trigger timestamp held in-memory in the watchdog process; resets if watchdog itself restarts, which is acceptable — a watchdog restart is already a signal).
- Do NOT attempt to send any Telegram message from here. Do NOT invoke `pm2` CLI. Only the flag file.

**`ecosystem.config.cjs` (edited):**
- Add a second app block for `bek-watchdog`:
  ```js
  {
    name: 'bek-watchdog',
    script: '.claude/bek/bek-watchdog.mjs',
    autorestart: true,
    max_restarts: 20,
    min_uptime: '10s',
    restart_delay: 5000,
    out_file: '.claude/logs/bek-watchdog.log',
    error_file: '.claude/logs/bek-watchdog-error.log',
    time: true,
  }
  ```

## 3. Data contracts

### Stream file format (`bek-stream/<ts>-<slug>.log`)

One event per line. Prefix is the event type in brackets; remainder is a short human summary. Raw JSON is NEVER written here (goes to PM2 out_file if needed for forensic replay).

```
2026-04-25T03:05:52.341Z [open] session=new msg="check the implementation..."
2026-04-25T03:05:52.820Z [init] claude_session=2186f454-1f1a-4649-a8d4-3e5306de77c6
2026-04-25T03:05:53.102Z [tool] Read .claude/bek-sessions/active/plan.md
2026-04-25T03:05:53.478Z [tool] Bash "git log main..feat/plan-07 --oneline"
2026-04-25T03:05:55.900Z [text] Принято. Проверяю изменения по списку…
2026-04-25T03:06:12.341Z [tool] Read provodnik.app/components/HomeRequestForm.tsx
2026-04-25T03:07:45.112Z [signal] STATE=PLAN_READY
2026-04-25T03:07:45.220Z [close] exit=0 duration_ms=112879
```

Event types: `open`, `init`, `tool`, `text`, `signal`, `error`, `close`. Tool entries show the tool name and the first ≤80 characters of the first input field. Text entries show the first ≤120 characters of the text block. Longer content is truncated with `…`.

### `bek-heartbeat.json`

Rewritten atomically (write to `.tmp`, rename) on every stream event and on queue-idle:

```json
{
  "ts": "2026-04-25T03:06:12.341Z",
  "phase": "tool:Read",
  "stream_file": ".claude/logs/bek-stream/2026-04-25T03-05-52-check-the-implementation.log",
  "message_started_at": "2026-04-25T03:05:52.341Z"
}
```

When queue is empty: `phase: "idle"`, `stream_file: null`, `message_started_at: null`.

### `bek-incidents.log`

One line per restart trigger:

```
2026-04-25T03:30:12.000Z RESTART stale=340s state=PLAN_READY phase=tool:Read stream=.claude/logs/bek-stream/2026-04-25T03-05-52-check-the-implementation.log
```

### `bek-restart.flag`

Zero-byte file. Presence = "daemon must exit on next check". Deleted by the daemon immediately before exit to avoid re-triggering.

## 4. Control flow

### Happy path (message arrives, Claude responds)

1. `handleMessage` fires in daemon.
2. Daemon opens stream file, writes `[open]` entry, points `current.log` at it, writes heartbeat with `phase: "opening"`.
3. `claude-runner.mjs` spawns Claude subprocess. On every `stream-json` chunk:
   - Append human-readable line to stream file.
   - Rewrite `bek-heartbeat.json` with new `ts` and `phase`.
4. Claude exits cleanly. `[close]` entry appended. Heartbeat → `phase: "idle"` once queue drains.
5. Stream file persists on disk for 7 days (purged by next open).

### Stuck path (Claude subprocess hangs)

1. Daemon opens stream file, first few entries appear, then no more stream output.
2. Heartbeat stops updating.
3. At T+90s: watchdog poll notices `state != IDLE` AND heartbeat age > 90s.
4. Watchdog writes to `bek-incidents.log`, touches `bek-restart.flag`.
5. Within 5s: daemon's flag-file poller sees flag, deletes it, calls `process.exit(0)`.
6. PM2 waits 62s (per ERR-038), restarts daemon.
7. Daemon's existing crash-recovery branch posts "Где остановились? Перечитал контекст." to the group chat. User sees this and knows to resend.
8. Watchdog enters 5-minute cooldown.

### Recovery path fails (daemon process is alive but never sees the flag)

Extremely unlikely — the poller is a plain `setInterval`, not dependent on the queue. If it does happen, PM2 does not restart (because the process did not exit). Operator sees via `current.log` (no updates) and `bek-incidents.log` (restart requested but not acted on). Manual `pm2 restart quantumbek` is the fallback. Not automated in v1.

## 5. Error handling

- Stream file write failures are non-fatal. Log to stderr and continue; heartbeat continues to update.
- Heartbeat write failures are non-fatal. Log to stderr; next chunk retries. If heartbeat cannot be written for > 90s, the watchdog will treat the daemon as stuck (based on the `ts` field inside the JSON, not file mtime — the daemon always writes a fresh ISO timestamp) — correct behavior.
- Watchdog crashes are handled by PM2 autorestart (second app, 5s restart_delay).
- If the flag file exists at daemon startup (leftover from a prior incomplete exit), it is deleted immediately on boot.
- The 5-minute watchdog cooldown prevents restart loops. If bek is *genuinely* broken (e.g., bad code shipped), watchdog will restart once, then stop trying, and incidents log accumulates restart attempts — operator can tell the difference.

## 6. Retention / cleanup

- Per-message stream files: auto-delete on next `handleMessage` entry if older than 7 days. One-shot sweep, no cron.
- `bek-incidents.log`: append-only, manual rotation. ~50 bytes per incident; growth is negligible.
- `bek-heartbeat.json`: single file, rewritten in place.
- `current.log`: overwritten on every new message.

## 7. Testing plan

All manual on Windows dev box. No automated tests in v1 (test infra for the bek daemon is thin — see `.claude/bek/test/`, only a few unit tests for sanitizer / whisper / timeout-error).

1. **Smoke:** normal message → Claude replies → `current.log` shows tool calls and text in real time (`tail -f current.log`). Stream file persists after completion. Heartbeat flips to `idle`. No incidents logged.
2. **Forced hang:** insert a `while(true){}` guard into a Claude tool (via a test system prompt that triggers an infinite loop). Confirm:
   - Stream log shows activity up to the hang.
   - After 90–120s: `bek-incidents.log` gets a line.
   - `bek-restart.flag` appears, then disappears.
   - PM2 logs show daemon exit, 62s wait, restart.
   - Daemon posts "Где остановились?" to the group.
   - Next message processes cleanly.
3. **Telegram network outage simulation:** block api.telegram.org via hosts file during a message → daemon tries to post error reply, catch handler does not await, queue completes, heartbeat returns to `idle`. No watchdog trigger.
4. **Flag file leftover:** create `bek-restart.flag` manually while daemon is idle → daemon detects within 5s, exits, PM2 restarts after 62s, flag is gone, no loop.
5. **Cooldown:** trigger hang twice in succession within 5 min → only one restart occurs; second is logged as "cooldown, skipping" in `bek-watchdog.log`.

## 8. Rollout

Single branch, single merge to `main`. No staged rollout — dev-box infra, single operator. After merge:

1. `pm2 stop quantumbek` → deploy new code → `pm2 start ecosystem.config.cjs` (starts both apps).
2. Run smoke test (step 1 above).
3. Run forced-hang test (step 2 above) once, confirm restart cycle.
4. Update SOT: new ADR documenting the restart mechanism; new landmine entry in HOT.md about the flag-file contract (don't delete it manually while daemon is processing).

## 9. Open questions

None — all resolved during brainstorming:
- Second channel: rejected.
- Threshold: 90s global, tunable later.
- Restart mechanism: flag file, not pm2-from-pm2.
- Retention: 7 days.
- Webhook: out of scope.

## 10. Effort estimate

- Stream logger: ~50 lines in `claude-runner.mjs` + small helper for event formatting.
- Heartbeat writer: ~30 lines, shared with stream logger.
- Watchdog: ~80 lines new file.
- PM2 config: ~15 lines added.
- Daemon: ~20 lines (flag-file poller, catch-handler fix, queue-idle heartbeat).
- Tests: ~2 hours manual.

Total: one cursor-agent dispatch, 1–2 hours wall.
