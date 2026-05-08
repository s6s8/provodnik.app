# Plan 14 — BEK status pill + silent-drop guard

**Date**: 2026-04-26
**Status**: Draft, awaiting user review
**Owner**: orchestrator
**Audience**: cursor-agent (executor) or orchestrator-direct
**Related**:
- `_archive/bek-frozen-2026-05-08/src/telegram-helpers.ts` (existing `withTyping`, `makeStreamer`)
- `_archive/bek-frozen-2026-05-08/src/bek-daemon.ts` `handleMessage` (call site for Component 1 + 2)
- `_archive/bek-frozen-2026-05-08/src/claude-runner.ts` `parseSignals`, `dispatchStreamEvent` (call site for Component 2)
- `_archive/bek-frozen-2026-05-08/src/system-prompt.ts` `BEK_SYSTEM_PROMPT` + `HARD PRIVACY RULES` (constraint for Component 1, target for Component 3)
- 2026-04-26 incident at 18:40:31 — Claude ran 56s, emitted answer in plain text, never wrapped in `TELEGRAM` markers, signal parser silently dropped it. **Component 2 + 3 prevent this exact failure mode.**

---

## 1. Goal

Plan 14 ships three coupled improvements to BEK's user-facing reliability:

1. **Status pill** (Component 1) — placeholder Telegram message with spinning Braille frame + elapsed time, deleted when first `TELEGRAM` signal arrives. Solves "user has no idea if BEK is alive during 30s–2min Claude runs."
2. **Silent-drop fallback** (Component 2) — if `runClaude` exits successfully but emitted no `TELEGRAM` signals, treat the accumulated assistant text as the reply. Solves "Claude sometimes ignores the signal-format rule and the daemon drops the answer."
3. **System-prompt tightening** (Component 3) — make the `TELEGRAM_START` / `TELEGRAM_END` requirement harder to miss, including a final-line reminder. Reduces the rate at which Component 2's fallback has to fire.

Components 2 and 3 are belt-and-suspenders. Component 3 reduces failure rate; Component 2 ensures the failure has no user-visible cost when it still slips through.

## 2. Non-goals

- No changes to `provodnik.app/` code.
- No new Telegram persona text. The dry/sarcastic voice stays.
- Component 1 carries **zero data from Claude's stream** — no phase, no tool, no progress percent. See §3.1.
- Component 2 does NOT retry Claude. If Claude's text is itself broken, BEK ships what it has.
- Component 3 does NOT rewrite the whole system prompt. Surgical edits only — adding emphasis where the silent-drop happened.

---

## 3. Component 1 — status pill

### 3.1 Why pure spinner (privacy constraint)

BEK's `HARD PRIVACY RULES`:
> Never name any tool, framework, service, or platform you use internally. Never explain how you work, what runs underneath, or what process you follow.

Phase-aware indicators ("📖 Читаю файл", "🌐 Ищу в интернете") leak the *shape* of BEK's work even when sanitized. Adding a phase→Russian-label map creates a maintenance liability — every new Claude tool needs a new mapping entry, and an unmapped tool name leaks unfiltered. We refuse that liability by not consuming phase data at all. The pill renders pure local state: a frame index and elapsed time. Privacy review surface = zero by construction.

### 3.2 Architecture

```
User → Telegram → daemon.handleMessage
                      ↓
                  withTyping (existing — sendChatAction every 4.5s)
                      ↓
              ┌───────┴────────┐
              ↓                ↓
         pill.start()    runClaude(...)
              ↓                ↓
        sendMessage     [stream events fire]
              ↓                ↓
         setInterval      [first TELEGRAM signal]
        (every 3s)              ↓
        editMessageText    pill.finish() ───┐
              ↓                              │
        ⠋ Думаю... 12s                     deleteMessage
        ⠙ Думаю... 15s                       ↓
        ⠹ Думаю... 18s                  message gone
              ↓
         finish() called from:
            - first TELEGRAM (primary trigger)
            - silent-drop fallback (Component 2 also calls finish)
            - outer finally on error/timeout
```

### 3.3 Public API — `_archive/bek-frozen-2026-05-08/src/status-pill.ts`

