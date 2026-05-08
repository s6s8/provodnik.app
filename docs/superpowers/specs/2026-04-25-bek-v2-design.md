# BEK v2 — design spec

**Date:** 2026-04-25
**Status:** Draft — awaiting user review
**Author:** orchestrator (Claude, Opus 4.7)
**Related:** ERR-038, ERR-044, ERR-045, ADR-022 (BEK self-healing v1)
**Scope:** five capabilities — A (`_archive/bek-frozen-2026-05-08/` migration), D (TypeScript port), F (observability HTTP server), G (retry wrapper), K (structured incident records). All other improvements brainstormed and explicitly **out of scope** here.

---

## 1. Goal

Make BEK robust, observable, type-safe, and self-contained, while staying on the **Claude CLI subprocess** runtime model (no Agent SDK migration). After v2 ships:

- BEK's source, sessions, plans, SOT, prompts, logs, and config all live under one root: `_archive/bek-frozen-2026-05-08/`. Nothing BEK writes ever lands in `.claude/`. Future Claude CLI restrictions on `.claude/**` cannot break BEK.
- Daemon source is TypeScript with shared types for sessions, heartbeats, stream events, incidents, and retry state. The Windows-PM2 isMain class of bug becomes a compile-time error.
- Operator can hit `http://localhost:3939/` and see live heartbeat, queue depth, last incidents, and a tailing view of `current.log` — without `pm2 logs` or `Get-Content -Wait`.
- Transient failures (`ECONNRESET`, `ETIMEDOUT`, 429, 5xx from Claude API or Telegram) auto-retry up to 3 times with exponential backoff before surfacing a `❌` to the user.
- Every watchdog incident and daemon error writes a structured JSONL record with phase, last stream events, and error context. A `bek-postmortem` CLI prints a human summary for any date or session id.

## 2. Non-goals

- **No Agent SDK migration.** BEK keeps spawning `claude --dangerously-skip-permissions ...`. Custom MCP server / typed signal tools / webhook mode all out of scope.
- **No replacement of cursor-agent dispatch.** The orchestrator → cursor-agent path stays.
- **No multi-user / multi-group support.** BEK stays locked to one Telegram group via `group_id`.
- **No SOT location change beyond moving `.claude/sot/` → `_archive/bek-frozen-2026-05-08/sot/`.** The orchestrator (me) still treats SOT as the single source of truth; just the path changes.
- **No new persistence layer.** p-queue stays in-memory. Persistent queue (item E in the brainstorm) is deferred.
- **No PM2 replacement.** PM2 stays as the supervisor. systemd / Docker / etc. deferred.

## 3. Architecture overview

```
_archive/bek-frozen-2026-05-08/                                  ← BEK's data + source + config root
├── src/                               ← TypeScript source (was .claude/bek/)
│   ├── *.ts                           ← daemon, runner, watchdog, helpers
│   ├── observability/                 ← NEW (F)
│   ├── retry.ts                       ← NEW (G)
│   ├── incidents.ts                   ← NEW (K)
│   ├── tools/postmortem.ts            ← NEW (K)
│   ├── types/*.ts                     ← shared types
│   ├── test/*.test.ts
│   ├── tsconfig.json, package.json, ecosystem.config.cjs, bek.config.json
│   └── node_modules/
├── sessions/{active,archive}/         ← was .claude/bek-sessions/
├── prompts/{skeleton.md, out/}        ← was .claude/prompts/
├── sot/{INDEX,ERRORS,…}.md            ← was .claude/sot/
├── checklists/                        ← was .claude/checklists/
└── logs/
    ├── stream/                        ← per-message activity logs
    ├── current.log                    ← live tail
    ├── heartbeat.json
    ├── restart.flag
    ├── daemon.log, daemon-error.log
    ├── watchdog.log, watchdog-error.log
    ├── pm2.{out,err}.log
    ├── post-work.log
    ├── incidents.log                  ← legacy plain-text (kept for compat)
    ├── incidents.jsonl                ← NEW (K) structured one-line-per-incident
    └── devnotes/                      ← was .claude/logs/devnote-*.json
```

Daemon runs `node` on the compiled JS or `tsx` on the TS source (Decision in §5.2). Watchdog and observability server are sibling Node processes managed by the same PM2 ecosystem.

PM2 apps after v2:

```
quantumbek          _archive/bek-frozen-2026-05-08/src/bek-daemon.{js|ts}     primary daemon
bek-watchdog        _archive/bek-frozen-2026-05-08/src/bek-watchdog-run.{js|ts}  liveness watcher
bek-observability   _archive/bek-frozen-2026-05-08/src/observability/server-run.{js|ts}  HTTP dashboard
```

Three apps because each has independent failure modes and we already have two — adding a third for observability keeps the supervision boundary clean. The observability server crashing must NOT take down the daemon.

---

## 4. (A) Path migration — concrete file map

### 4.1 Files / dirs that **move**

| From | To | Notes |
|---|---|---|
| `.claude/bek/` | `_archive/bek-frozen-2026-05-08/src/` | All `.mjs` files become `.ts` (see §5). `node_modules/`, `package.json`, `package-lock.json`, `bek.config.json`, `ecosystem.config.cjs` move alongside. |
| `.claude/bek-sessions/active/` | `_archive/bek-frozen-2026-05-08/sessions/active/` | Live session state. |
| `.claude/bek-sessions/archive/` | `_archive/bek-frozen-2026-05-08/sessions/archive/` | Archived sessions, including the existing 5 entries. |
| `.claude/prompts/skeleton.md` | `_archive/bek-frozen-2026-05-08/prompts/skeleton.md` | Orchestrator's prompt template. |
| `.claude/prompts/out/` | `_archive/bek-frozen-2026-05-08/prompts/out/` | All prompt files (BEK-authored plans + orchestrator-authored cursor-agent prompts). |
| `.claude/sot/INDEX.md` | `_archive/bek-frozen-2026-05-08/sot/INDEX.md` | And every other SOT file: ERRORS, ANTI_PATTERNS, DECISIONS, HOT, METRICS, NEXT_PLAN. |
| `.claude/checklists/` | `_archive/bek-frozen-2026-05-08/checklists/` | Verification checklists. |
| `.claude/logs/bek-stream/` | `_archive/bek-frozen-2026-05-08/logs/stream/` | Drop the `bek-` prefix — already inside `_archive/bek-frozen-2026-05-08/`. |
| `.claude/logs/bek-heartbeat.json` | `_archive/bek-frozen-2026-05-08/logs/heartbeat.json` | Same. |
| `.claude/logs/bek-incidents.log` | `_archive/bek-frozen-2026-05-08/logs/incidents.log` | Same. Stays plain-text (§8). |
| `.claude/logs/bek-restart.flag` | `_archive/bek-frozen-2026-05-08/logs/restart.flag` | Same. |
| `.claude/logs/bek-daemon.log` | `_archive/bek-frozen-2026-05-08/logs/daemon.log` | Same. |
| `.claude/logs/bek-daemon-error.log` | `_archive/bek-frozen-2026-05-08/logs/daemon-error.log` | Same. |
| `.claude/logs/bek-watchdog.log` | `_archive/bek-frozen-2026-05-08/logs/watchdog.log` | Same. |
| `.claude/logs/bek-watchdog-error.log` | `_archive/bek-frozen-2026-05-08/logs/watchdog-error.log` | Same. |
| `.claude/logs/bek-pm2.out.log` | `_archive/bek-frozen-2026-05-08/logs/pm2.out.log` | Same. |
| `.claude/logs/bek-pm2.err.log` | `_archive/bek-frozen-2026-05-08/logs/pm2.err.log` | Same. |
| `.claude/logs/post-work.log` | `_archive/bek-frozen-2026-05-08/logs/post-work.log` | Same. |
| `.claude/logs/devnote-*.json` | `_archive/bek-frozen-2026-05-08/logs/devnotes/*.json` | Devnote inputs from BEK + orchestrator. |

