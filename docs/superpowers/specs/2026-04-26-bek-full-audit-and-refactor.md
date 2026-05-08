# BEK full-system audit + refactor brainstorm

**Date**: 2026-04-26
**Audit scope**: all of `_archive/bek-frozen-2026-05-08/src/**/*.ts` (~3.5K LOC, 23 modules), `ecosystem.config.cjs`, `bek.config.json`, plus integration with PM2 / tsx loader / Claude CLI / GramIO / Whisper.
**Stance**: top-engineer-on-autonomous-systems. Bias toward simplification, fewer moving parts, fewer races, fewer silent-failure edges.
**Research**:
- Context7: GramIO docs (`/gramiojs/gramio`) — error-handling and lifecycle hooks
- Web: SSE-tail patterns, PM2 + tsx ESM Windows configurations

---

## 1. Executive summary

BEK is a Telegram-driven Claude Code orchestrator with self-healing (watchdog), observability HTTP server, voice/image/PDF intake, and structured incidents. Architecture is sound: three PM2 apps (daemon, watchdog, observability) communicate via filesystem (heartbeat.json, restart.flag, incidents.jsonl). The split is well-chosen — a watchdog crash can't take down the daemon, and the observability server is read-only.

The audit found:
- **3 functional bugs** that affect runtime behavior (one in observability/SSE, one duplicate-write in conversation.md, one unused error-classification path).
- **8 robustness gaps** — mostly silent failures and missing log-rotation / file-cleanup.
- **6 simplification opportunities** — refactors that reduce LOC without changing behavior.
- **5 maintainability fixes** — type/comment/test cleanup.
- **2 architecture upgrades** worth considering — adopting GramIO's `.onError` typed errors and `suppress: true` API pattern instead of ad-hoc `.catch(() => {})`.

**No critical security issues found.** Observability listens on 127.0.0.1 only; tokens stay in `bek.config.json` (gitignored). Sanitizer scrubs internal tool/path/AI names from outgoing Telegram messages — minor improvement opportunity (incidents.jsonl is NOT scrubbed; if exposed via /incidents endpoint, may leak paths in error messages).

**Refactor priority**: Bugs → robustness → simplification. The system is operational and stable; this is hygiene-level cleanup, not crisis triage.

---

## 2. Architecture overview

```
                    Telegram
                       │
                       ▼
              ┌─────────────────┐
              │   quantumbek    │  PM2 app #1 — daemon
              │  bek-daemon.ts  │
              └─────────────────┘
                ↓ writes        ↓ writes
       heartbeat.json     incidents.{log,jsonl}
       queue-status.json  daemon.log
       stream/*.log       memory.md / concepts.md
                ↑ reads
       ┌───────────────────┐         ┌──────────────────┐
       │   bek-watchdog    │         │ bek-observability│
       │ bek-watchdog.ts   │         │ obs/server.ts    │
       │ PM2 app #2        │         │ PM2 app #3       │
       │ polls every 30s   │         │ HTTP :3939       │
       └───────────────────┘         └──────────────────┘
                ↓ writes
            restart.flag (read by daemon every 5s → process.exit)
                ↓
         PM2 autorestart (62s delay, max_restarts: 20)
```

Communication is async + filesystem-mediated. No direct IPC, no shared memory, no clustering. This is the right shape for an autonomous-system supervisor — failure of any one process can't propagate.

---

## 3. Bugs found

### B1. observability/server.ts — SSE tail logic is broken (HIGH severity)

**Lines 200–225.** The "tail current.log via SSE" handler reads the file every 1s, computes `newPart` as a slice based on a Buffer-byteLength dance, then *throws away `newPart`* and falls through to "emit last 3 lines regardless":

```ts
const fd = await readFile(CURRENT_LOG, 'utf8');
const newPart = fd.slice(/* ... incoherent expression ... */);  // ← computed
// Simplest correct: re-read full and emit newly-appended lines.
const allLines = fd.split('\n');                                 // ← actually used
// Send last line if file grew. (Approximate; fine for human dashboard.)
if (totalBytes > lastSize) {
  const newLines = allLines.filter((l) => l.trim()).slice(-3);   // ← always last 3
  for (const line of newLines) res.write(`data: ${line}\n\n`);
}
```

Effect: dashboard re-emits the same last-3 lines every second a new line arrives. Browsers see duplicated events. On bursty writes (>3 lines/sec), lines get lost.

**Fix** (research-backed pattern from `dev.to/manojspace`): use byte-accurate read with `createReadStream({ start: lastSize })`:

