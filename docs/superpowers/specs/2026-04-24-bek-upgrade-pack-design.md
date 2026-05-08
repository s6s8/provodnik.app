# BEK Upgrade Pack — Design Spec
_2026-04-24 | Status: approved, pending implementation_

## Scope

Five independent upgrades to the QuantumBEK daemon. No new features. Each upgrade is isolated to specific files and can be implemented and tested separately. No memory/mem0 work is in scope.

---

## U1 — p-queue: replace hand-rolled MessageQueue

### Problem
`bek-daemon.mjs` contains a 50-line custom `MessageQueue` class. It has a loose `paused` boolean that lives outside the queue, creating a race condition: a job can be dequeued and start executing while `paused=true` is set by an override command. The class has no external tests and is invisible to tooling.

### Decision
Replace with `p-queue` (npm). ESM, zero sub-dependencies, TypeScript types included, concurrency-first design. Use `concurrency: 1` to preserve serial processing.

### API mapping

| Current | After |
|---|---|
| `new MessageQueue()` | `new PQueue({ concurrency: 1 })` |
| `queue.enqueue(fn)` | `queue.add(fn)` |
| `queue.full` (`size >= MAX_QUEUE_DEPTH`) | `queue.size + queue.pending >= MAX_QUEUE_DEPTH` |
| `queue.clear()` | `queue.clear()` |
| `paused = true` / `paused = false` | `queue.pause()` / `queue.start()` |
| `paused` check in handlers | removed — p-queue handles internally |

### Files
- `bek-daemon.mjs` — delete `MessageQueue` class; add p-queue import; update all 4 callsites
- `package.json` — add `p-queue`

### Deleted
- The `paused` module-level boolean variable — entirely replaced by `queue.pause()`/`queue.start()`
- The `MessageQueue` class (lines 51–88 in current file)

---

## U2 — Native conversation summarizer

### Problem
`conversation.md` is append-only. It grows without bound — the Plan 03 session reached 735+ lines. On `isFirst=true`, `buildFirstPrompt` injects the entire file. At scale this hits Claude's context window and wastes tokens on stale content.

### Decision
Two-tier context: a rolling summary file + a verbatim tail. No LangChain or external framework. Use the existing `runClaude()` for summarization — BEK already knows how to call Claude without a session.

### Architecture

```
conversation-summary.md   compressed narrative of everything before the tail
conversation.md           last 40 lines verbatim (rolling window)
```

### Trigger
After every `appendConversation()` call, check `conversation.md` line count. If line count exceeds **120 lines**, run the summarizer immediately (inline, awaited, before the handler returns).

### Summarizer algorithm
1. Read full `conversation.md`
2. Split into: `older = all lines except last 40` and `tail = last 40 lines`
3. Invoke `runClaude()` with summarization prompt (no session ID, no `--resume`, one-shot `--print`)
4. On success: append Claude's output to `conversation-summary.md` with a date header; rewrite `conversation.md` with only the 40-line tail
5. On failure: log error, skip compression, leave `conversation.md` unchanged — never crash BEK

### Summarization prompt (embedded in session-manager.mjs)
```
Summarize this conversation log into a compact block (max 400 words, plain English prose).
Cover: product decisions made, current plan status, Alex's requirements and preferences,
any rules or constraints established. No bullet lists. No technical jargon.

[CONVERSATION]
{older lines}
```

### Context injection changes

**`buildFirstPrompt` (isFirst=true):**
- Before: inject full `conversation.md`
- After: inject `conversation-summary.md` (if exists) followed by last 40 lines of `conversation.md`

**`buildContinuationPrompt`:** unchanged — already uses `readRecentConversation(15)`, which reads the tail only.

### New SessionManager methods
- `summarizeIfNeeded(runClaudeFn, config)` — checks threshold, runs algorithm above
- `readConversationForContext()` — returns `{ summary: string, tail: string }` for prompt assembly

### Archive behaviour
Both `conversation.md` and `conversation-summary.md` are included when `archive()` copies the active directory. Full history preserved.