### 4.2 Files / dirs that **stay** in `.claude/`

| Path | Reason |
|---|---|
| `.claude/CLAUDE.md` | Project-level instructions for every Claude session. Path is part of the convention (Claude Code auto-loads). |
| `.claude/settings.json`, `settings.local.json` | Claude Code config. Path is required by the platform. |
| `.claude/skills/`, `commands/`, `agents/` | Claude Code feature dirs. Auto-loaded by every session. |
| `.claude/post-work*.sh`, `codebase-sync.sh` | Hook scripts; referenced by absolute path in settings.json. |
| `.claude/logs/cursor-dispatch.mjs` | Orchestrator's cursor-agent dispatch wrapper. Referenced by absolute path in CLAUDE.md and recent commits. |
| `.claude/logs/slack-devnote.mjs`, `telegram-devnote.mjs`, `slack-post.mjs`, `telegram-msg.txt`, `telegram-send.mjs`, etc. | Utility scripts shared between BEK post-work and orchestrator. Independent of BEK runtime. |
| `.claude/logs/cursor-*.log` | cursor-agent historical dispatch logs. Not BEK's. |
| `.claude/archive/`, `docs/`, `research/`, `tasks/`, `tmp/` | Orchestrator infra. |
| `.claude/worktrees/`, `worktrees-app/` | Git worktrees. |
| `.claude/PLAN_TEMPLATE.md`, `scheduled_tasks.lock` | Misc orchestrator infra. |

### 4.3 Cross-reference updates required

Every file below has at least one path reference that needs sed-style updating:

| File | What to update |
|---|---|
| `_archive/bek-frozen-2026-05-08/src/bek.config.json` | `sessions_path`, `workspace_path` (workspace stays at the *outer* repo root, not `_archive/bek-frozen-2026-05-08/`) |
| `_archive/bek-frozen-2026-05-08/src/bek-daemon-helpers.ts` | `STREAM_DIR`, `RESTART_FLAG`, `STREAM_PURGE_AGE_MS` constants — relative path walk one level down (`..` instead of `..`/`..`) |
| `_archive/bek-frozen-2026-05-08/src/heartbeat.ts` | `HEARTBEAT_PATH` |
| `_archive/bek-frozen-2026-05-08/src/bek-watchdog.ts` | `RESTART_FLAG`, `INCIDENTS_LOG`, sessions path via SessionManager |
| `_archive/bek-frozen-2026-05-08/src/bek-daemon.ts` | Boot stale-flag delete path, all imports |
| `_archive/bek-frozen-2026-05-08/src/ecosystem.config.cjs` | `script:` paths point at `_archive/bek-frozen-2026-05-08/src/...`, `cwd:` stays at outer `D:/dev2/projects/provodnik`, `out_file/error_file` point at `_archive/bek-frozen-2026-05-08/logs/...`, `BEK_LOG_FILE` env var |
| `_archive/bek-frozen-2026-05-08/src/system-prompt.ts` | Tells inner Claude where plans go (`_archive/bek-frozen-2026-05-08/prompts/out/...` instead of `.claude/prompts/out/...`) |
| `.claude/CLAUDE.md` | All references to `.claude/sot/INDEX.md`, `.claude/sot/HOT.md`, `.claude/bek-sessions/`, `.claude/prompts/`, `.claude/logs/bek-*` |
| `~/.claude/projects/D--dev2-projects-provodnik/memory/MEMORY.md` and individual user-memory `.md` entries | Path references |
| `.claude/post-work*.sh` | If they touch BEK files (devnotes, logs, sessions) |
| `.claude/logs/slack-devnote.mjs`, `telegram-devnote.mjs` | Default input paths if they assume `.claude/logs/devnote-*.json` |
| `.gitignore` | Replace `.claude/logs/bek-*`, `.claude/bek-sessions/active/` patterns with `_archive/bek-frozen-2026-05-08/logs/` and `_archive/bek-frozen-2026-05-08/sessions/active/` etc. |
| All SOT entries that mention old paths in their bodies (HOT, ERRORS, ANTI_PATTERNS, DECISIONS) | INDEX entries stay (they live under the new path now); body text gets sed |
| `docs/superpowers/specs/*.md`, `docs/superpowers/plans/*.md` (recent BEK ones) | Path mentions |

### 4.4 Migration script (executable, runs once)

