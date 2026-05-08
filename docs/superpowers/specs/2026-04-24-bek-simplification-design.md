# BEK Simplification — Design

**Date:** 2026-04-24
**Scope:** `.claude/bek/` only
**Type:** refactor + one subsystem removal + two targeted feature tweaks
**Goal:** Same user-visible behavior, fewer moving parts, no duplication, bounded LEARN memory, summarizer that actually runs.

---

## 1. Motivation

`bek-daemon.mjs` is 487 LOC with eight concerns in one file. Three attachment handlers (photo / doc-image / doc-pdf) are near-copies. The watchdog subsystem (179 LOC, separate PM2 process, spawns its own Claude) can no longer fire because the state it watches for — `EXECUTING` — was removed from BEK's state machine in commit `d96ac20`. LEARN memory grows unbounded. The conversation summarizer, added in `cb7df2e`, has a current 808-line `conversation.md` past its 120-line threshold with no `conversation-summary.md` in sight — it is either silently failing or has never run.

## 2. Non-goals

- No user-visible behavior change in the Telegram group.
- No changes to signal protocol (`TELEGRAM:` / `STATE:` / `LEARN:` / `ARCHIVE_SESSION` / block forms all preserved).
- No changes to BEK's persona, rules, or privacy posture.
- No library swaps. `gramio`, `p-queue`, `@pm2/io`, `whisper` stay.
- No new features. This is a cleanup + one subsystem deletion + two tweaks.

## 3. What gets deleted

- `watchdog.mjs` (144 LOC)
- `healer-prompt.mjs` (35 LOC)
- `override-handler.mjs` (35 LOC — its content merges into `commands.mjs`)
- `bek-watchdog` app entry in `ecosystem.config.cjs`
- Stale `EXECUTING` reference in the healer prompt (gone with the file)

Rationale for watchdog: `watchdog.mjs:122-123` explicitly skips `BRAINSTORMING` and `PLAN_READY`, and those are the only states BEK enters post-role-redesign. PM2 `autorestart: true` still handles process-level crashes. The daemon's own startup crash recovery (currently `bek-daemon.mjs:455-471`) still restores session context after a restart. Nothing real is lost.

## 4. Final file layout

```
.claude/bek/
├── bek-daemon.mjs         [~120 LOC — wiring, dispatch, crash recovery, launch]
├── config.mjs             [NEW — load config + apply defaults + group-lock write]
├── logger.mjs             [NEW — direct-file logger, shared across modules]
├── telegram-helpers.mjs   [NEW — withTyping, setReaction, downloadTelegramFile, makeStreamer, chunkText]
├── attachments.mjs        [NEW — image + pdf dispatch]
├── voice.mjs              [NEW — voice download → Whisper → text]
├── commands.mjs           [MERGED — parseOverride + handleOverride + UNAUTHORIZED_RESPONSES]
├── memory.mjs             [NEW — memory.md load, append, rotate, tail-read]
├── metrics.mjs            [NEW — @pm2/io wrapper; no-op when not under PM2]
├── claude-runner.mjs      [UNCHANGED — do not touch parseSignals or runClaude]
├── session-manager.mjs    [SLIGHTLY SHRUNK — memory ops moved out; active-file reads consolidated]
├── system-prompt.mjs      [REFACTORED — shared renderContextBlocks(); LEARN tag convention added]
├── sanitizer.mjs          [UNCHANGED]
├── whisper.mjs            [UNCHANGED]
└── ecosystem.config.cjs   [remove bek-watchdog entry]
```

Voice lives in its own `voice.mjs` (~30 LOC). It is structurally different from image/pdf (in-memory Buffer → Whisper, different error message), so it does NOT belong in `attachments.mjs` — keeping it separate preserves strict per-concern file boundaries.

`signal-handlers.mjs` is intentionally NOT a new module. The `onSignal` callback stays inline in `handleMessage` — it is a clean 25-LOC switch, not a duplication.

## 5. Module interfaces

