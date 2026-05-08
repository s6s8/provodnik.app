# BEK Mission-Minimal Rewrite — Design

**Date:** 2026-04-29
**Anchor:** [`_archive/bek-frozen-2026-05-08/MISSION.md`](../../../_archive/bek-frozen-2026-05-08/MISSION.md)
**Author:** orchestrator (Claude) with Alex
**Status:** approved (variant Z from brainstorm)

---

## Problem statement

BEK has grown to **3283 lines / 24 TypeScript files** to serve four functions that need ~700 lines. The bloat created the failure modes that hit production on 2026-04-29:

1. **Auto-archive cliff** lost the pending action ("send HTML prototype") across cut-over to a fresh Claude API session.
2. **No disk-side ground truth** — new session relied entirely on a narrative summary that omitted state.
3. **Pre-archive didn't preserve last user message verbatim** — new session said "разговор оборвался на середине ответа" and asked Alex to repeat himself.
4. **Cross-machine file hallucination** — Bek confidently claimed access to `C:\Users\BOSTON\...` (Alex's machine), then to Google Drive, then asked Alex to paste content manually.

Postmortem in conversation: <https://see ERR-049+ block in `_archive/bek-frozen-2026-05-08/sot/ERRORS.md` and incident `[bek] auto-archive — reason=line_count` at 2026-04-29T07:45:29Z>.

The four root causes are all symptoms of the same architectural drift: **BEK treats LLM context as the source of truth for state, then layers fragile recovery mechanisms on top.** The fix is to remove the mechanisms (auto-archive, summarizer, state machine, narrative cut-over) that create the failure surface in the first place.

## Mission anchor (verbatim from `_archive/bek-frozen-2026-05-08/MISSION.md`)

> Telegram-фронт для Alex'а, чтобы брейнштормить дизайн с Claude и записывать планы на диск, которые потом подхватывает оркестратор.
>
> В минимуме это четыре функции:
> 1. **I/O** — принимать сообщения из Telegram (текст / голос / фото) и отправлять ответы.
> 2. **Mind** — прокидывать в Claude API с правильным контекстом.
> 3. **Memory** — держать историю разговора + долгосрочные факты, чтобы Бек был коherent.
> 4. **Output** — писать планы (`_archive/bek-frozen-2026-05-08/prompts/out/plan-NN.md`) и память на диск.

## Goal

Collapse BEK from 3283 lines / 24 files / 8 persistence files / 228-line system prompt to **~700-800 lines / ~14 files / 2 persistence files / ~50-line system prompt** that serve only the four mission functions. Migration is incremental and shippable phase-by-phase — BEK keeps responding to Alex throughout.

## Non-goals (explicit, from MISSION.md)

- State machines beyond what's needed for I/O (BRAINSTORMING / PLAN_READY / EXECUTING — gone).
- In-prompt verification gates that don't mechanically enforce anything (PLAN_READY 6-checklist — gone).
- Auto-archive / summarizer cliffs (gone — root cause of 04-29).
- Watchdog/heartbeat infrastructure separate from PM2 process supervision (gone — PM2 already supervises).
- Plain-text signal protocols parsed by regex (TELEGRAM:/STATE:/LEARN:/HEAL_ACTION/ARCHIVE_SESSION — replaced by tool calls).
- CONCEPT LEDGER infrastructure (gone — memory.md in free form covers the same need).
- ANZOR DEFENSE PROTOCOL hardcoded into system prompt (gone — moves to memory.md if Alex still wants it as a personality quirk).
- `brief.md` orchestrator-injected one-shot context contract (gone — orchestrator can write to memory.md or post via Telegram).

## Out of scope for this plan

- Multimedia handling changes (voice + photo + PDF stay as-is — current `voice.ts`, `whisper.ts`, `attachments.ts` are tight and work).
- Telegram client (`gramio`) — keep as-is.
- PM2 process management — keep as-is.
- Migration of historical archive sessions (`_archive/bek-frozen-2026-05-08/sessions/archive/*`) — they keep working with old code if anyone reads them; new code never writes to that path.
- Building a state.json / world.json reconcile system (rejected during brainstorm — auto-archive cliff doesn't exist in new architecture, so reconcile isn't needed).

---

## Architecture

### Four-function module layout

```
_archive/bek-frozen-2026-05-08/src/
  bek-daemon.ts              # entry: telegram I/O, queue, message dispatch       (~250 lines, was 538)
  claude-runner.ts           # Anthropic SDK direct call w/ tool use              (~150 lines, was 338 + subprocess)
  claude-tools.ts            # tool definitions + execution                        (~120 lines, new)
  conversation-jsonl.ts      # append-only turn log + rolling window read          (~80 lines, new)
  session-manager.ts         # session.json (5 fields)                             (~50 lines, was 185)
  system-prompt.ts           # ~50-line BEK_SYSTEM_PROMPT                          (~70 lines, was 302)
  memory.ts                  # memory.md long-term facts (kept as-is)              (~186 lines, unchanged)
  reply-linter.ts            # existing linter + foreign-path BLOCK rule           (~220 lines, was 192)
  path-validator.ts          # sandbox path check for file tools                   (~50 lines, new)
  sanitizer.ts               # outgoing text scrub (kept as-is)                    (~47 lines, unchanged)
  commands.ts                # /pause /abort /plan /status /done /execute (ack)    (~80 lines, was 109)
  telegram-helpers.ts        # withTyping, setReaction, makeStreamer (kept as-is)  (~130 lines, unchanged)
  attachments.ts, voice.ts, whisper.ts                                             (kept as-is, ~187 lines)
  config.ts                  # bek.config.json loader (kept as-is)                 (~46 lines, unchanged)
  retry.ts                   # transient API error retry (kept as-is)              (~89 lines, unchanged)
  types/session.ts           # 5-field Session interface                           (~10 lines, was 15)
  test/                      # existing test infra reused                          (unchanged)
```

**Deletions** (entire files):
- `concepts.ts` (CONCEPT LEDGER infrastructure — 122 lines)
- `heartbeat.ts` (PM2 covers process liveness — 76 lines)
- `incidents.ts` (audit log nobody reads — 70 lines)
- `bek-watchdog.ts`, `bek-watchdog-run.ts` (file-flag self-heal — 143+? lines)
- `status-pill.ts` (cosmetic, no business value — 108 lines)
- `silent-drop.ts` (workaround for signal protocol — 23 lines)
- `metrics.ts` (PM2/io metrics nobody graphs — 23 lines)
- `bek-daemon-helpers.ts` (auto-archive helpers — 152 lines, partially preserved as inline)
- `stream-log.ts` (per-message stream files for debug — 129 lines)

**Total deleted: ~870 lines, ~9 files.**

### Data flow

```
Telegram message ──> bek-daemon.ts (queue) ──> claude-runner.ts
                                                  │
                                                  ├── reads conversation.jsonl (rolling window)
                                                  ├── reads memory.md
                                                  ├── reads session.json
                                                  │
                                                  v
                                             Anthropic SDK
                                             messages.stream({
                                               model, max_tokens,
                                               messages, tools
                                             })
                                                  │
                                                  ├── tool_use: send_telegram(text)  ──> sanitize ──> reply-linter ──> Telegram
                                                  ├── tool_use: write_plan(n, body)  ──> _archive/bek-frozen-2026-05-08/prompts/out/plan-NN.md
                                                  ├── tool_use: add_memory(tag, fct) ──> memory.md
                                                  ├── tool_use: Read/Write/Edit      ──> path-validator ──> fs
                                                  │
                                                  v
                                             append turn to conversation.jsonl
```

### Persistence (2 files instead of 8)

**`_archive/bek-frozen-2026-05-08/sessions/active/session.json`** — minimal:
```json
{
  "schema_version": 2,
  "created_at": "2026-04-29T...",
  "group_id": -5102411622,
  "last_active": "2026-04-29T..."
}
```
No `state` field. No `claude_session_id` (Anthropic SDK is stateless per call — we resend history). No `task_slug` (no archive). No `started_at` separate from `created_at`.

**`_archive/bek-frozen-2026-05-08/sessions/active/conversation.jsonl`** — append-only, one turn per line:
```jsonl
{"ts":"2026-04-29T07:43:12Z","role":"user","content":"Согласен на твою последовательность"}
{"ts":"2026-04-29T07:43:18Z","role":"assistant","content":[{"type":"text","text":"..."},{"type":"tool_use","id":"toolu_01","name":"send_telegram","input":{"text":"..."}}]}
{"ts":"2026-04-29T07:43:18Z","role":"user","content":[{"type":"tool_result","tool_use_id":"toolu_01","content":"ok"}]}
```
**Never deleted.** Old turns stay forever for debug. Rolling window read returns last N turns or M tokens, whichever smaller.

**Deletions** (files no longer written):
- `conversation.md` (replaced by `.jsonl`)
- `conversation-summary.md` (no summarizer, no need)
- `plan.md` (replaced by `write_plan` tool writing directly to `_archive/bek-frozen-2026-05-08/prompts/out/plan-NN.md`)
- `checkpoints.json` (state machine deleted)
- `brief.md` (orchestrator-injected context — gone)
- `memory-archive.md` (memory rotation can be in-place truncation if needed)
- `concepts.json` / `concepts-active.md` (CONCEPT LEDGER deleted)

`memory.md` stays as-is — it's the only durable long-term store.

### Conversation rolling window

```typescript
async function readWindow(maxTurns = 50, maxTokens = 50_000): Promise<Turn[]> {
  const all = await readJsonl();          // all turns ever
  const tail = all.slice(-maxTurns);      // last 50 turns
  let tokens = 0;
  const result: Turn[] = [];
  for (let i = tail.length - 1; i >= 0; i--) {
    tokens += approxTokens(tail[i]);      // ~4 chars per token, mixed cyrillic
    if (tokens > maxTokens && result.length > 0) break;
    result.unshift(tail[i]);
  }
  return result;
}
```

50 turns + 50K token cap = always under 25% of 200K Claude context. No cliff. No archive. Old turns on disk for debug, never deleted. If a single conversation eventually accumulates 10000 turns, the file is 10000 lines of JSONL — still readable, still cheap.

### Tool-call output protocol (replaces TELEGRAM:/STATE:/LEARN: regex)

Three tools, defined in `claude-tools.ts`, declared on every Anthropic API call:

```typescript
{
  name: 'send_telegram',
  description: 'Send a message to the Telegram group. This is how you talk to the user. Plain text, Russian. The daemon handles delivery, sanitization, and linter checks.',
  input_schema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Message body in Russian' }
    },
    required: ['text']
  }
}

{
  name: 'write_plan',
  description: 'Persist a numbered plan to disk at _archive/bek-frozen-2026-05-08/prompts/out/plan-NN.md. Call when you have a complete plan ready for the orchestrator. NN is the plan number (integer). Body is the plan in markdown.',
  input_schema: {
    type: 'object',
    properties: {
      number: { type: 'integer', description: 'Plan number, e.g. 27' },
      body: { type: 'string', description: 'Full plan markdown' }
    },
    required: ['number', 'body']
  }
}

{
  name: 'add_memory',
  description: 'Append a long-term fact to memory.md under a topic tag. Use when you discover something useful for ALL future sessions.',
  input_schema: {
    type: 'object',
    properties: {
      tag: { type: 'string', description: 'Short topic tag (no spaces), e.g. "schema" or "process"' },
      fact: { type: 'string', description: 'One-line fact in plain language' }
    },
    required: ['tag', 'fact']
  }
}
```

Native Claude SDK file tools (`Read`, `Write`, `Edit`, `Glob`, `Grep`) are also available — wrapped by `path-validator.ts` to enforce the sandbox.

### Honesty rails (kept from brainstorm Section 4)

**Layer 1 — system prompt sandbox boundaries** (`system-prompt.ts`, ~20 of the ~50 lines):
```
SANDBOX BOUNDARIES (hard rules):

You run on Alex's Windows host as the bek-daemon process. Your file access is limited to:
  - D:\dev2\projects\provodnik\**           (project root)
  - C:\Users\x\.claude\projects\**          (your own memory)

You have NO access to:
  - User's other directories (C:\Users\BOSTON\..., /home/alex, ~/Downloads)
  - Other machines (his laptop, his phone, any remote box)
  - The internet (no fetch, no download, no Google Drive)

When user mentions a path that LOOKS like it's on his machine — it IS on his machine,
NOT yours. You cannot read it.

Honest responses for inaccessible content:
  1. "У меня нет доступа к X. Скинь содержимое сюда или закоммить в репо."
  2. "Файл на твоей машине, я его не вижу. Покажи диффом / скриншотом."
  3. "Не знаю — нет способа проверить отсюда."

NEVER claim access, downloads, or capabilities you haven't verified via tool call.
```

**Layer 2 — reply-linter foreign-path BLOCK** (extends `reply-linter.ts`):
```typescript
const FOREIGN_PATH_PATTERNS = [
  /C:\\Users\\(?!x\\)[A-Za-z0-9_-]+/i,
  /\/home\/(?!.*provodnik)[a-z0-9_-]+/i,
  /~\/(Desktop|Downloads|Documents|Music|Videos)/i,
  /D:\\(?!dev2\\projects\\provodnik)[A-Za-z0-9_]/,
];
```
Match → `{ rule: 'foreign-path', severity: 'reject' }` → message blocked, returned to Bek as tool error.

**Layer 3 — path-validator wrapper** (`path-validator.ts`, new):
```typescript
const ALLOWED_ROOTS = [
  'D:\\dev2\\projects\\provodnik',
  'C:\\Users\\x\\.claude\\projects',
];

export function validatePath(p: string): { ok: boolean; reason?: string } {
  const abs = path.resolve(p);
  const inAllowed = ALLOWED_ROOTS.some(root =>
    abs.toLowerCase().startsWith(root.toLowerCase())
  );
  return inAllowed ? { ok: true } : {
    ok: false,
    reason: `Path "${abs}" outside sandbox. Allowed roots: ${ALLOWED_ROOTS.join(', ')}`
  };
}
```
Wraps any tool that takes a path arg (Read, Write, Edit). Reject before file system call. Bek receives tool error and self-corrects.

**Bash tool** — disable entirely in new system prompt. Bek never needs `git`/`bun`/shell; the orchestrator does all of that. Removing Bash from the tool list eliminates a class of attacks/mistakes.

### Authority model (preserved, moved out of system prompt)

Currently the 228-line system prompt encodes "Alex can chat, only CarbonS8 can /execute". This survives as code in `commands.ts`:

- `/pause`, `/abort`, `/plan`, `/status`, `/done` → CarbonS8-only (existing `parseOverride` check).
- `/execute` → CarbonS8-only, but **becomes a no-op acknowledgment**: posts "Принято. Передаю." to the group and does nothing else. The state machine that actually gated /execute is gone; the orchestrator (the human reading the conversation) does the work via cursor-dispatch.mjs.
- Alex says "execute" / "go" / "давай" in plain Russian → no special handling. Bek treats it as conversation. If Bek wants to remind Alex of the convention, he says so via `send_telegram`.

The phrase-instruction "If Alex says 'go': tell him CarbonS8 must /execute. Stay PLAN_READY." is **deleted** from the prompt. There's no PLAN_READY state to stay in; whether Bek nags Alex about the convention is a soft persona choice, not a load-bearing rule.

### Russian persona (preserved, simplified)

Current 228-line prompt has identity, persona, answer-length, critical rules, role boundary, capabilities, hard privacy, plan_ready gate, state machine, signal format, concept ledger, learn rules, plan naming, plan persistence, session files, crash recovery, anzor defense, phase templates, status report format. **17 sections.**

New ~50-line prompt:
```
[BEK IDENTITY]
You are BEK. Senior product engineer for the Provodnik project.
Russian-language replies via send_telegram tool. Internal work in English.
Direct, low-tolerance, gets-it-done. Not an AI assistant.

[FOUR FUNCTIONS]
1. Receive Telegram messages from Alex (the product owner) and CarbonS8 (the orchestrator).
2. Brainstorm product/design with them.
3. When a plan is ready, persist it via write_plan(number, body).
4. Persist long-term facts via add_memory(tag, fact).

[TOOLS]
- send_telegram(text): your output channel. Russian. Plain text. The daemon delivers and lints.
- write_plan(number, body): save _archive/bek-frozen-2026-05-08/prompts/out/plan-NN.md. Use when plan is complete.
- add_memory(tag, fact): persist a one-line fact for future sessions.
- Read, Write, Edit, Glob, Grep: file system tools, sandboxed (see below).

[SANDBOX BOUNDARIES — hard rules]
{20 lines from above}

[AUTHORITY MODEL]
Alex defines what to build via natural language.
CarbonS8 dispatches execution via /execute (which is a no-op handoff acknowledgment in this daemon — actual execution is run separately by the orchestrator).
Trust both with conversation. Don't gatekeep.

[OUTPUT RULES]
Every user-visible reply goes through send_telegram. No bare text — bare text is wasted tokens.
One question at a time when you need clarification. Multi-paragraph answers when the question deserves them.
```

Anzor Defense Protocol, status report format, plan naming conventions — all gone from the prompt. If they're load-bearing, they reappear as code (status report = a tool that summarizes plan progress) or as memory.md entries (Anzor — a persona quirk Alex can re-add manually).

---

## Migration strategy — incrementally shippable

The active Telegram conversation must keep working through every phase. Strategy: **build new alongside old, flip default at cutover, demolish legacy after smoke**.

| Phase | What ships | Default behavior | Rollback |
|-------|------------|------------------|----------|
| 1 | `claude-sdk-runner.ts` parallel to `claude-runner.ts` | unchanged (CLI subprocess) | n/a |
| 2 | Tool definitions + system-prompt SDK block | unchanged | n/a |
| 3 | `conversation-jsonl.ts` module + write-through wiring | unchanged (md + jsonl both written) | revert wiring |
| 4 | Foreign-path linter rule + path-validator | rule active for both runners | toggle rule |
| 5 | `system-prompt-minimal.ts` + commands.ts /execute ack | unchanged (old prompt active) | n/a |
| 6 | Flip `use_sdk_runner: true` in default config + smoke gate | new default, manual smoke | flip back to false |
| 7 | Delete legacy files | unchanged behavior, slimmer codebase | git revert |

Every phase is one or two cursor-agent tasks, each 2-5 min of work. Orchestrator runs typecheck + lint + targeted tests after each dispatch (per ADR-025: cursor-agent prompts have ZERO `git`/`bun` commands).

## Constraints

### Inherited (must obey)

- **HOT/ADR-025 + ERR-047**: cursor-agent prompts contain no `git`/`bun`/shell commands. Orchestrator runs all of those. Tasks specify file paths + edits only.
- **HOT/AP-014 + ERR-034 + ERR-036**: any client/server import boundary not relevant here (BEK is server-only Node).
- **HOT/AP-018 + ERR-044**: `import.meta.url` self-detection in PM2-managed Node ESM — already handled by current daemon entrypoint, do not re-introduce.
- **HOT/ADR-022 + AP-017**: `bek-restart.flag` channel — being deleted (watchdog gone), but during phases 1-5 do not touch the flag handling.
- **HOT/ERR-008**: model name format. SDK uses Anthropic standard IDs: `claude-sonnet-4-6` (canonical). Cursor-agent's nonstandard naming does not apply here.
- **HOT/ADR-024 + ERR-046 + AP-020**: writes to `.claude/**` self-protect; new code writes to `_archive/bek-frozen-2026-05-08/**` only.

### From brainstorm (locked)

- No state.json / world.json / sniffer / reconcile system — auto-archive cliff is removed at the source.
- No state machine (BRAINSTORMING / PLAN_READY / EXECUTING / DONE).
- No watchdog beyond PM2 + the daemon's own startup crash recovery.
- Bash tool excluded from Bek's tool list.

## Terminology locked

- "BEK" not "БЕК" / "bek-daemon" / "QuantumBEK" in user-facing copy. (Internal class names like `QuantumBEK` may stay if they exist; user-visible strings use "BEK".)
- "send_telegram" / "write_plan" / "add_memory" — these tool names are the canonical contract. No variants like `telegram_send`, `save_plan`, `learn`.
- "conversation.jsonl" — not "conversation.log" or "history.jsonl".
- "session.json" — kept for back-compat path (active/session.json).

`rg`-able forbidden terms (must not appear in **the new minimal code** — `_archive/bek-frozen-2026-05-08/src/system-prompt-minimal.ts` and its successor `_archive/bek-frozen-2026-05-08/src/system-prompt.ts` after Task 13's rename. Mentions in spec/plan/task-prompt artifacts are allowed and expected when specifying deletion or testing legacy-CLI-branch preservation during the dual-mode phase):
- `BRAINSTORMING` (state machine — gone)
- `PLAN_READY` (state machine — gone)
- `EXECUTING` (state machine — gone)
- `summarizeIfNeeded` (summarizer — gone)
- `auto-archive` (mechanism — gone)
- `CONCEPT LEDGER` (infrastructure — gone)
- `Anzor Defense Protocol` (hardcoded persona — gone)

## Test strategy

Existing test infra at `_archive/bek-frozen-2026-05-08/src/test/` reused. Each new module gets a test file alongside:
- `conversation-jsonl.test.ts` — append + window read + token cap
- `claude-sdk-runner.test.ts` — mocked Anthropic SDK + tool dispatch
- `claude-tools.test.ts` — tool execution wiring
- `path-validator.test.ts` — sandbox enforcement
- `reply-linter.test.ts` (extend) — foreign-path BLOCK rule
- `commands.test.ts` (extend) — /execute as ack-only

Manual smoke: SOT.md "Smoke Verification" checklist — reused as Phase 6 gate.

## Risks

| Risk | Mitigation |
|------|-----------|
| Anthropic SDK behaves differently from CLI subprocess (rate limits, error shapes, streaming) | Dual-runner phase; toggle back to CLI if SDK exposes new failure modes |
| Tool calls less reliable than text signals — Bek forgets to call `send_telegram` | Keep system prompt explicit; daemon detects "no send_telegram in turn" and sends Bek's text content as a fallback Telegram (parallel to current `silent_drop_recovered` logic) |
| Long conversations (>5000 turns over months) make jsonl read slow | Read-tail-only via reverse-line-stream; benchmark at 10K-line file; if pathological, add a separate `recent.jsonl` mirror for window reads |
| Active Telegram session breaks during cutover | Gate Phase 6 on SOT.md smoke checklist passing on local pre-deploy run |
| `path-validator` rejects legitimate write to `_archive/bek-frozen-2026-05-08/prompts/out/plan-NN.md` because of case-sensitivity quirk | Case-insensitive normalize in validator; explicit unit test for `_archive/bek-frozen-2026-05-08/prompts/out/plan-27.md` write |

## Self-review

- [x] Mission anchor cited verbatim
- [x] All 24 source files in current codebase accounted for (kept / deleted / modified)
- [x] All 8 persistence files accounted for (kept / deleted / replaced)
- [x] All four 04-29 failure modes mapped to specific architectural changes
- [x] Migration is phased and shippable, not big-bang
- [x] Cursor-agent constraints from HOT.md (ADR-025, ERR-047) honored
- [x] Anthropic SDK API patterns verified via Context7
- [x] Terminology locks listed for `rg` verification at plan time
- [x] Risks named with concrete mitigations, not handwaved