```ts
export interface StatusPill {
  /** Send the placeholder message and start the tick interval. Idempotent. */
  start(): Promise<void>;
  /** Stop the interval and delete the message. Idempotent — safe from finally + error paths. */
  finish(): Promise<void>;
}

export interface CreateStatusPillOptions {
  /** Frame interval in ms. Default 3000 — Telegram-rate-limit-safe. */
  intervalMs?: number;
  /** Russian label between spinner and elapsed time. Default "Думаю...". */
  label?: string;
  /** Override frame set. Default Braille set (10 frames). */
  frames?: readonly string[];
}

export function createStatusPill(
  bot: GramioBotLike,
  chatId: number,
  opts?: CreateStatusPillOptions,
): StatusPill;
```

### 3.4 Render format

```
<frame> <label>   <elapsed>
```

Three spaces between label and elapsed for visual rhythm. Elapsed format:
- `< 60s` → `12s`
- `>= 60s` → `1m 23s` (zero-padded seconds: `1m 04s`)

```
⠋ Думаю...    7s
⠙ Думаю...   18s
⠸ Думаю... 1m 04s
⠴ Думаю... 2m 11s
```

### 3.5 Frame set + interval

```ts
const DEFAULT_FRAMES = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'] as const;
```

Standard Braille spinner from `ora` / `cli-spinners`. Visually quiet on small mobile screens, monospace-equal on Telegram, language-neutral.

3000ms interval = 20 edits/min. Telegram's per-chat rate limit is ~30 edits/min hard cap; this leaves 50% headroom for the streamer (which also edits messages once content arrives).

### 3.6 Behavior contract

**`start()`:**
1. If `startCalled` → return.
2. `startedAt = Date.now()`, `frame = 0`, `startCalled = true`.
3. `bot.api.sendMessage({ chat_id, text: render(), suppress: true })`.
4. If response has `message_id` → store. Else → no-op (network failure ⇒ pill becomes silent).
5. Start `setInterval(tick, intervalMs)`.

**`tick()` (internal):**
1. `frame++`.
2. If `messageId === null` → return.
3. `bot.api.editMessageText({ ..., suppress: true })`. Errors swallowed (rate limit, message-too-old).

**`finish()`:**
1. If `finishCalled` → return.
2. `finishCalled = true`.
3. `clearInterval(timer)`.
4. If `messageId !== null` → `bot.api.deleteMessage({ ..., suppress: true })`. Failure ignored.

### 3.7 Resource invariants

- Exactly one `setInterval` per pill, cleared exactly once.
- Exactly one `sendMessage` per pill (start).
- At most one `deleteMessage` per pill (finish, only if send succeeded).
- No retries, no queuing, no persistent state across pills.

---

## 4. Component 2 — silent-drop fallback

### 4.1 The bug it fixes (verbatim from incident log)

Stream `2026-04-26T18-40-31.680Z--5102411622-1111.log`:
```
[open] session=new msg="whats our next plan sequence number?"
[init] claude_session=ee3d54ba-13a0-40cb-8939-bded0571bb61
[text] Looking at the untracked files in git status — plans 10 through 13 exist on disk. Next is **Plan 14**.
[close] exit=0 duration_ms=56295
```

Claude exited 0 with the correct answer in plain text but never wrapped it in `TELEGRAM:` / `TELEGRAM_START`. Signal parser correctly returned 0 signals; daemon correctly sent nothing. User waited indefinitely.

### 4.2 Design

Track two pieces of state in `handleMessage`:
- `assistantTextBuffer` (already exists from Plan 12 verification gate) — accumulates every `[text]` block from Claude.
- `telegramSignalSeen` (new) — set true on first `TELEGRAM` signal in `onSignal`.

**After `retryTransient(() => runClaude(...))` resolves successfully**, before the success reaction:

```ts
if (!telegramSignalSeen && assistantTextBuffer.trim().length > 0) {
  await recordIncident({
    kind: 'silent_drop_recovered',
    sessionId: session?.claude_session_id ?? null,
    chatId: ctx.chat.id,
    messageId: ctx.id,
    phase: null,
    streamFile: streamHandle.path ?? null,
    note: `Claude emitted ${assistantTextBuffer.length} chars of text but no TELEGRAM signal; falling back to text buffer.`,
  }).catch(() => {});

  const fallback = sanitize(assistantTextBuffer.trim());
  if (fallback) {
    if (!pillFinished) { pillFinished = true; await pill.finish().catch(() => {}); }
    await streamPush(fallback);
    await sessions.appendConversation(`[BEK]: ${assistantTextBuffer.trim()}`);
  }
}
```