```ts
const interval = setInterval(async () => {
  if (!existsSync(CURRENT_LOG)) return;
  try {
    const st = await stat(CURRENT_LOG);
    if (st.size > lastSize) {
      const stream = createReadStream(CURRENT_LOG, {
        start: lastSize, end: st.size - 1, encoding: 'utf8',
      });
      let buf = '';
      stream.on('data', (chunk: string) => {
        buf += chunk;
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (line.trim()) res.write(`data: ${line}\n\n`);
        }
      });
      stream.on('end', () => {
        lastSize = st.size;
        if (buf.trim()) res.write(`data: ${buf}\n\n`);
      });
    } else if (st.size < lastSize) {
      lastSize = 0; // file rotated/truncated
    }
    res.write(': ping\n\n');
  } catch { /* ignore */ }
}, 1000);
```

Also: `import { ..., watch } from 'node:fs/promises'` at line 14 — `watch` is imported but never used. Dead import.

### B2. bek-daemon.ts — voice/attachment messages double-logged in conversation.md (MEDIUM)

**Lines `attachments.ts:43` + `bek-daemon.ts:157`**: `enqueueAttachment` appends `[user]: [изображение] caption` to conversation.md, then calls `handleMessage(ctx, "[user прислал изображение]", path)` which appends *again* on line 157 of daemon.

Net result: every image/PDF/voice message produces TWO conversation.md entries with slightly different content.

**Same pattern in voice.ts:37** + `bek-daemon.ts:157` — voice is logged twice.

**Fix**: pick one site of truth. Recommend keeping the `attachments.ts` / `voice.ts` site (richer info: caption, language, transcription) and remove the daemon-side `appendConversation` for messages that come from the attachment/voice paths. The daemon currently has no way to detect "this came from an attachment" — pass an opt-out flag through `handleMessage(ctx, text, file, { skipAppend?: boolean })`.

### B3. retry.ts — `lastErr` throw at line 81 is unreachable (LOW)

```ts
for (let attempt = 1; attempt <= o.maxAttempts; attempt++) {
  try { return await fn(); } catch (err) {
    lastErr = err;
    ...
    if (!c.retry || attempt === o.maxAttempts) throw err;  // ← always throws
    ...
  }
}
throw lastErr;  // ← unreachable
```

The loop either returns from `fn()` or throws on `!c.retry || attempt === o.maxAttempts`. Final `throw lastErr` is dead code. Cosmetic but flags an over-cautious pattern; the simpler shape is fine.

### B4. concepts.ts — substring fuzzy match is too aggressive (MEDIUM)

`updateLedger`'s heuristic at lines 100–106:

```ts
const substringHit = concepts.findIndex(
  (c) => normalizeTerm(c.term).includes(norm) || norm.includes(normalizeTerm(c.term)),
);
if (substringHit >= 0) { /* add as variant */ }
```

This collapses *any* substring relationship into "variant of existing." For real-world Russian terms this is rare, but the FIFO test caught the failure mode (`term0` swallows `term10`). Risk: BEK names two genuinely-distinct concepts in the same session and one becomes a variant of the other.

**Fix**: drop the substring heuristic. Use strict normalize-equality + variant-list lookup only. If two terms share substrings, treat them as separate concepts; let the orchestrator dedupe at session-archive via `bek-compact` cross-pass.

### B5. claude-runner.ts — `proc.stdout.on('data', async ...)` allows out-of-order dispatch (LOW under current load)

**Line 294–303**: async event handler. Multiple chunks can arrive faster than `dispatchStreamEvent` resolves, leading to interleaved appendFile calls and `eventCount` mutation races.

In practice, Node's appendFile is queued and stream-log's `eventCount` is monotonic-by-line, so the observed effect is small. But the cap-check (`eventCount + 1 > STREAM_EVENT_LIMIT`) can read a stale value and over-emit.

**Fix**: serialize via promise chain (same pattern as `makeStreamer` in telegram-helpers.ts):

```ts
let chain = Promise.resolve();
proc.stdout?.on('data', (chunk: Buffer) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';
  chain = chain.then(async () => {
    for (const line of lines) {
      const ev = parseStreamChunk(line);
      if (ev) await dispatchStreamEvent(ev, dispatchCtx);
    }
  });
});
```

### B6. memory.ts — `parseEntry` (legacy) and `validateEntry` (new strict) duplicate parsing logic