### `config.mjs`
```js
export async function loadConfig(configPath)   // returns config with defaults inlined
export async function writeGroupLock(configPath, config, chatId)  // atomic write
```
Default keys applied on load:
- `stream_gap_reset_ms` → 90_000
- `claude_timeout_ms` → 1_500_000
- `whisper_bin` → 'whisper'
- `whisper_model` → 'large-v3-turbo'
- `max_queue_depth` → 4
- `memory_inject_tail` → 30  *(NEW)*
- `memory_rotate_threshold` → 80  *(NEW)*
- `telegram_max` → 4000  *(NEW — unifies sanitizer + streamer)*
- `stream_max` → 3800  *(NEW)*

### `logger.mjs`
```js
export const log = async (msg) => { ... }     // info level (current behavior)
export const warn = async (msg) => { ... }    // [WARN] prefix, used by summarizer
```
One shared file handle path, one shape, one import across the codebase.

### `telegram-helpers.mjs`
```js
export function withTyping(bot, chatId, fn)
export function setReaction(bot, chatId, messageId, emoji)
export async function downloadTelegramFile(bot, token, fileId, prefix)
export function makeStreamer(bot, chatId, { gapMs, streamMax })
export function chunkText(text, maxLen)
```

### `attachments.mjs`
```js
export function enqueueAttachment(queue, ctx, kind, deps)
// kind: 'image' | 'pdf'
// deps: { sessions, handleMessage, bot, token, metrics }
```
Collapses three ~40-LOC near-copies into one function. Voice stays out by design.

### `voice.mjs`
```js
export function enqueueVoice(queue, ctx, deps)
// deps: { sessions, handleMessage, bot, config, log, sanitize, metrics }
```
Single function: downloads voice buffer via `bot.downloadFile`, runs Whisper from `whisper.mjs`, appends conversation, delegates to `handleMessage`. Error path sends "Голосовое не распознал. Попробуй ещё раз." — kept separate because this error message is voice-specific.

### `commands.mjs`
```js
export function parseOverride(text, username)
export function randomUnauthorizedResponse()
export async function handleOverride(ctx, command, deps)
// deps: { queue, sessions, config, sanitize, log }
```

### `memory.mjs`
```js
export async function readMemory(sessionsPath, { tail } = {})
// if tail: return last N entries across all tags, flat newest-first
// otherwise: return full file content

export async function appendMemory(sessionsPath, entry, { rotateThreshold })
// entry may start with `[tag] ...`; if so, append under `## Tag` section
// if no tag, append under `## Misc`
// after append, if total entries > rotateThreshold,
//   move oldest 50% to memory-archive.md (category structure preserved)
```

Tag taxonomy is **freeform** — whatever BEK emits between `[` and `]` becomes a section header (title-cased). No migration of existing entries required; they stay in the file and are treated as `## Misc` on first read, re-grouped in-place on next rotation cycle. No hand-written heuristic.

### `metrics.mjs`
```js
export const metrics = {
  queueDepth: { set(n) },
  sessionState: { set(state) },
  errors: { inc() },
  learns: { inc() },
  latency: { update(ms) },
}
```
Thin wrapper over `@pm2/io`. When not under PM2, all methods are no-ops.

### `session-manager.mjs` changes
- Remove `readMemory`, `appendMemory` (moved to `memory.mjs`).
- Add `readPlan()` convenience (used by `/plan` command; eliminates the hand-rolled `join(..., 'active', 'plan.md')` in `handleOverride`).
- `readConversationForContext` unchanged.
- Summarizer trigger stays here but swallowed errors become visible via `logger.warn` (not `process.stderr.write`).

### `system-prompt.mjs` refactor
- Extract `renderContextBlocks({ memory, brief, plan, checkpoints, history })` — shared between first and continuation prompts.
- `buildFirstPrompt` and `buildContinuationPrompt` keep distinct public signatures; body delegates to the shared renderer.
- Add one paragraph to `BEK_SYSTEM_PROMPT` documenting the LEARN tag convention:
  ```
  LEARN signals MAY be prefixed with a bracketed tag, e.g.
    LEARN: [schema] ...
    LEARN: [ux] ...
    LEARN: [constraints] ...
  The tag is freeform — pick a word that groups related knowledge.
  If no tag is given the entry goes under Misc.
  ```
- No other persona, rule, or behavior edits.

## 6. Dedup map (explicit)