### 4.3 What does NOT trigger fallback

- `runClaude` threw → outer catch handles it (existing path); no fallback.
- `telegramSignalSeen` is true → at least one TELEGRAM block was sent normally; fallback is suppressed.
- `assistantTextBuffer` is empty/whitespace → nothing to recover.
- `runClaude` was a summarizer call (no `onSignal` wiring) — the summarizer path doesn't have access to `assistantTextBuffer` or `telegramSignalSeen`, so this fallback applies only to the main reply path, not to the internal summarizer.

### 4.4 New incident kind

Add to `IncidentKind`:
- `silent_drop_recovered`

Postmortem CLI (`bek-postmortem`) automatically renders new kinds.

### 4.5 Why fallback over retry

Retrying Claude with the same prompt is unlikely to fix the protocol violation (Claude already chose narrative mode for the response shape). It's also expensive — another full token spend. Shipping the buffer once is cheaper, gets the user an answer, and the operator sees the incident in `incidents.jsonl` to investigate later. If the buffer turns out to be reasoning noise the user shouldn't see, we'll see in `silent_drop_recovered` incidents and tighten the prompt further.

### 4.6 Sanitization on fallback

The text buffer goes through the existing `sanitize()` from `sanitizer.ts` — same as TELEGRAM signal text — before send. AI/tool/path names get stripped automatically. Linter does NOT run on fallback (the linter is observability, and a silent-drop is already an incident — no point re-flagging).

---

## 5. Component 3 — system prompt tightening

### 5.1 Surgical edits to `BEK_SYSTEM_PROMPT`

Three changes:

**5.1.a Promote CRITICAL RULES** — currently buried mid-prompt. Move the block to immediately after PERSONA / ANSWER LENGTH RULES so it's read while the model is still attending closely.

**5.1.b Add explicit silent-drop warning** — a new line in CRITICAL RULES:
```
- If your reply has no TELEGRAM_START/TELEGRAM_END block AND no TELEGRAM: line, the client sees nothing.
  Treat unwrapped text as wasted tokens. Always wrap before answering.
```

**5.1.c Final-line reminder** — append to the very end of `BEK_SYSTEM_PROMPT`:
```
REMINDER: Wrap your reply to the client in TELEGRAM_START / TELEGRAM_END (or use TELEGRAM: prefix
for one-line replies). Bare text is dropped. No exceptions.
```

LLM attention pattern: instructions at the very end of the prompt (closest to the new user message) get higher weight. This reminder costs ~3 lines and is the cheapest leverage we have to reduce silent-drops at the source.

### 5.2 Why three changes (not one)

- Promotion (5.1.a) helps via positional emphasis.
- New rule (5.1.b) is more visceral than the existing wording.
- Final-line reminder (5.1.c) targets recency bias.

Independent mechanisms; combined effect > sum of parts. Component 2 is the safety net that catches whatever still leaks through.

### 5.3 No new persona, no new privacy rules

The voice stays dry/sarcastic. No new restrictions on Claude beyond what's already there.

---

## 6. Integration plan — `_archive/bek-frozen-2026-05-08/src/bek-daemon.ts handleMessage`

State variables added inside `handleMessage`:
```ts
const pill = createStatusPill(bot, ctx.chat.id);
let pillFinished = false;
let telegramSignalSeen = false;
let assistantTextBuffer = '';   // already exists from Plan 12 verification gate
```

**Step A** — pill.start before runClaude (replace `withTyping` body):
```ts
await withTyping(bot, ctx.chat.id, async () => {
  // ... existing streamHandle open ...
  await pill.start();
  // ... existing retryTransient(() => runClaude({ ... })) ...
});
```