### Files
- `session-manager.mjs` — add `summarizeIfNeeded()`, `readConversationForContext()`
- `system-prompt.mjs` — update `buildFirstPrompt` to accept `{ summary, tail }` instead of raw `history` string
- `bek-daemon.mjs` — call `summarizeIfNeeded()` after each `appendConversation()`, pass `runClaude` + config

---

## U3 — faster-whisper: swap the Whisper binary

### Problem
The current Whisper binary (`whisper.exe`) processes audio in batch mode. Standard Whisper speed on `large-v3-turbo` is the baseline. No code path needs to change — only the binary being called.

### Decision
Install `whisper-ctranslate2` via pip. It is a drop-in CLI wrapper for faster-whisper that accepts **identical arguments** to the original `openai-whisper` CLI: same `--model`, `--language`, `--output_format`, `--output_dir`, `--fp16` flags, same `.txt` output file. Zero code changes required.

### Install
```bash
pip install whisper-ctranslate2
```

On first transcription call with `large-v3-turbo`, the tool auto-downloads CTranslate2-converted model weights. Subsequent calls: 4× faster, ~50% less VRAM.

### Configuration change
```json
// bek.config.json — change one field
{
  "whisper_bin": "C:\\Users\\x\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\whisper-ctranslate2.exe"
}
```

### Files
- `bek.config.json` — `whisper_bin` value only

---

## U4 — GramIO: replace Telegraf

### Problem
Telegraf v4's TypeScript types are broken by design (too complex after migration). Telegraf development has slowed. The `ctx.persistentChatAction` timeout hack and the 409-conflict workaround reveal framework friction. GramIO is the active successor: TypeScript-first, Node/Bun/Deno, modern plugin ecosystem.

### Decision
Full replacement. No Telegraf code remains after this upgrade. GramIO uses the same Telegram Bot API — the external behaviour is identical. The group lock, queue integration, override commands, file download, and signal handling are unchanged.

### Install
```bash
npm install gramio
npm uninstall telegraf
```

### API mapping

**Setup:**
```
new Telegraf(token)          →  new Bot(token)     from 'gramio'
bot.launch({ allowedUpdates })  →  await bot.start()
bot.stop('SIGINT')           →  bot.stop()
bot.catch(handler)           →  bot.on('error', handler)  or try/catch in handlers
```

**Message handlers** — GramIO uses a single `'message'` event filtered inline:
```
bot.on(message('text'),  ctx => ...)  →  bot.on('message', ctx => { if (!ctx.message.text) return; ... })
bot.on(message('photo'), ctx => ...)  →  bot.on('message', ctx => { if (!ctx.message.photo) return; ... })
bot.on(message('voice'), ctx => ...)  →  bot.on('message', ctx => { if (!ctx.message.voice) return; ... })
bot.on(message('document'), ...)      →  bot.on('message', ctx => { if (!ctx.message.document) return; ... })
```

**Context methods:**
```
ctx.reply(text)              →  ctx.send(text)
ctx.react('👀')              →  ctx.react([{ type: 'emoji', emoji: '👀' }])
ctx.from?.username           →  ctx.from?.username           (unchanged)
ctx.chat.id                  →  ctx.chat.id                  (unchanged)
ctx.message.text             →  ctx.message.text             (unchanged)
ctx.message.caption          →  ctx.message.caption          (unchanged)
ctx.message.photo            →  ctx.message.photo            (unchanged)
ctx.message.voice            →  ctx.message.voice            (unchanged)
ctx.message.document         →  ctx.message.document         (unchanged)
```

**Direct bot API calls** (used in makeStreamer and crash recovery):
```
bot.telegram.sendMessage(chatId, text)
  →  bot.api.sendMessage({ chat_id: chatId, text })

bot.telegram.editMessageText(chatId, msgId, undefined, text)
  →  bot.api.editMessageText({ chat_id: chatId, message_id: msgId, text })

bot.telegram.getFile(fileId)
  →  bot.api.getFile({ file_id: fileId })

ctx.telegram.getFileLink(fileId)
  →  bot.api.getFile({ file_id: fileId })
     then: `https://api.telegram.org/file/bot${token}/${file.file_path}`