| Current duplication | Replacement |
|---|---|
| 3x attachment handlers (photo / doc-image / doc-pdf) — ~120 LOC | one `enqueueAttachment(...)` — ~60 LOC |
| 6+ `config.foo ?? default` fallbacks | one `loadConfig()` applies defaults |
| `buildFirstPrompt` + `buildContinuationPrompt` both render memory/brief/history blocks | one `renderContextBlocks()` helper |
| `join(config.sessions_path, 'active', 'plan.md')` inline in daemon, also path-joins in SessionManager | `sessions.readPlan()` + existing `readActiveFile` |
| `setReaction`, `withTyping`, `downloadTelegramFile`, streamer inline in daemon | `telegram-helpers.mjs` |
| `parseOverride` alone vs dispatch in daemon | merged in `commands.mjs` |
| `TELEGRAM_MAX = 4000` (sanitizer) vs `STREAM_MAX = 3800` (daemon) | both from `config` |
| `@pm2/io` metric creation calls scattered | one `metrics.mjs` init |
| direct-file `log()` helper in daemon; other modules have none | `logger.mjs` shared |

## 7. LEARN memory (option 1 + 3 + freeform 4)

**1 — Bounded size.** On `appendMemory`, if total entries > `memory_rotate_threshold` (default 80), oldest 50% move to `memory-archive.md`. Category grouping preserved. Archive file is disk-only; nothing reads it automatically.

**3 — Inject only recent.** `readMemory({ tail: 30 })` is called from `buildFirstPrompt` / `buildContinuationPrompt`. Prompt size for memory bounded at ~30 entries regardless of total file size.

**4 — Freeform tags.** BEK emits `LEARN: [tag] fact` (system prompt updated). `memory.md` groups by tag. No fixed taxonomy, no forced fit, no migration heuristic. Existing untagged entries stay in-place as `## Misc` on first read; naturally reorganize on rotation.

**Rationale for freeform over fixed taxonomy:** my first pass proposed `{schema, ux, constraints, process, misc}` and tried to auto-categorize the 54 existing entries by keyword. On inspection, entries like `"Contact masking was implemented at src/lib/pii/mask.ts"` don't fit those buckets. Rather than inventing a bigger taxonomy or writing a fragile heuristic, let the tag space emerge from usage.

## 8. Summarizer fix — diagnostic-first

**Gate:** do not prescribe a fix until root cause is known.

**Task 1 — diagnose (no code changes yet):**
- Add `log()` around `summarizeIfNeeded` — start, skip reason, spawn, completion, captured length.
- Manually invoke against current 808-line `conversation.md`.
- Identify one of: (a) never called from daemon path, (b) called but threshold test fails, (c) runClaude fails silently, (d) captured text is empty, (e) write succeeds but active dir layout bug prevents persistence.

**Task 2 — fix based on findings:**
- Root cause drives the patch. Do not pre-commit to a solution.
- Replace `process.stderr.write` error swallowing at `session-manager.mjs:136` with `logger.warn`.
- Add one regression test: given a 200-line synthetic conversation, `summarizeIfNeeded` produces non-empty `conversation-summary.md` and truncates `conversation.md` to `TAIL_SIZE` lines.

**Known non-fix behavior to document (not addressing in this refactor):**
The summarizer runs inline in `handleMessage` via `await`. Queue concurrency=1 means the next incoming message blocks for the duration of the summarize call (up to ~60s). Not a regression — exists today — and the fix (background worker, sidecar, or fire-and-forget with append-race protection) is a design choice outside this scope. Flag in `SOT.md`.

## 9. Tests

**Preserve:** `sanitizer.test.mjs`, `timeout-error.test.mjs`, `whisper.test.mjs`.
**Rename + expand:** `override-handler.test.mjs` → `commands.test.mjs` (add `handleOverride` dispatch coverage).
**Extend:** `session-manager.test.mjs` (summarizer regression test per §8).
**Add:**
- `config.test.mjs` — defaults applied correctly; group-lock write is atomic.
- `telegram-helpers.test.mjs` — `chunkText` boundaries; streamer gap logic (mockable via fake `bot.api`).
- `attachments.test.mjs` — image and pdf dispatch produce correct queue jobs.
- `memory.test.mjs` — append, tag parsing, rotation at threshold, tail read.
- `parseSignals.test.mjs` *(optional add)* — currently untested; cheap insurance while we're touching nearby code.

All tests run via existing `node --test test/*.test.mjs`.

## 10. Delivery artifacts