**Step B** — onSignal TELEGRAM handler:
```ts
onSignal: async (signal) => {
  if (signal.type === 'TELEGRAM') {
    telegramSignalSeen = true;
    if (!pillFinished) { pillFinished = true; await pill.finish().catch(() => {}); }
    // ... existing sanitize + lint + streamPush + appendConversation ...
  }
  // ... STATE / LEARN / ARCHIVE_SESSION branches unchanged ...
},
onText: async (t) => {
  assistantTextBuffer += t;   // already in place from Plan 12
},
```

**Step C** — silent-drop check, after retryTransient resolves:
```ts
metrics.latency.update(Date.now() - claudeStartedAt);

// Silent-drop fallback (Component 2)
if (!telegramSignalSeen && assistantTextBuffer.trim().length > 0) {
  await recordIncident({ kind: 'silent_drop_recovered', /* ... */ }).catch(() => {});
  const fallback = sanitize(assistantTextBuffer.trim());
  if (fallback) {
    if (!pillFinished) { pillFinished = true; await pill.finish().catch(() => {}); }
    await streamPush(fallback);
    await sessions.appendConversation(`[BEK]: ${assistantTextBuffer.trim()}`);
  }
}

// ... existing ledger update, success reaction ...
```

**Step D** — outer finally guard for pill cleanup on error paths:
```ts
} finally {
  if (!pillFinished) { pillFinished = true; await pill.finish().catch(() => {}); }
  await closeStream(streamHandle, /* ... */);
  if (inputFile) unlink(inputFile).catch(() => {});
}
```

Net daemon edits: ~15 LOC across `handleMessage` (pill plumbing + silent-drop check). No changes to `claude-runner.ts`, `incidents.ts` body (only `IncidentKind`), or `sanitizer.ts`.

---

## 7. Edge cases

| Case | Behavior | Reasoning |
|------|----------|-----------|
| `sendMessage` for pill fails | pill silent no-op | acceptable degradation; user sees only typing pill |
| `editMessageText` rate-limited | tick swallows, retries next interval | `suppress: true` is quiet |
| `deleteMessage` fails | leftover pill in chat | rare; cosmetic; ignore |
| Claude responds in <100ms | start + finish in quick succession | works; pill briefly visible |
| Daemon killed mid-run | setInterval dies; pill frozen at last frame | useful operator clue |
| TELEGRAM fires multiple times | `pillFinished` flag prevents double-delete | idempotent |
| `runClaude` throws | outer finally hits guard | guaranteed cleanup |
| Silent-drop with empty text | fallback skips send, no incident | nothing to recover |
| Silent-drop with text > 4000 chars | sanitize + streamPush, streamer chunks | existing chunking handles it |
| Silent-drop where text is reasoning ("Looking at...") | sent verbatim to user; incident logged | trade-off — user gets *something*; operator sees incident and tightens prompt |
| Two TELEGRAM signals AND silent-drop heuristic | telegramSignalSeen prevents fallback | only one reply path fires |
| Concurrent messages (queue concurrency=1) | each gets its own pill; serialized | no conflict |

---

## 8. Decisions made

| # | Question | Decision | Why |
|---|----------|----------|-----|
| 1 | Pill: phase-aware or pure spinner? | Pure spinner | Privacy rule (§3.1); zero sanitization surface |
| 2 | Pill: delete or replace on finish? | Delete | Cleaner chat history |
| 3 | Pill: frame interval | 3000ms | Under Telegram's 30 edits/min cap with 50% headroom |
| 4 | Pill: frame set | Braille (10 frames, ora-style) | Monospace-equal, mobile-friendly |
| 5 | Pill: label | "Думаю..." | Matches dry persona |
| 6 | Silent-drop: fallback or retry? | Fallback | Cheaper, gets answer to user, incident drives prompt tightening |
| 7 | Silent-drop: sanitize on fallback? | Yes | Same hygiene as normal TELEGRAM path |
| 8 | Silent-drop: lint on fallback? | No | Already an incident; double-flag adds noise |
| 9 | Silent-drop: append to conversation.md? | Yes | History should reflect what user saw |
| 10 | Prompt tightening: rewrite or surgical? | Surgical (3 edits) | Avoid breaking existing rule wording; reuse known-good text |
| 11 | Prompt tightening: include privacy reminder too? | No | Out of scope; Plan 12 already added CONCEPT LEDGER + verification gate |
| 12 | Tests | Manual smoke + 2 unit tests for silent-drop fallback heuristic | Pill is thin API wrapper; fallback heuristic is logic-bearing |
| 13 | Plan number | 14 | Counted plans in `_archive/bek-frozen-2026-05-08/prompts/out/`: 5,6,7,8,10,11,12,13 → next is 14 |