```

**`ctx.persistentChatAction`** — Telegraf-specific, does not exist in GramIO. Replace with a standalone helper function:

```
async function withTyping(chatId, fn):
  send 'typing' action once immediately
  setInterval → resend 'typing' every 4500ms (under Telegram's 5s TTL)
  await fn()
  clearInterval on exit (finally block)
```

Usage: `await withTyping(ctx.chat.id, async () => { await runClaude(...) })`

**409 conflict handling** — Telegraf caught this in the launch callback. GramIO's `bot.start()` throws on 409. Wrap `bot.start()` in try/catch, detect `error_code === 409`, log, then `setTimeout(() => process.exit(0), 55_000)` — identical retry behaviour.

**SIGINT/SIGTERM:**
```
process.once('SIGINT',  () => bot.stop())
process.once('SIGTERM', () => bot.stop())
```

### Files
- `bek-daemon.mjs` — full Telegraf→GramIO migration (~60 lines changed, no logic changes)
- `package.json` — remove `telegraf`, add `gramio`

---

## U5 — pm2-io-apm: internal metrics

### Problem
BEK health is monitored externally (watchdog reads log files). There is no visibility into queue depth, Claude latency, error rate, or session state from inside the process. Debugging relies on `tail -f bek-daemon.log`.

### Decision
Add `@pm2/io` metrics. Five counters/gauges wired into existing execution points. Visible in `pm2 monit` live dashboard. No external service or account required.

### Install
```bash
npm install @pm2/io
```

### Metrics

| Metric | Type | ID | Updated when |
|---|---|---|---|
| Queue depth | gauge | `bek/queue/depth` | After each `queue.add()` |
| Session state | gauge (string) | `bek/session/state` | On each `STATE:` signal |
| Claude latency | histogram (mean ms) | `bek/claude/latency` | After each `runClaude()` resolves |
| Claude errors | counter | `bek/claude/errors` | In the `catch` block of `runClaude()` |
| LEARN signals | counter | `bek/memory/learns` | On each `LEARN:` signal in `onSignal` |

### Wiring points in `bek-daemon.mjs`
- Top of file: import `io` from `@pm2/io`, declare all 5 metric objects
- `queue.add(fn)` callsite: set queue depth metric after adding
- `handleMessage()` before `runClaude()`: record `t0 = Date.now()`
- `handleMessage()` after `runClaude()` resolves: `histLatency.update(Date.now() - t0)`
- `handleMessage()` catch block: `counterErrors.inc()`
- `onSignal` handler, `type === 'STATE'`: `metricSessionState.set(signal.value)`
- `onSignal` handler, `type === 'LEARN'`: `counterLearn.inc()`

### Files
- `bek-daemon.mjs` — ~25 lines added
- `package.json` — add `@pm2/io`

---

## Full file change matrix

| File | U1 p-queue | U2 summarizer | U3 whisper | U4 GramIO | U5 apm |
|---|:---:|:---:|:---:|:---:|:---:|
| `bek-daemon.mjs` | ✓ | ✓ | — | ✓ | ✓ |
| `session-manager.mjs` | — | ✓ | — | — | — |
| `system-prompt.mjs` | — | ✓ | — | — | — |
| `bek.config.json` | — | — | ✓ | — | — |
| `package.json` | ✓ | — | — | ✓ | ✓ |

---

## Implementation order

Order chosen by risk and dependency. U3 first (zero risk), U4 last (most surface area).

1. **U3** — faster-whisper config swap (5 min, zero risk)
2. **U1** — p-queue (1h, isolated to MessageQueue section of daemon)
3. **U5** — pm2-io-apm (2h, additive only, no existing logic changed)
4. **U2** — native summarizer (3h, touches 3 files but cleanly isolated)
5. **U4** — GramIO migration (4h, largest surface area, do last so other upgrades are stable first)

---

## Out of scope
- mem0 / semantic memory (deferred)
- @anthropic-ai/claude-agent-sdk (intentionally excluded — CLI approach kept for token cost)
- grammY (skipped — GramIO chosen instead)
- BullMQ / Redis-backed queue (p-queue in-process is sufficient)
- GramIO conversations plugin (state machine in session.json is adequate)