- All source changes in `.claude/bek/`.
- `bek.config.template.json` updated for new config keys (`memory_inject_tail`, `memory_rotate_threshold`, `max_queue_depth`, `telegram_max`, `stream_max`, plus the already-read-but-missing `stream_gap_reset_ms`).
- `ecosystem.config.cjs` — remove `bek-watchdog` app entry.
- `.claude/bek/SOT.md` — rewrite for new file layout, signal protocol (unchanged), removed watchdog, new memory tagging, known summarizer blocking.
- `.claude/bek/TODO.md` — unchanged in this spec (out of scope).

## 11. Rollout order

Single feature branch. Tasks, in order:

1. Add `logger.mjs` + `config.mjs` + `metrics.mjs` (infra — nothing else depends on these yet).
2. Extract `telegram-helpers.mjs` (daemon imports helpers, inline code removed).
3. Merge `override-handler.mjs` into `commands.mjs`, dispatch included.
4. Build `memory.mjs`; wire `system-prompt.mjs` to use `readMemory({ tail })`; add LEARN tag paragraph.
5. `system-prompt.mjs` — extract `renderContextBlocks()`.
6. Build `attachments.mjs` + `voice.mjs`; rewrite `bot.on('message')` dispatch to use them (image + pdf via attachments, voice via voice).
7. Summarizer diagnostic task (§8 task 1). No fix yet.
8. Summarizer fix based on findings (§8 task 2) + regression test.
9. Delete `watchdog.mjs`, `healer-prompt.mjs`, `ecosystem.config.cjs` entry, `override-handler.mjs`.
10. Update `bek.config.template.json` for new keys.
11. Rewrite `.claude/bek/SOT.md`.
12. Run full test suite. Manual smoke: text, photo, pdf, voice, `/status`, `/plan`, long-message split, `/done`.

## 12. Verification before finalizing

Before implementation starts, verify via Context7:
- GramIO 0.9 API surface for the methods we move: `bot.api.sendMessage`, `bot.api.editMessageText`, `bot.api.setMessageReaction`, `bot.api.sendChatAction`, `bot.api.getFile`, `bot.downloadFile`, `bot.onError`, `bot.on('message')`, `ctx.text/photo/document/voice/caption/chat.id/id/from.username`, `ctx.send`. If any of these are not in the stable public API, adjust helper signatures accordingly.

## 13. Risks and rollback

| Risk | Mitigation |
|---|---|
| `parseSignals` change breaks Claude interpretation | Don't touch `claude-runner.mjs`. Keep `parseSignals` untouched. |
| Summarizer "fix" introduces new failure mode | Diagnostic-first. Regression test gates the fix. |
| Memory rotation moves entries users still rely on | `memory-archive.md` preserves them; nothing is lost. `memory.md.bak` not needed because no migration runs. |
| GramIO API drift invalidates helper signatures | Context7 verification step before extracting helpers (§12). |
| Signal handler inlining regresses onSignal paths | onSignal stays inline, no refactor there — the switch body is unchanged. |
| Watchdog removal loses a safety net | Watchdog cannot fire on current state machine; PM2 autorestart + daemon crash recovery remain. |

**Rollback:** single-commit revert restores the pre-refactor state. All deletions are reversible from git. `memory.md` and `conversation.md` runtime data is not schema-bound; old daemon can read new files (extra `## Schema` headers are just text).

## 14. Expected measurable outcome

- Source LOC: 1340 → ~1100 (not 900 — the honest math is −229 net).
- Source files: 9 → 14 `.mjs`, each single-concern, each under ~180 LOC.
- `bek-daemon.mjs`: 487 → ~140.
- Watchdog PM2 app deleted.
- Zero duplicated code paths per §6.
- `memory.md` bounded by rotation; prompt memory bounded by tail injection.
- Summarizer verified to run end-to-end (or, if it can't be made to run within this scope, explicit decision logged in `SOT.md` with root cause).

## 15. Out of scope (deferred)

- Summarizer-blocks-queue redesign (background worker, fire-and-forget).
- Existing `memory.md` re-tagging (it self-groups on next rotation; no migration).
- Pruning `TODO.md` of completed items.
- Any app-code changes outside `.claude/bek/`.
- GramIO → framework X swap.
- Persistent LEARN search/recall beyond prompt tail injection.