---

## 9. Tests

### 9.1 Status pill
Manual smoke only:
- Send a message, observe pill appears, frame advances, elapsed counter increments at ~3s, pill disappears before first content chunk.
- Force-kill daemon mid-run, observe frozen frame remains visible.

### 9.2 Silent-drop fallback heuristic (`bek-daemon-silent-drop.test.ts` — new file, but logic should be testable in isolation)
Extract the decision into a pure helper `shouldSilentDropFallback({ telegramSignalSeen, assistantTextBuffer })`:

```ts
export function shouldSilentDropFallback(args: {
  telegramSignalSeen: boolean;
  assistantTextBuffer: string;
}): boolean {
  return !args.telegramSignalSeen && args.assistantTextBuffer.trim().length > 0;
}
```

Tests:
1. **`returns false when TELEGRAM signal was seen`** — text buffer non-empty + signal seen → false.
2. **`returns false when text buffer is empty`** — no signal seen + empty buffer → false.
3. **`returns false when text buffer is whitespace only`** — `"\n\n   "` → false.
4. **`returns true when no signal and non-empty text`** — exact incident scenario reproduction → true.

Place `shouldSilentDropFallback` in a small helper module so it's importable both by `bek-daemon.ts` and by the test.

### 9.3 System prompt diff verification

After Component 3 changes:
- Grep for `TELEGRAM_START` mentions in `BEK_SYSTEM_PROMPT` → expect ≥3 (was 2).
- Verify the final 5 lines of the prompt contain "REMINDER" and "Wrap your reply".

---

## 10. Files touched

| File | Change | LOC |
|------|--------|-----|
| `_archive/bek-frozen-2026-05-08/src/status-pill.ts` | NEW | ~80 |
| `_archive/bek-frozen-2026-05-08/src/silent-drop.ts` | NEW (helper module for `shouldSilentDropFallback`) | ~10 |
| `_archive/bek-frozen-2026-05-08/src/bek-daemon.ts` | wire pill + fallback into handleMessage | +15 |
| `_archive/bek-frozen-2026-05-08/src/system-prompt.ts` | promote CRITICAL RULES + add silent-drop rule + final REMINDER | +6 |
| `_archive/bek-frozen-2026-05-08/src/types/incident.ts` | add `silent_drop_recovered` to `IncidentKind` | +1 |
| `_archive/bek-frozen-2026-05-08/src/test/silent-drop.test.ts` | NEW | ~40 |

Total: ~150 LOC. Single coherent feature. Manual smoke + 4 unit tests.

---

## 11. Effort

~75 min:
- Status pill module + types: 25 min
- Silent-drop helper + integration: 15 min
- System prompt tightening: 5 min
- IncidentKind extension: 2 min
- Tests + typecheck: 15 min
- Daemon wire-up + cleanup: 10 min
- Manual smoke test (live BEK): 5 min

---

## 12. Spec self-review

- [x] Placeholders: none
- [x] Internal consistency: §3 / §4 / §5 components all integrate via §6
- [x] Scope: 3 components, ~150 LOC, ships as one plan
- [x] Ambiguity: every state transition (pill start/tick/finish, fallback decision, prompt placement) has defined behavior
- [x] Privacy rule explicitly cited as the design constraint for Component 1
- [x] Component 2's existence is justified by a real, named incident (4.1)
- [x] Component 3 is bounded — no rewrite, no scope creep
- [x] Tests cover the logic-bearing decisions (silent-drop heuristic), not just the I/O (pill + prompt)

## 13. Approval gate

User reviews this spec. On approval → orchestrator implements directly (~150 LOC, no cursor-agent dispatch needed; same shape as Plan 13).

Effort: ~75 min including verification + restart + manual smoke + Telegram report.