```bash
#!/bin/bash
set -euo pipefail
cd D:/dev2/projects/provodnik

# 1. Stop everything
npx pm2 delete quantumbek bek-watchdog 2>/dev/null || true

# 2. Create new layout
mkdir -p _archive/bek-frozen-2026-05-08/src _archive/bek-frozen-2026-05-08/sessions _archive/bek-frozen-2026-05-08/prompts _archive/bek-frozen-2026-05-08/sot _archive/bek-frozen-2026-05-08/checklists _archive/bek-frozen-2026-05-08/logs/stream _archive/bek-frozen-2026-05-08/logs/devnotes

# 3. Move source (using git mv where tracked, mv otherwise)
git mv .claude/bek _archive/bek-frozen-2026-05-08/src 2>/dev/null || mv .claude/bek _archive/bek-frozen-2026-05-08/src

# 4. Move sessions
mv .claude/bek-sessions/active   _archive/bek-frozen-2026-05-08/sessions/active
mv .claude/bek-sessions/archive  _archive/bek-frozen-2026-05-08/sessions/archive
rmdir .claude/bek-sessions

# 5. Move prompts
git mv .claude/prompts/skeleton.md _archive/bek-frozen-2026-05-08/prompts/skeleton.md 2>/dev/null || mv .claude/prompts/skeleton.md _archive/bek-frozen-2026-05-08/prompts/
mv .claude/prompts/out _archive/bek-frozen-2026-05-08/prompts/out
rmdir .claude/prompts 2>/dev/null || true

# 6. Move SOT
git mv .claude/sot _archive/bek-frozen-2026-05-08/sot 2>/dev/null || mv .claude/sot _archive/bek-frozen-2026-05-08/sot

# 7. Move checklists
git mv .claude/checklists _archive/bek-frozen-2026-05-08/checklists 2>/dev/null || mv .claude/checklists _archive/bek-frozen-2026-05-08/checklists

# 8. Move logs (rename in transit)
mv .claude/logs/bek-stream            _archive/bek-frozen-2026-05-08/logs/stream-old   # historical
mkdir -p _archive/bek-frozen-2026-05-08/logs/stream
mv .claude/logs/bek-heartbeat.json    _archive/bek-frozen-2026-05-08/logs/heartbeat.json    2>/dev/null || true
mv .claude/logs/bek-incidents.log     _archive/bek-frozen-2026-05-08/logs/incidents.log     2>/dev/null || true
mv .claude/logs/bek-restart.flag      _archive/bek-frozen-2026-05-08/logs/restart.flag      2>/dev/null || true
mv .claude/logs/bek-daemon.log        _archive/bek-frozen-2026-05-08/logs/daemon.log        2>/dev/null || true
mv .claude/logs/bek-daemon-error.log  _archive/bek-frozen-2026-05-08/logs/daemon-error.log  2>/dev/null || true
mv .claude/logs/bek-watchdog.log      _archive/bek-frozen-2026-05-08/logs/watchdog.log      2>/dev/null || true
mv .claude/logs/bek-watchdog-error.log _archive/bek-frozen-2026-05-08/logs/watchdog-error.log 2>/dev/null || true
mv .claude/logs/bek-pm2.out.log       _archive/bek-frozen-2026-05-08/logs/pm2.out.log       2>/dev/null || true
mv .claude/logs/bek-pm2.err.log       _archive/bek-frozen-2026-05-08/logs/pm2.err.log       2>/dev/null || true
mv .claude/logs/post-work.log         _archive/bek-frozen-2026-05-08/logs/post-work.log     2>/dev/null || true
mv .claude/logs/devnote-*.json        _archive/bek-frozen-2026-05-08/logs/devnotes/         2>/dev/null || true
```

The script is idempotent except for the destructive `git mv` / `mv` lines. Run it once, in a clean working tree, before touching code.

---

## 5. (D) TypeScript port

### 5.1 Why

- Catches the Windows-PM2 isMain class of bug (ERR-044) at compile time
- Single place to define the data shapes (`Heartbeat`, `Session`, `StreamEvent`, `Incident`) used across daemon, watchdog, observability server
- Tool input validation via Zod for runtime safety on top of compile-time types
- Better IDE autocomplete and refactoring

### 5.2 Build / run choice — `tsx` (no compile step)

Two options:

| Option | Pro | Con |
|---|---|---|
| **A — `tsx`** runs `.ts` directly via Node's `--import` loader | No build step, fastest iteration, no `dist/` to track | Slightly slower cold-start (~200ms TS compile per file), `tsx` dep |
| **B — `tsc`** compiles to `_archive/bek-frozen-2026-05-08/src/dist/*.js`, PM2 runs the JS | Standard, no runtime overhead | Two source-of-truth dirs, easy to forget to rebuild before restart, PM2 + `.git` need to ignore `dist/` |

**Choice: A (`tsx`)** for these reasons:
- Iteration speed matters more than 200ms cold-start (cold-start is bounded; daemon stays up for hours)
- BEK package is small; build complexity isn't earning its keep
- `tsx` is well-established, maintained by the esbuild folks, ~1MB

PM2 ecosystem entry becomes:
```js
{
  name: 'quantumbek',
  script: 'node',
  args: '--import tsx _archive/bek-frozen-2026-05-08/src/bek-daemon.ts',
  cwd: 'D:/dev2/projects/provodnik',
  ...
}
```

### 5.3 `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,   // tsx handles this
    "noEmit": true,                        // we don't compile, only typecheck
    "skipLibCheck": true,
    "lib": ["ES2024"]
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 5.4 Shared types

```ts
// _archive/bek-frozen-2026-05-08/src/types/heartbeat.ts
export const PHASES = {
  IDLE: 'idle',
  OPENING: 'opening',
  INIT: 'init',
  TEXT: 'text',
  SIGNAL: 'signal',
  CLOSING: 'closing',
} as const;
export type Phase = typeof PHASES[keyof typeof PHASES] | `tool_running:${string}`;

export interface Heartbeat {
  ts: string;            // ISO 8601
  phase: Phase;
  streamFile: string | null;
  messageStartedAt: string | null;
}

// _archive/bek-frozen-2026-05-08/src/types/session.ts
export type SessionState =
  | 'IDLE' | 'BRAINSTORMING' | 'PLAN_READY' | 'EXECUTING' | 'DONE';

export interface Session {
  state: SessionState;
  claude_session_id: string | null;
  group_id: number | null;
  task_slug?: string;
  started_at?: string;
  last_active?: string;
}

// _archive/bek-frozen-2026-05-08/src/types/stream-event.ts
export type StreamEventType =
  | 'open' | 'init' | 'tool' | 'text' | 'signal'
  | 'tool_end' | 'close' | 'error' | 'truncated';

export interface StreamEvent {
  ts: string;
  type: StreamEventType;
  summary: string;
}

// _archive/bek-frozen-2026-05-08/src/types/incident.ts (see §8)
// _archive/bek-frozen-2026-05-08/src/types/retry.ts (see §7)
```

### 5.5 Per-file port plan

Mechanical 1:1 port. No behavior changes. Tests stay green. Approximate LOC delta:

| File | Notes |
|---|---|
| `bek-daemon.mjs` → `.ts` | Largest file. Type the gramio context, queue jobs, runClaude options. ~280 → ~310 LOC. |
| `claude-runner.mjs` → `.ts` | Type the parsed stream chunks (already structured), the dispatchStreamEvent ctx. Add Zod schema for chunk parsing for runtime safety. ~280 → ~310 LOC. |
| `bek-watchdog.mjs` → `.ts` | Type `decide()` result as discriminated union. ~120 → ~130 LOC. |
| `bek-watchdog-run.mjs` → `.ts` | Trivial. |
| `bek-daemon-helpers.mjs` → `.ts` | Type the helper signatures. ~70 LOC. |
| `stream-log.mjs` → `.ts` | Type the handle. ~120 → ~130 LOC. |
| `heartbeat.mjs` → `.ts` | Use the shared `Heartbeat` type. ~70 → ~70 LOC. |
| `session-manager.mjs` → `.ts` | Use the shared `Session` type. Keep behavior identical. ~150 LOC. |
| `attachments.mjs`, `voice.mjs`, `commands.mjs`, `config.mjs`, `logger.mjs`, `memory.mjs`, `metrics.mjs`, `sanitizer.mjs`, `system-prompt.mjs`, `telegram-helpers.mjs`, `whisper.mjs` | Trivial ports. Mostly type the function signatures. |
| `test/*.test.mjs` → `.test.ts` | Tests imported types compile-check the production code. |