Both extract `[tag] body` from raw input via near-identical regex. After T1 of Plan 12, `appendMemory` calls both. Cleaner: `validateEntry` is a strict superset; `parseEntry` should fall back through it.

### B7. bek-daemon.ts — `await sessions.appendConversation(...)` race with summarizer (LOW)

Lines 157–158 run in sequence: append, then summarize. But between them, `bek-daemon.ts` is single-process so no race. The race exists if a future change parallelizes. Document the invariant.

### B8. ecosystem.config.cjs — absolute tsx loader path is fragile

`'file:///D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/src/node_modules/tsx/dist/loader.mjs'` hardcodes:
- A specific drive letter (won't move to another machine)
- A path that breaks if `tsx` major version moves the loader file
- The `_archive/bek-frozen-2026-05-08/src/node_modules` location (depends on bun/npm install layout)

Per Future Studio's PM2+tsx guide and Front-Commerce's pattern, the cleaner config:

```cjs
// In _archive/bek-frozen-2026-05-08/src/ — install tsx there, set cwd to that dir
{
  name: 'quantumbek',
  script: './bek-daemon.ts',
  cwd: 'D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/src',
  interpreter: 'node',
  interpreter_args: '--import tsx/esm',
  ...
}
```

This resolves `tsx/esm` from `cwd/node_modules/tsx`, no absolute path. Caveat: changing this is high-risk; ERR-044 (PM2 isMain self-detection) was the original reason for the awkward layout. Test on a branch first.

---

## 4. Robustness gaps

### R1. logger.ts — no log rotation (HIGH)
`daemon.log` grows unbounded. With ~50–100 lines per BEK message, in a year this is hundreds of MB. PM2 has `pm2-logrotate` — install + configure:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```

This rotates `daemon.log`, `watchdog.log`, `pm2.out.log`, etc. consistently.

### R2. attachments.ts — downloaded files in `_archive/bek-frozen-2026-05-08/logs/` not periodically purged
Files like `photo-1776..jpg`, `pdf-1776..pdf` accumulate. They're unlinked on successful processing (daemon line 285), but lost on crashes. `runStreamPurge` only cleans `stream/*.log`. Extend to cover `photo-*` and `pdf-*` older than 24h.

### R3. heartbeat.ts — silent write failures don't surface
On lines 51–55 a write failure logs to stderr but doesn't `recordIncident`. If heartbeat writes fail repeatedly, the watchdog will trigger restarts — but there'll be no incident showing *why* the heartbeat went stale. Add an incident on heartbeat write failure.

### R4. config.ts — no schema validation
Loads JSON, spreads defaults. Typos in config keys silently fall through to defaults. `zod` is already in devDependencies — define a `BekConfigSchema = z.object({...})` and parse with `.parse()` for fail-fast.

### R5. bek-daemon.ts — voice/attachment errors don't `recordIncident`
Lines 39–43 of voice.ts catch transcription errors and `log()` them. Same in attachments. These should be `recordIncident({ kind: 'attachment_error', ... })` so postmortem has visibility.

Add `attachment_error`, `voice_error` to `IncidentKind`.

### R6. observability/server.ts — incident error messages exposed unsanitized via /incidents
`recordIncident` writes `error.message` verbatim. If a Claude error contains a path or token, it ends up in `incidents.jsonl` and is served by `/incidents`. Run the same `sanitize()` from sanitizer.ts on `error.message` before persistence.

### R7. session-manager.ts `archive()` — no mid-flight protection
If a message is being processed when `/abort` or `/done` triggers archive, the in-flight `runClaude` continues writing to a now-archived activePath. Result: streamHandle writes go to a vanished directory; `appendMemory` writes to relocated memory.md. No data loss but potential ENOENT errors.

**Fix**: track an `activeMessageInFlight` flag in queue; archive waits for queue.idle before moving files.

### R8. claude-runner.ts — SIGKILL on timeout leaves Claude child processes
On timeout, `proc.kill('SIGKILL')` terminates the Claude CLI. Any subprocesses Claude spawned (sub-shells, MCP servers) become orphans. Windows: usually reaped by Job Object association. Linux: zombies until parent exit. Acceptable for v1; document.

### R9. memory.ts — hard cap (200) > rotate threshold (80, default) means cap is dead
Rotation fires at >80 entries and moves half (~40) to archive. So memory.md rarely exceeds ~120 entries. The hard cap (200) protects against config tampering only. Note: tightening rotateThreshold via `bek.config.json` overrides default 80. If user sets it to 250, hard cap kicks in. Document this interaction.

### R10. retry.ts — `Math.pow(5, attempt - 1)` has no upper-attempt guard
For `maxAttempts = 3` it's fine (1s/5s/25s). If a future caller sets `maxAttempts = 10`, the third-onward delays explode (5s, 25s, 125s, 625s capped to maxDelayMs=25s — saved by min cap, OK). But the implicit dependency between maxAttempts and the cap is a footgun. Consider a generic exponential-with-cap formula:

```ts
const delay = Math.min(o.baseDelayMs * 2 ** (attempt - 1), o.maxDelayMs) + Math.random() * o.jitterMs;
```

Power 2 is more conventional and readable. Power 5 was chosen for "back off hard from network glitches" but is arbitrary.

---

## 5. Simplification opportunities

### S1. bek-daemon.ts — extract `routeMessage(ctx)` from the 50-line `bot.on('message', ...)` block
Current shape:
```ts
bot.on('message', async (ctx) => {
  if (!locked) return;
  if (ctx.text) { ... 10 lines ... }
  if (ctx.photo) { ... }
  if (ctx.document) { ... 15 lines ... }
  if (ctx.voice) { ... }
});
```

Refactor:
```ts
bot.on('message', async (ctx) => {
  if (!await isLockedGroup(ctx.chat.id)) return;
  await routeMessage(ctx);
});

async function routeMessage(ctx) {
  if (ctx.text)     return routeText(ctx);
  if (ctx.photo)    return routeAttachment(ctx, 'image', ctx.photo);
  if (ctx.document) return routeDocument(ctx);
  if (ctx.voice)    return routeVoice(ctx);
}
```

Reduces nesting, makes each branch unit-testable.

### S2. attachments.ts + voice.ts — share `enqueueIncoming(...)` helper
Both files duplicate the pattern: create a queue.add closure that does `download → handleMessage → metric.set`. Single helper:

```ts
function enqueueIncoming(queue, ctx, prep: () => Promise<{ text: string; file?: string }>) {
  const promise = queue.add(async () => {
    const { text, file } = await prep();
    await handleMessage(ctx, text, file ?? null);
  });
  metrics.queueDepth.set(queue.size + queue.pending);
  return promise;
}
```

`enqueueAttachment` and `enqueueVoice` become 5-line callers of this.

### S3. retry.ts — collapse three classification paths into one rule list
Currently: `TRANSIENT_CODES` (Set), `TRANSIENT_HTTP` (Set), regex text-match block. Three different code paths for the same decision. Replace with:

```ts
const RULES: { match: (e: ErrLike) => boolean; category: string }[] = [
  { match: e => !!e.isBekTimeout,                         category: 'bek_timeout',      retry: false },
  { match: e => e.message?.includes('Claude exited'),     category: 'claude_exit',      retry: false },
  { match: e => TRANSIENT_CODES.has(e.code ?? ''),        category: e => `node_${e.code}`, retry: true },
  { match: e => TRANSIENT_HTTP.has(e.status ?? -1),       category: e => `http_${e.status}`, retry: true },
  { match: e => /fetch failed|.../.test(e.message ?? ''), category: 'network_text',     retry: true },
];
```

Clearer intent, easier to extend.

### S4. claude-runner.ts — `dispatchStreamEvent` switch instead of if-chain
`if (ev.kind === 'init') ... if (ev.kind === 'assistant_blocks') ... if (ev.kind === 'tool_result') ...` is exhaustive over `ParsedChunk` discriminated union. TypeScript can prove exhaustiveness with switch + `never`:

```ts
switch (ev.kind) {
  case 'init': ... return;
  case 'assistant_blocks': ... return;
  case 'tool_result': ... return;
  default: { const _exhaustive: never = ev; throw new Error('unreachable'); }
}
```

### S5. observability/server.ts — extract SSE handler from inline route
60 lines of inline lambda. Extract `handleStreamRoute(req, res)` for readability and testability.

### S6. system-prompt.ts — split into sections
~180-line frozen string. Hard to diff cleanly when adding rules (Plan 12 added two sections). Consider:

```
_archive/bek-frozen-2026-05-08/prompts/system/
  identity.md
  persona.md
  state-machine.md
  signal-format.md
  privacy.md
  concept-ledger.md      ← new from Plan 12
  verification-gate.md   ← new from Plan 12
  defense.md
```

Compile at module-load time:
```ts
const sections = ['identity', 'persona', ...].map(n =>
  await readFile(join(__dirname, '../prompts/system', `${n}.md`), 'utf8'));
export const BEK_SYSTEM_PROMPT = sections.join('\n\n');
```

Trade-off: more files, easier diffs and section-level reuse vs. more I/O at startup. Worth it once the prompt grows past ~250 lines.

---

## 6. Maintainability

### M1. Test naming: `describe('memory.mjs', ...)` references the legacy `.mjs` filename even though file is now `.ts`. Cosmetic; rename for grep-ability.

### M2. SOT.md and TODO.md inside `_archive/bek-frozen-2026-05-08/src/` — these are legacy from pre-`_archive/bek-frozen-2026-05-08/` migration. Move to `_archive/bek-frozen-2026-05-08/sot/` or delete if covered by other SOT files.

### M3. `IncidentKind` union grows ad-hoc. Plan 12 added three (`linter_reject`, `linter_warn`, `gate_bypassed`). Define it in `types/incident.ts` as a const-object map of kind → human label, drives both the type and postmortem rendering:

```ts
export const INCIDENT_KINDS = {
  restart_triggered: 'Watchdog restart triggered',
  cooldown_skipped:  'Restart skipped due to cooldown',
  linter_reject:     'Reply linter rejected outgoing message',
  ...
} as const;
export type IncidentKind = keyof typeof INCIDENT_KINDS;
```

### M4. Some files declare types inline that are duplicated elsewhere (`MessageCtx` in daemon, similar `AttachmentCtx`, `VoiceCtx` in their files). Consolidate into `types/telegram-ctx.ts` with structural-typing intent documented.

### M5. ecosystem.config.cjs hardcodes paths in three places. If the project moves, all three must update. Extract:

```cjs
const ROOT = 'D:/dev2/projects/provodnik';
const BEK = `${ROOT}/.bek`;
const TSX_LOADER = `file:///${BEK}/src/node_modules/tsx/dist/loader.mjs`;
// then use BEK / ROOT / TSX_LOADER below
```

---

## 7. Architecture upgrades worth considering

### U1. Adopt GramIO `.onError` typed error system (Context7-confirmed)

Currently `bek-daemon.ts:293` registers `bot.onError(...)`, but uses ad-hoc string-matching on error messages elsewhere (e.g. `isBekTimeout` flag, `e.message?.includes('Claude exited')` in retry.ts). GramIO supports custom typed error classes:

```ts
class ClaudeTimeoutError extends Error { ... }
class ClaudeExitError extends Error { exitCode: number; ... }

const bot = new Bot(token)
  .error('CLAUDE_TIMEOUT', ClaudeTimeoutError)
  .error('CLAUDE_EXIT', ClaudeExitError)
  .onError(({ kind, error, context }) => {
    if (kind === 'CLAUDE_TIMEOUT') return context.send('Завис. Попробуй ещё раз.');
    if (kind === 'CLAUDE_EXIT')    return context.send(`Ошибка ${error.exitCode}.`);
    if (kind === 'TELEGRAM')       return context.send(`Telegram: ${error.message}`);
  });
```

Compare to current scattered approach where `claude-runner.ts` throws a `Error & { isBekTimeout: true }` and the daemon's main try/catch sniffs the property. The typed-error pattern is cleaner and removes the need for `classifyError()` text-matching in retry.ts.

### U2. Use GramIO `bot.api.method({ ..., suppress: true })` instead of `.catch(() => {})` chains

Current daemon style (telegram-helpers.ts:51):
```ts
return bot.api.setMessageReaction({ ... }).catch(() => {});
```

This silently swallows ALL errors including non-network ones. GramIO's `suppress: true` returns `TelegramError` as a value:
```ts
const result = await bot.api.setMessageReaction({ ..., suppress: true });
if (result instanceof TelegramError) { /* log specific code */ }
```

This is the right level of error handling for fire-and-forget operations: don't crash, but don't blind-swallow either.

---

## 8. Recommended fix order (prioritized)

| # | Item | Severity | Effort | Notes |
|---|------|----------|--------|-------|
| 1 | B1 — fix observability SSE tail | High | 30 min | Real bug, dashboard misbehaves |
| 2 | B2 — fix double-write to conversation.md | Medium | 30 min | Bloats history; increases summarizer pressure |
| 3 | R1 — install pm2-logrotate | High | 10 min | One-time setup; prevents disk fill |
| 4 | R3+R5 — record incidents on heartbeat write fail + voice/attachment errors | Medium | 45 min | Better postmortem visibility |
| 5 | R6 — sanitize incident error messages | Medium | 20 min | Privacy hygiene |
| 6 | B4 — drop substring heuristic in concepts.ts | Medium | 15 min | Already caught by tests |
| 7 | R4 — zod schema for BekConfig | Low | 30 min | Fail-fast on typos |
| 8 | R2 — extend stream-purge to attachment files | Low | 15 min | Prevents log dir bloat |
| 9 | S2 — share enqueueIncoming helper | Low | 30 min | Pure refactor |
| 10 | S3 — collapse retry classification | Low | 30 min | Pure refactor |
| 11 | U1+U2 — adopt GramIO typed errors + suppress | Medium | 2 hrs | Architectural improvement; defer |
| 12 | S6 — split system-prompt | Low | 1 hr | Defer until prompt > 250 lines |
| 13 | B8 — refactor ecosystem.config.cjs | Medium | 1 hr | Test on branch; risky given ERR-044 |

**Total for prioritized 1–10**: ~4 hrs of cleanup work. Ships as a single follow-up plan ("Plan 13 — BEK hygiene").

---

## 9. What NOT to fix

- **B3 (unreachable `throw lastErr` in retry.ts)** — defensive code, no harm, leaving it documents intent.
- **B5 (async stdout handler ordering)** — only matters at extreme stream rates; current Claude output is bursty but bounded.
- **R7 (archive race with in-flight message)** — hasn't been observed in 200+ sessions; would only fire if user types `/abort` within ~50ms of a message arriving.
- **R8 (SIGKILL leaves Claude children)** — Windows Job Object reaping handles it; not observed leaking.
- **S6 (system-prompt split)** — premature until prompt grows further; current 180-line single file is still grep-able.
- **B8 (ecosystem.config.cjs absolute paths)** — works; documented in code comments; risk-of-change > benefit-of-cleanup.

These are noted for a future revisit, not immediate work.

---

## 10. Patterns worth keeping

The audit also noted things BEK does *right* that other projects botch:

- **Three-process supervision** — daemon / watchdog / observability are independently restartable. Common anti-pattern is to bundle health-check into the main process, which dies with it.
- **Filesystem-mediated IPC** (heartbeat.json, restart.flag, incidents.jsonl) — debuggable with `cat`. No socket bookkeeping. Crash-resilient.
- **Atomic heartbeat write** (tmp + rename + EEXIST fallback) — readers never see partial JSON.
- **Circuit breaker in watchdog** — limits restart loops to 3/30min. Prevents runaway death spirals.
- **`makeStreamer` promise-chain serialization** — clean pattern for ordered async edits to a remote message. Apply same pattern in B5 (claude-runner stdout handler).
- **`incidents.jsonl` + `bek-postmortem` CLI** — structured postmortem from the start, not retrofitted. Excellent.
- **No mocks in tests** — the `whisper.test.ts` uses real spawn() and tests the error path with a non-existent binary. More reliable than mocks.
- **Sanitizer on outgoing Telegram** — defense-in-depth against accidental tool/path leaks.

---

## 11. Sources

- [GramIO docs (Context7)](https://context7.com/gramiojs/gramio/llms.txt) — `.onError` typed errors and `suppress: true` API pattern
- [Real-time Log Streaming with Node.js and React using SSE — DEV Community](https://dev.to/manojspace/real-time-log-streaming-with-nodejs-and-react-using-server-sent-events-sse-48pk)
- [Implement Log Watcher (similar to tail -f command) — Medium](https://medium.com/@ibrahimanis/implement-log-watcher-similar-to-tail-f-command-7b0674d4b767)
- [PM2 — Use TSX to Start Your App — Future Studio](https://futurestud.io/tutorials/pm2-use-tsx-to-start-your-app)
- [Start Front-Commerce with PM2](https://developers.front-commerce.com/docs/3.x/guides/start-front-commerce-with-pm2/)
- [PM2 - Ecosystem File](https://pm2.keymetrics.io/docs/usage/application-declaration/)

---

## 12. Conclusion

BEK is a well-structured autonomous agent runtime. The audit found one clear functional bug (B1), one cosmetic-but-real bug (B2), and a handful of robustness/simplification opportunities. The architecture is right; the failure modes are well-isolated; the observability is good.

The recommended Plan 13 (≈4 hrs, items 1–10 from §8) brings BEK from "operational" to "polished autonomous system." Items 11–13 are nice-to-have and can wait until they're actually painful.

**No emergency fixes needed.** The system is safe to keep running as-is while Plan 13 is queued.