### 5.6 New files (independent of port)

- `retry.ts` — §7
- `incidents.ts` — §8
- `tools/postmortem.ts` — §8
- `observability/server.ts`, `observability/server-run.ts`, `observability/routes.ts`, `observability/public/index.html` — §6

---

## 6. (F) Observability HTTP server

### 6.1 Process

New PM2 app `bek-observability`. Independent process so a server crash can't take down the daemon.

```js
// _archive/bek-frozen-2026-05-08/src/ecosystem.config.cjs (excerpt)
{
  name: 'bek-observability',
  script: 'node',
  args: '--import tsx _archive/bek-frozen-2026-05-08/src/observability/server-run.ts',
  cwd: 'D:/dev2/projects/provodnik',
  autorestart: true,
  max_restarts: 20,
  min_uptime: '10s',
  restart_delay: 5000,
  out_file: '_archive/bek-frozen-2026-05-08/logs/observability.log',
  error_file: '_archive/bek-frozen-2026-05-08/logs/observability-error.log',
  time: true,
  env: { BEK_OBS_PORT: '3939', BEK_OBS_HOST: '127.0.0.1' },
}
```

### 6.2 Implementation — Node built-in `http` (no Express)

Zero new deps. ~200 LOC for the whole server.

```ts
// _archive/bek-frozen-2026-05-08/src/observability/server.ts
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readHeartbeat } from '../heartbeat.ts';
import { readIncidents } from '../incidents.ts';

const PORT = Number(process.env.BEK_OBS_PORT ?? 3939);
const HOST = process.env.BEK_OBS_HOST ?? '127.0.0.1';
const BEK_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export async function main() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
      const route = router[`${req.method} ${url.pathname}`];
      if (!route) return notFound(res);
      await route(req, res, url);
    } catch (err) {
      const e = err as Error;
      process.stderr.write(`[obs] ${e.message}\n`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });

  server.listen(PORT, HOST, () => {
    process.stdout.write(
      `${new Date().toISOString()} [bek-observability] listening on http://${HOST}:${PORT}\n`
    );
  });
}
```

### 6.3 Routes

| Route | Response |
|---|---|
| `GET /health` | 200 JSON: `{ heartbeat: Heartbeat \| null, queueDepth: number \| null, lastIncidents: Incident[] }`. PM2 / external monitors hit this. Returns 503 if heartbeat is null AND queue depth unreachable (file-only inspection — see §6.5). |
| `GET /` | 200 HTML — single-page dashboard. Auto-refresh + SSE tail of `current.log`. |
| `GET /current.log` | text/plain — `current.log` snapshot. Used by `?` for testing. |
| `GET /current.log/stream` | SSE stream — appends new lines from `current.log` as they arrive (file watcher). |
| `GET /incidents` | JSON array of recent incidents (last 50, configurable via `?n=`). |
| `GET /metrics` | Prometheus format (text/plain) — `bek_queue_depth`, `bek_phase`, `bek_uptime_seconds`, `bek_incident_count`, `bek_last_message_age_seconds`. |
| `GET /static/*` | `_archive/bek-frozen-2026-05-08/src/observability/public/*` — dashboard CSS/JS. |

### 6.4 Dashboard HTML

Single self-contained HTML file at `_archive/bek-frozen-2026-05-08/src/observability/public/index.html`. ~150 LOC, no framework. Updates from `/health` every 5s, opens an `EventSource` to `/current.log/stream` for live tailing.

Layout:
```
┌─ BEK status ──────────────────────────────────────┐
│ phase: tool_running:Bash    uptime: 2h 13m       │
│ queue: 0 pending / 1 running                      │
│ last message age: 0:42                            │
│ heartbeat: 2026-04-25T15:32:14.118Z (3s ago)     │
└──────────────────────────────────────────────────┘

┌─ Live stream ─────────────────────────────────────┐
│ 15:32:14 [tool] Bash node --test test/*.test.ts  │
│ 15:32:13 [text] Запускаю тесты.                  │
│ 15:32:11 [init] claude_session=cad1e303-...      │
│ 15:32:11 [open] session=continue msg="запусти t…│
└──────────────────────────────────────────────────┘

┌─ Recent incidents (3 of 7) ───────────────────────┐
│ 2026-04-25T03:29:24Z  RESTART  text 12.5min stale│
│ 2026-04-25T01:14:01Z  COOLDOWN tool_running:Bash │
│ 2026-04-25T00:53:11Z  RESTART  text 9.1min stale │
└──────────────────────────────────────────────────┘
```

### 6.5 Queue depth visibility

Daemon writes `queueDepth` (number) into a small file `_archive/bek-frozen-2026-05-08/logs/queue-status.json` on every change (`queue.on('add')`, `queue.on('next')`, `queue.on('idle')`). Observability server reads that file in `/health` and `/metrics`. ~10 LOC in daemon, no IPC.

```ts
// _archive/bek-frozen-2026-05-08/src/types/queue-status.ts
export interface QueueStatus {
  ts: string;
  size: number;     // pending
  pending: number;  // running
  isPaused: boolean;
}
```

### 6.6 Security

`BEK_OBS_HOST=127.0.0.1` by default — bound to loopback only, never exposed externally. No auth (it's a local dev tool). If you ever want remote access, route through a tunnel (cloudflared) with its own auth.

---

## 7. (G) Auto-retry transient errors

### 7.1 Where it wraps

Two call sites:

1. **`runClaude()` invocation in `bek-daemon.ts:handleMessage`** — wraps the call so a transient Claude API/Telegram error during one attempt doesn't fail the whole message.
2. **`ctx.send(msg)` calls** that aren't already fire-and-forget (mostly the streaming partial-text sender) — same wrapping; current `.catch(() => {})` becomes `.catch(retryable)`.

### 7.2 Classification

```ts
// _archive/bek-frozen-2026-05-08/src/retry.ts
export interface RetryClassification {
  retry: boolean;
  reason: 'transient' | 'permanent';
  category: string;
}

const TRANSIENT_CODES = new Set([
  'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'EPIPE',
  'ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH',
]);

const TRANSIENT_HTTP = new Set([408, 425, 429, 500, 502, 503, 504]);

export function classifyError(err: unknown): RetryClassification {
  const e = err as Error & { code?: string; status?: number; isBekTimeout?: boolean };

  // Permanent: our own SIGKILL timeout
  if (e.isBekTimeout) {
    return { retry: false, reason: 'permanent', category: 'bek_timeout' };
  }
  // Permanent: Claude exited non-zero with a config / quota problem
  if (e.message?.includes('Claude exited with code') &&
      !e.message?.includes('code 1')) {
    return { retry: false, reason: 'permanent', category: 'claude_exit_nonzero' };
  }
  // Transient: Node network errors
  if (e.code && TRANSIENT_CODES.has(e.code)) {
    return { retry: true, reason: 'transient', category: `node_${e.code}` };
  }
  // Transient: HTTP 4xx/5xx that are retryable
  if (typeof e.status === 'number' && TRANSIENT_HTTP.has(e.status)) {
    return { retry: true, reason: 'transient', category: `http_${e.status}` };
  }
  // Transient: gramio / fetch-style "fetch failed" / "network error"
  if (/fetch failed|network error|socket hang up|timeout/i.test(e.message ?? '')) {
    return { retry: true, reason: 'transient', category: 'network_text_match' };
  }
  // Default permanent
  return { retry: false, reason: 'permanent', category: 'unclassified' };
}
```

### 7.3 Retry loop

```ts
export interface RetryOptions {
  maxAttempts: number;       // default 3
  baseDelayMs: number;       // default 1000
  maxDelayMs: number;        // default 25000
  jitterMs: number;          // default 500
  onAttempt?: (attempt: number, err: unknown, classification: RetryClassification) => void;
}

const DEFAULTS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 25_000,
  jitterMs: 500,
};

export async function retryTransient<T>(
  fn: () => Promise<T>,
  opts: Partial<RetryOptions> = {},
): Promise<T> {
  const o = { ...DEFAULTS, ...opts };
  let lastErr: unknown;
  for (let attempt = 1; attempt <= o.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const c = classifyError(err);
      if (opts.onAttempt) opts.onAttempt(attempt, err, c);
      if (!c.retry || attempt === o.maxAttempts) throw err;
      const delay = Math.min(
        o.baseDelayMs * Math.pow(5, attempt - 1) + Math.random() * o.jitterMs,
        o.maxDelayMs,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr; // unreachable but keeps TS happy
}
```

Backoff: 1s → 5s → 25s. Total worst-case wait ~31s before surfacing the ❌. Acceptable.

### 7.4 Wiring in `bek-daemon.ts`

```ts
import { retryTransient, classifyError } from './retry.ts';
import { recordIncident } from './incidents.ts';

// inside handleMessage
try {
  await retryTransient(
    () => runClaude({ ... }),
    {
      onAttempt: (attempt, err, c) => {
        log(`[bek] attempt ${attempt} ${c.reason}/${c.category}: ${(err as Error).message}`);
      },
    },
  );
  setReaction(bot, ctx.chat.id, ctx.id, '✅');
} catch (err) {
  const c = classifyError(err);
  await recordIncident({
    kind: c.reason === 'transient' ? 'retry_exhausted' : 'permanent_error',
    sessionId: session?.claude_session_id ?? null,
    chatId: ctx.chat.id,
    messageId: ctx.id,
    phase: 'unknown',
    error: { message: (err as Error).message, category: c.category },
  });
  metrics.errors.inc();
  setReaction(bot, ctx.chat.id, ctx.id, '❌');
  ctx.send(c.reason === 'permanent'
    ? 'Что-то пошло не так. Работаю над этим.'
    : 'Сеть глючит. Попробуй ещё раз через минуту.'
  ).catch(() => {});
}
```

### 7.5 Metric

`metrics.retries` counter incremented on every retry attempt. Exposed via `/metrics` (§6).

### 7.6 Tests

`_archive/bek-frozen-2026-05-08/src/test/retry.test.ts`:

- `classifyError` for each code in `TRANSIENT_CODES`, each HTTP status in `TRANSIENT_HTTP`, `isBekTimeout`, `claude exited`, fetch-failed text match, generic unknown error → assert classification.
- `retryTransient` succeeds first try.
- `retryTransient` succeeds on second try after one transient.
- `retryTransient` exhausts retries on 3 transient and rethrows.
- `retryTransient` does NOT retry on permanent and rethrows immediately.
- Backoff timing: third-attempt delay ≥ 5s and ≤ 25.5s (with jitter window).

---

## 8. (K) Structured incident records + postmortem CLI

### 8.1 Two log surfaces

- **`_archive/bek-frozen-2026-05-08/logs/incidents.log`** — plain text, one line per incident, kept for human `tail -f` and existing tooling. Format unchanged from v1: `<ISO> RESTART stale=<n>ms threshold=<n>ms state=<X> phase=<P> stream=<F>`.
- **`_archive/bek-frozen-2026-05-08/logs/incidents.jsonl`** — NEW, structured one-line-per-incident JSON. Machine-readable, used by the postmortem CLI and the observability `/incidents` endpoint.

Both are written on every incident. Plain-text is the human-readable summary; JSONL is the source of truth for analysis.

### 8.2 `Incident` shape

```ts
// _archive/bek-frozen-2026-05-08/src/types/incident.ts
export type IncidentKind =
  | 'restart_triggered'      // watchdog touched the flag
  | 'cooldown_skipped'       // would have triggered but cooldown active
  | 'circuit_breaker'        // gave up after 3 in 30 min
  | 'unknown_heartbeat'      // watchdog read null heartbeat (informational)
  | 'retry_exhausted'        // daemon exhausted retryTransient
  | 'permanent_error'        // daemon hit a non-retryable error
  | 'crash_recovery';        // daemon resumed after restart

export interface Incident {
  ts: string;                 // ISO 8601
  kind: IncidentKind;
  sessionId: string | null;
  chatId: number | null;
  messageId: number | null;
  phase: string | null;
  staleMs?: number;
  thresholdMs?: number;
  streamFile: string | null;
  // Last N stream events leading up to the incident (taken from current.log
  // tail at incident time). Only included when meaningful.
  lastEvents?: Array<{ ts: string; type: string; summary: string }>;
  error?: {
    message: string;
    category: string;          // from RetryClassification
    code?: string;
    stack?: string;
  };
  // Human-friendly note (optional).
  note?: string;
}
```

### 8.3 `incidents.ts` API

```ts
// _archive/bek-frozen-2026-05-08/src/incidents.ts
import { appendFile } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Incident } from './types/incident.ts';

const INCIDENTS_LOG  = join(BEK_ROOT, 'logs', 'incidents.log');
const INCIDENTS_JSONL = join(BEK_ROOT, 'logs', 'incidents.jsonl');

export async function recordIncident(i: Omit<Incident, 'ts'> & { ts?: string }) {
  const inc: Incident = { ts: i.ts ?? new Date().toISOString(), ...i };

  // Plain-text line (human-readable)
  const text = formatIncidentText(inc);
  await appendFile(INCIDENTS_LOG, text + '\n').catch(() => {});

  // Structured JSONL line (machine-readable)
  await appendFile(INCIDENTS_JSONL, JSON.stringify(inc) + '\n').catch(() => {});
}

export async function readIncidents(opts: { limit?: number; sinceTs?: string } = {}): Promise<Incident[]> {
  if (!existsSync(INCIDENTS_JSONL)) return [];
  const raw = await readFile(INCIDENTS_JSONL, 'utf8');
  const all = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l) as Incident);
  let filtered = all;
  if (opts.sinceTs) filtered = filtered.filter((i) => i.ts >= opts.sinceTs!);
  if (opts.limit)  filtered = filtered.slice(-opts.limit);
  return filtered;
}

function formatIncidentText(i: Incident): string {
  const head = `${i.ts} ${i.kind.toUpperCase()}`;
  const parts: string[] = [];
  if (i.staleMs !== undefined)     parts.push(`stale=${i.staleMs}ms`);
  if (i.thresholdMs !== undefined) parts.push(`threshold=${i.thresholdMs}ms`);
  if (i.phase)                     parts.push(`phase=${i.phase}`);
  if (i.streamFile)                parts.push(`stream=${i.streamFile}`);
  if (i.error)                     parts.push(`error=${i.error.category}`);
  return [head, ...parts].join(' ');
}
```

### 8.4 Watchdog wiring

`bek-watchdog.ts:tick()` already decides on `{ action: 'skip' \| 'restart' }`. Replace the current `appendFile(INCIDENTS_LOG, ...)` calls with `recordIncident({ kind, ... })`.

For the `RESTART` case, also capture the last N events from `current.log` (tail) before writing the incident:

```ts
async function tailCurrentLog(n = 10): Promise<Incident['lastEvents']> {
  try {
    const raw = await readFile(join(BEK_ROOT, 'logs', 'current.log'), 'utf8');
    const lines = raw.split('\n').filter(Boolean).slice(-n);
    return lines.map((l) => {
      const m = l.match(/^(\S+)\t\[([^\]]+)\] (.*)$/);
      return m ? { ts: m[1], type: m[2], summary: m[3] } : { ts: '', type: 'raw', summary: l };
    });
  } catch { return undefined; }
}
```

### 8.5 Postmortem CLI

```ts
// _archive/bek-frozen-2026-05-08/src/tools/postmortem.ts — invoked as: bek-postmortem [opts]
// Run via: node --import tsx _archive/bek-frozen-2026-05-08/src/tools/postmortem.ts [opts]

import { readIncidents } from '../incidents.ts';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    date:        { type: 'string' },          // YYYY-MM-DD
    last:        { type: 'string' },          // last N
    'session-id': { type: 'string' },
    kind:        { type: 'string' },
    json:        { type: 'boolean' },
  },
});

const all = await readIncidents();
let filtered = all;
if (values.date)         filtered = filtered.filter((i) => i.ts.startsWith(values.date!));
if (values['session-id']) filtered = filtered.filter((i) => i.sessionId === values['session-id']);
if (values.kind)         filtered = filtered.filter((i) => i.kind === values.kind);
if (values.last)         filtered = filtered.slice(-Number(values.last));

if (values.json) {
  process.stdout.write(JSON.stringify(filtered, null, 2));
} else {
  for (const i of filtered) {
    process.stdout.write(formatHuman(i) + '\n\n');
  }
}

function formatHuman(i: Incident): string {
  const lines: string[] = [];
  lines.push(`── ${i.ts}  ${i.kind.toUpperCase()}`);
  if (i.sessionId)              lines.push(`   session: ${i.sessionId}`);
  if (i.phase)                  lines.push(`   phase:   ${i.phase}`);
  if (i.staleMs !== undefined)  lines.push(`   stale:   ${(i.staleMs / 1000).toFixed(1)}s (threshold ${i.thresholdMs! / 1000}s)`);
  if (i.streamFile)             lines.push(`   stream:  ${i.streamFile}`);
  if (i.error)                  lines.push(`   error:   ${i.error.category} — ${i.error.message}`);
  if (i.lastEvents?.length) {
    lines.push(`   last events:`);
    for (const e of i.lastEvents) lines.push(`     ${e.ts}  [${e.type}] ${e.summary}`);
  }
  if (i.note) lines.push(`   note:    ${i.note}`);
  return lines.join('\n');
}
```

Add to `_archive/bek-frozen-2026-05-08/src/package.json`:
```json
"bin": {
  "bek-postmortem": "./tools/postmortem.ts"
}
```
And alias for the dev-box: `npm link` from `_archive/bek-frozen-2026-05-08/src/` makes `bek-postmortem` global. Or invoke directly: `node --import tsx _archive/bek-frozen-2026-05-08/src/tools/postmortem.ts --date 2026-04-25`.

### 8.6 Tests

`_archive/bek-frozen-2026-05-08/src/test/incidents.test.ts`:
- `recordIncident` writes both plain-text and JSONL with matching content.
- `readIncidents` round-trips, filters by `sinceTs` and `limit`.
- Postmortem CLI: invoke as a child process with `--last 3 --json`, assert structured output.

---

## 9. (G + K crossover) Daemon crash-recovery instrumentation

The existing `Crash recovery — resuming state: <X>` log line in `bek-daemon.ts` becomes a structured `crash_recovery` incident. Lets postmortem analysis spot restart cycles.

```ts
// _archive/bek-frozen-2026-05-08/src/bek-daemon.ts
const existing = await sessions.readSession();
if (existing && existing.state !== 'IDLE') {
  await recordIncident({
    kind: 'crash_recovery',
    sessionId: existing.claude_session_id,
    phase: existing.state,
    streamFile: null,
    note: `Resumed after restart with state ${existing.state}`,
  });
  // ... rest of crash recovery branch unchanged
}
```

---

## 10. Implementation phases

### Phase 1 — Path migration (½ day)
- Stop daemons.
- Run migration script (§4.4).
- Update path constants in `.mjs` files (still `.mjs` at this phase).
- Update `ecosystem.config.cjs` script paths and PM2 logs.
- Update `bek.config.json:sessions_path`.
- Update `system-prompt.mjs` (where plans go).
- Update `.gitignore`.
- Update `.claude/CLAUDE.md` references (SOT paths, prompts paths).
- Update `~/.claude/.../memory/MEMORY.md` references.
- Update SOT cross-refs in HOT/ERRORS/ANTI_PATTERNS/DECISIONS bodies (paths only, not entry numbering).
- `pm2 delete` + `pm2 start` from new `_archive/bek-frozen-2026-05-08/src/ecosystem.config.cjs`.
- Verify: heartbeat updates, watchdog runs, send a test Telegram message, confirm BEK can write to `_archive/bek-frozen-2026-05-08/prompts/out/` (this proves the fix).
- Single commit: `refactor(bek): move runtime + source + SOT to _archive/bek-frozen-2026-05-08/`.

### Phase 2 — TypeScript port (1 day)
- Add `tsconfig.json`, install `tsx` + `@types/node` + `zod` (for tool input validation).
- Port files in dependency order (leaves first, daemon last):
  1. `types/*.ts` (new)
  2. `logger.ts`, `sanitizer.ts`, `metrics.ts`, `whisper.ts`, `memory.ts`
  3. `config.ts`, `system-prompt.ts`, `commands.ts`, `telegram-helpers.ts`
  4. `session-manager.ts`, `heartbeat.ts`, `stream-log.ts`
  5. `attachments.ts`, `voice.ts`
  6. `claude-runner.ts`, `bek-daemon-helpers.ts`
  7. `bek-watchdog.ts`, `bek-watchdog-run.ts`
  8. `bek-daemon.ts`
  9. `test/*.test.ts`
- Update `ecosystem.config.cjs` to use `node --import tsx ...` for all three apps.
- `npm test` passes (all 114 tests + new ones).
- `npx tsc --noEmit` clean.
- Single commit: `refactor(bek): TypeScript port — typed sessions, heartbeats, stream events`.

### Phase 3 — Retry wrapper (G) (½ day)
- New file `_archive/bek-frozen-2026-05-08/src/retry.ts`.
- New file `_archive/bek-frozen-2026-05-08/src/test/retry.test.ts`.
- Wire into `bek-daemon.ts:handleMessage`.
- Tests pass (114 + 6 new).
- Commit: `feat(bek): auto-retry transient errors (ECONNRESET, 429, 5xx)`.

### Phase 4 — Structured incidents (K) (½ day)
- New file `_archive/bek-frozen-2026-05-08/src/incidents.ts`.
- New file `_archive/bek-frozen-2026-05-08/src/types/incident.ts`.
- New file `_archive/bek-frozen-2026-05-08/src/tools/postmortem.ts`.
- New file `_archive/bek-frozen-2026-05-08/src/test/incidents.test.ts`.
- Wire into `bek-watchdog.ts` (replace appendFile calls).
- Wire into `bek-daemon.ts` (`crash_recovery`, `retry_exhausted`, `permanent_error`).
- Add `bin: bek-postmortem` to `package.json`.
- Commit: `feat(bek): structured incidents.jsonl + bek-postmortem CLI`.

### Phase 5 — Observability server (F) (1 day)
- New dir `_archive/bek-frozen-2026-05-08/src/observability/`.
- New file `_archive/bek-frozen-2026-05-08/src/observability/server.ts`.
- New file `_archive/bek-frozen-2026-05-08/src/observability/server-run.ts` (entrypoint shim, ERR-044 pattern).
- New file `_archive/bek-frozen-2026-05-08/src/observability/routes.ts`.
- New file `_archive/bek-frozen-2026-05-08/src/observability/public/index.html` + tiny CSS/JS.
- Daemon writes `queue-status.json` on every queue event.
- New PM2 app block in `ecosystem.config.cjs`.
- New file `_archive/bek-frozen-2026-05-08/src/test/observability.test.ts` — `/health`, `/incidents`, `/metrics` route smoke tests with stubbed file reads.
- Commit: `feat(bek): observability HTTP server on :3939 with dashboard + /health + /metrics`.

### Phase 6 — SOT bookkeeping (½ day)
- Add **ADR-024** documenting the `_archive/bek-frozen-2026-05-08/` move + TypeScript port + observability + retry + incidents.
- Add **ERR-046** documenting Claude CLI 2.1.119's `.claude/**` self-protect (root cause that triggered the move).
- Mark **ERR-045** + **AP-019** as superseded by ADR-024.
- Update **INDEX.md** entries.
- Commit: `docs(sot): ADR-024 BEK v2 — _archive/bek-frozen-2026-05-08/ + TS + observability + retry + incidents`.

**Total: 4 days of focused work.** Phases 1, 3, 4, 6 are short and independent; phase 2 is the bulk; phase 5 is the largest new feature. Each phase ends with a working daemon and passing tests; we can pause between any of them.

---

## 11. Testing strategy

### Unit tests (Node `--test`)

Existing 114 tests survive the port, plus:
- `retry.test.ts` — 6 cases (§7.6)
- `incidents.test.ts` — 4 cases (§8.6)
- `observability.test.ts` — 3 route smoke tests (§5.6)

Total target: **127 tests** all green before Phase 6.

### Integration tests (manual)

After Phase 1: send a Telegram message, confirm BEK writes plan-08.md to `_archive/bek-frozen-2026-05-08/prompts/out/` without permission errors. End-to-end watchdog cycle: inject stale heartbeat at `_archive/bek-frozen-2026-05-08/logs/heartbeat.json` → watchdog detects within 30s → flag created at `_archive/bek-frozen-2026-05-08/logs/restart.flag` → daemon exits → PM2 restarts.

After Phase 5: open `http://localhost:3939/`, see live phase + queue + last incidents. Send a message, watch the stream tail update via SSE. Hit `/health`, get JSON. Hit `/metrics`, get Prometheus format.

Across all phases: watchdog circuit-breaker still trips after 3 restarts in 30 min (existing behavior, just verifying no regression).

### Tests we are NOT writing
- HTTP server load tests (single user, localhost-only — pointless).
- Cross-Windows-version compatibility (we run on the dev box; not portable).
- Multi-instance concurrency (PM2 keeps each app singleton).

---

## 12. Rollout

Single dev box, single operator. No staged rollout, no canary. Each phase ends with a working daemon; we can pause between phases. If anything breaks:

- **Phase 1 rollback:** `git revert <commit>` and run the inverse migration script (paths in v1 layout still in git history).
- **Phase 2 rollback:** `git revert` — `.mjs` files restored. PM2 still runs them via `node` (no `tsx` needed).
- **Phase 3-5 rollback:** independent `git revert` per phase. Each phase is one commit.

---

## 13. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Forgotten path reference somewhere → BEK or orchestrator breaks silently | Med | Pre-commit grep audit per phase: `git grep -nE '\.claude/(sot\|bek\|prompts\|bek-sessions\|logs/(bek-\|devnote-))'` returns zero matches in tracked source files (excluding archived docs). |
| Mid-migration in-flight session lost | Low | Daemons fully stopped before script runs; `session.json` and `conversation.md` preserved verbatim, daemon resumes from new path on next start. |
| `tsx` runtime cold-start slows BEK's first response by ~200ms | Very low | Imperceptible vs Claude's own 3-5s first-token latency. |
| `_archive/bek-frozen-2026-05-08/src/node_modules/` accidentally tracked by git | Low | `.gitignore` adds `_archive/bek-frozen-2026-05-08/src/node_modules/`. Verify with `git status` before each commit. |
| Observability server crashes mid-tail and stops serving SSE | Low | PM2 restart on crash; max 5s downtime. Daemon and watchdog unaffected. |
| Retry wrapper masks a real bug by silently retrying | Med | Every retry attempt logs via `onAttempt` to `daemon.log`; metric `bek_retry_attempts_total` exposed via `/metrics`; if a category shows up frequently in postmortem, classification is wrong and we tighten. |
| Incidents JSONL grows unbounded | Low | Daily incidents are tens-of-bytes; even at 100/day for 10 years, file stays <40MB. Rotate manually if it ever matters. |
| Postmortem CLI used wrong (`--date 2026-13-01` etc.) | Very low | Just prints empty result; harmless. |
| Phase 5 introduces a new attack surface (HTTP server) | Very low | Bound to `127.0.0.1` only, no auth needed for loopback, no write endpoints. |

---

## 14. SOT companion (Phase 6)

### ADR-024 — BEK v2: `_archive/bek-frozen-2026-05-08/` root + TypeScript + observability + retry + incidents
- **Decision:** BEK's runtime, source, SOT, and prompts move under a new repo-root `_archive/bek-frozen-2026-05-08/` directory. Source ports to TypeScript with `tsx` runtime. Three new capabilities ship: localhost observability HTTP server (port 3939), transient-error retry wrapper around `runClaude` and `ctx.send`, and structured `incidents.jsonl` with a `bek-postmortem` CLI.
- **Alternatives considered:** (A) keep `.claude/` layout with hook-based permission overrides for `.claude/**` writes — ineffective for `bypassPermissions` mode and fragile across CLI updates. (B) Migrate to Claude Agent SDK — bigger rewrite, moves billing from claude.ai sub to API key, scope outside this work. (C) `tsc` build to `dist/` — extra build step, easy to forget; `tsx` runtime wins on iteration speed for a small package.
- **Constants pinned:** `BEK_OBS_PORT=3939`, retry max 3 attempts with 1s/5s/25s + 500ms jitter, postmortem CLI binary name `bek-postmortem`, all logs under `_archive/bek-frozen-2026-05-08/logs/`.
- **Why now:** Claude CLI 2.1.119 added hardcoded `.claude/**` self-protect that overrides `--dangerously-skip-permissions` (ERR-045). The root cause is location, not policy. Moving BEK out of `.claude/` removes the entire class of failure permanently.
- **Consequences:** Operator dashboard at `localhost:3939` removes `pm2 logs` from daily flow. Every transient network blip auto-recovers without operator intervention. Every incident has a structured record for forensics. Type errors caught at edit time rather than at runtime.
- **Date:** 2026-04-25

### ERR-046 — Claude CLI's `.claude/**` self-protect is mode-independent
- **Symptom:** `--permission-mode acceptEdits` still triggered the same `Claude requested permissions to edit ...\.claude\...` error as `bypassPermissions`. `permissions.allow` rules in `settings.json` did not override.
- **Root cause:** the protection on `.claude/**` writes is hardcoded across permission modes, evaluated before allow rules. The exempt list (`.claude/commands`, `.claude/agents`, `.claude/skills`) is the only escape inside `.claude/`.
- **Fix:** path migration (BEK v2 / ADR-024). Move BEK's writeable artifacts under `_archive/bek-frozen-2026-05-08/`. Permanent fix; future Claude CLI updates extending the protected list cannot bite us.
- **Files affected:** all of `_archive/bek-frozen-2026-05-08/`, plus path references in `.claude/CLAUDE.md`, MEMORY, and SOT bodies.
- **Date:** 2026-04-25
- **Prevention:** never rely on permission system shenanigans for `.claude/**` writes. If a tool needs to write under `.claude/`, move the target out of `.claude/`. See AP-019 (now a stronger statement).

### Mark superseded
- **ERR-045** — superseded by ERR-046 (the previous theory that allow rules would work was incorrect; the correct fix is path migration).
- **AP-019** — superseded by AP-020 (don't even try to bypass `.claude/**` self-protect; move out instead).

### AP-020 — Don't try to write to `.claude/**` from a non-interactive Claude session
- **What was tried:** allow rules, hook-based approval, `--permission-mode acceptEdits`, Bash redirects.
- **Why it failed:** the protection is hardcoded across permission modes; allow rules and the approval hook output don't override it; Bash redirects to `.claude/` paths trigger the same self-protect via the Bash tool's compound-command checking.
- **Correct approach:** if a non-interactive Claude session (BEK, CI, headless agent) needs to write to a path, that path must NOT be under `.claude/**`. Use `_archive/bek-frozen-2026-05-08/`, `bek-data/`, `runtime/`, or any other repo-root sibling directory.

---

## 15. Out of scope (deferred)

Explicitly NOT in this spec, brainstormed but rejected for v2:

- **Custom MCP server** for typed BEK signals (replacing `TELEGRAM:` text grep). Big quality win, separate scope.
- **Telegram webhook mode** — eliminates ERR-038 forever but needs a public HTTPS endpoint.
- **Persistent SQLite-backed queue** — message-loss-on-crash is rare; in-memory p-queue is fine for now.
- **Hook-based permission overrides** — strictly worse than path migration.
- **Multi-user / multi-group support** — single-operator product today.
- **cursor-agent dispatch replacement** — separation of "BEK plans, cursor-agent executes" is intentional.
- **Pre-warmed Claude CLI process pool** — bounded latency; speculative optimization.
- **Smarter conversation summarizer** — current trigger works; tighten only if behavior degrades.
- **Agent SDK migration** — distinct path, distinct billing model, distinct rewrite. Possibly the right move someday; not today.

---

## 16. Open questions

1. **Phases 3–5 ordering — strict sequence or parallelize?** Recommended: strict (3 → 4 → 5) so each commit is independently verifiable. If you want speed, 4 + 5 can be parallel branches if we resync at commit time.
2. **Postmortem CLI distribution** — `npm link` from `_archive/bek-frozen-2026-05-08/src/` to make `bek-postmortem` global on the dev box, or just document `node --import tsx _archive/bek-frozen-2026-05-08/src/tools/postmortem.ts ...` as the invocation? My pick: document the explicit form; npm link breaks across machines.
3. **Observability dashboard location** — `localhost:3939` only (recommended), or also expose on the LAN with a basic auth header? My pick: localhost only. If remote access ever needed, route through cloudflared with its own auth.
4. **Should phase 2 (TS port) include Zod runtime validation on tool inputs from the Claude CLI stream-json?** Recommended: yes for `tool_use` content blocks (so a malformed CLI output surfaces as a structured error rather than a `parseStreamChunk` returning `null`). ~30 LOC, ~1 hour.
