# BEK Upgrade Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade QuantumBEK daemon with five independent improvements: faster-whisper binary swap, p-queue replacing hand-rolled MessageQueue, pm2-io-apm internal metrics, native conversation summarizer, and GramIO replacing Telegraf.

**Architecture:** Five sequential tasks, each isolated to specific files. Tasks 1–4 are additive changes to an otherwise-stable daemon. Task 5 (GramIO) replaces the entire bot framework layer and is done last so the daemon is fully stable before the largest surface change.

**Tech Stack:** Node.js 20+ (ESM), `node --test` test runner, PM2 process manager. New deps: `p-queue`, `@pm2/io`, `gramio`. Binary: `whisper-ctranslate2` (Python, installed separately).

**Working directory for all commands:** `D:/dev2/projects/provodnik/.claude/bek`

**Restart command (run after every task to validate live):** `pm2 restart quantumbek`

**Test command:** `node --test test/*.test.mjs`

---

## File Map

| File | Tasks |
|---|---|
| `bek.config.json` | T1 (whisper_bin value) |
| `package.json` | T2 (add p-queue), T3 (add @pm2/io), T5 (remove telegraf, add gramio) |
| `bek-daemon.mjs` | T2 (remove MessageQueue), T3 (add metrics), T4 (call summarizer), T5 (GramIO migration) |
| `claude-runner.mjs` | T4 (add onText callback) |
| `session-manager.mjs` | T4 (add summarizeIfNeeded, readConversationForContext) |
| `system-prompt.mjs` | T4 (update buildFirstPrompt signature) |
| `test/session-manager.test.mjs` | T4 (add summarizer tests) |

---

## Task 1: faster-whisper binary swap

**Files:**
- Modify: `bek.config.json`

This is a Python binary install + one config field change. No code changes.

- [ ] **Step 1: Install whisper-ctranslate2**

```bash
pip install whisper-ctranslate2
```

Verify the binary was created:
```bash
where whisper-ctranslate2
```
Expected: `C:\Users\x\AppData\Local\Programs\Python\Python311\Scripts\whisper-ctranslate2.exe`

- [ ] **Step 2: Update whisper_bin in config**

In `bek.config.json`, change the `whisper_bin` field:

```json
{
  "whisper_bin": "C:\\Users\\x\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\whisper-ctranslate2.exe"
}
```

All other fields stay unchanged. The new binary accepts identical CLI arguments to the original `whisper` CLI (`--model`, `--language`, `--output_format`, `--output_dir`, `--fp16`) and produces the same `.txt` output file.

- [ ] **Step 3: Note on first-run model download**

On the first transcription call, `whisper-ctranslate2` auto-downloads the CTranslate2-converted `large-v3-turbo` model weights. This takes 1–3 minutes and only happens once. No config change needed.

- [ ] **Step 4: Restart daemon and verify**

```bash
pm2 restart quantumbek
pm2 logs quantumbek --lines 5
```

Expected: `[bek] QuantumBEK online. Polling Telegram.` — no errors.

Send a voice message to the BEK Telegram group to trigger transcription. Check log:
```bash
pm2 logs quantumbek --lines 20
```
Expected: `[bek] voice transcribed (Xs) @username: "..."` — no whisper error lines.

- [ ] **Step 5: Commit**

```bash
git add bek.config.json
git commit -m "chore(bek): switch whisper binary to whisper-ctranslate2 (4x faster)"
```

---

## Task 2: p-queue — replace MessageQueue

**Files:**
- Modify: `bek-daemon.mjs`
- Modify: `package.json`

Replaces the 50-line hand-rolled `MessageQueue` class and the separate `paused` boolean with `p-queue`. Concurrency stays at 1 (serial processing). The `paused` variable is deleted — queue pause state is owned by PQueue internally.

- [ ] **Step 1: Install p-queue**

```bash
npm install p-queue
```

Verify it's in `package.json` dependencies.

- [ ] **Step 2: Replace the import and queue construction**

At the top of `bek-daemon.mjs`, add the import alongside existing imports:

```js
import PQueue from 'p-queue';
```

Delete this entire block (lines ~51–88, the `MessageQueue` class and instantiation):

```js
// DELETE: class MessageQueue { ... } (entire class)
// DELETE: const queue = new MessageQueue();
```

Replace with:

```js
const MAX_QUEUE_DEPTH = 4;
const queue = new PQueue({ concurrency: 1 });
```

- [ ] **Step 3: Delete the paused variable and all references**

Delete this line near the top of the file (in the `// ── State ──` section):

```js
// DELETE:
let paused = false;
```

Find and delete every reference to `paused`:
- `if (paused) { await ctx.reply(sanitize('На паузе. Подожди.')); return; }` — in text handler
- `if (paused) { await ctx.reply(sanitize('На паузе. Подожди.')); return; }` — in photo handler
- `if (paused) { await ctx.reply(sanitize('На паузе. Подожди.')); return; }` — in voice handler
- `if (paused) return;` — inside `onSignal` TELEGRAM handler

Replace all four `paused` guards with a p-queue-aware check. For the handler guards (text/photo/voice), p-queue's `pause()` stops the drain — incoming messages are still enqueued, they just won't execute. So the guard in handlers becomes: if the queue is paused, reply and return:

```js
// Replace: if (paused) { await ctx.reply(...); return; }
// With:
if (queue.isPaused) { await ctx.reply(sanitize('На паузе. Подожди.')); return; }
```

Delete the `if (paused) return;` guard inside `onSignal`'s TELEGRAM block entirely — it is no longer needed (paused queue means the job never ran, so onSignal never fires).

- [ ] **Step 4: Update all queue callsites**

**Depth check** — find every `queue.full` check and replace:

```js
// Before:
if (queue.full) { await ctx.reply(sanitize('Слишком много сообщений. Подожди.')); return; }

// After:
if (queue.size + queue.pending >= MAX_QUEUE_DEPTH) { await ctx.reply(sanitize('Слишком много сообщений. Подожди.')); return; }
```

**Enqueue** — find every `queue.enqueue(fn)` call and replace:

```js
// Before:
queue.enqueue(() => handleMessage(ctx, text));

// After:
queue.add(() => handleMessage(ctx, text));
```

Do the same for all other `queue.enqueue(...)` calls (photo, voice, document handlers).

**handleOverride — pause/abort/resume:**

```js
// Before:
} else if (command === 'pause') {
  paused = true;
  await ctx.reply(sanitize('Пауза.'));
} else if (command === 'abort') {
  paused = false;
  queue.clear();
  ...

// After:
} else if (command === 'pause') {
  queue.pause();
  await ctx.reply(sanitize('Пауза.'));
} else if (command === 'abort') {
  queue.clear();
  queue.start();
  ...
```

- [ ] **Step 5: Run tests**

```bash
node --test test/*.test.mjs
```

Expected: all existing tests pass. (Tests don't cover the queue directly — they cover SessionManager and sanitizer. No new tests needed for this task since it's a library substitution with identical behaviour.)

- [ ] **Step 6: Restart and smoke-test**

```bash
pm2 restart quantumbek
pm2 logs quantumbek --lines 10
```

Expected: `[bek] QuantumBEK online. Polling Telegram.`

Send two messages in quick succession to the Telegram group. Both should be processed serially (second one waits for first to complete). Check logs show two separate `[bek] running Claude` entries.

- [ ] **Step 7: Commit**

```bash
git add bek-daemon.mjs package.json package-lock.json
git commit -m "refactor(bek): replace hand-rolled MessageQueue with p-queue"
```

---

## Task 3: pm2-io-apm — internal metrics

**Files:**
- Modify: `bek-daemon.mjs`
- Modify: `package.json`

Adds five observable metrics visible in `pm2 monit`. All changes are additive — no existing logic is altered.

- [ ] **Step 1: Install @pm2/io**

```bash
npm install @pm2/io
```

- [ ] **Step 2: Add metric declarations at the top of bek-daemon.mjs**

After the existing imports (before the config section), add:

```js
import io from '@pm2/io';

const metricQueueDepth   = io.metric({ name: 'Queue depth',    id: 'bek/queue/depth' });
const metricSessionState = io.metric({ name: 'Session state',  id: 'bek/session/state' });
const counterErrors      = io.counter({ name: 'Claude errors', id: 'bek/claude/errors' });
const counterLearn       = io.counter({ name: 'LEARN signals', id: 'bek/memory/learns' });
const histLatency        = io.histogram({ name: 'Claude ms',   id: 'bek/claude/latency', measurement: 'mean' });
```

- [ ] **Step 3: Wire queue depth metric**

In every handler that calls `queue.add(...)` (text, photo, voice, document), add a metric update immediately after:

```js
queue.add(() => handleMessage(ctx, text));
metricQueueDepth.set(queue.size + queue.pending);
```

Do this for all four handler enqueue callsites.

- [ ] **Step 4: Wire latency and error metrics in handleMessage**

Inside `handleMessage()`, wrap the `runClaude` call:

```js
// Before:
await runClaude({ ... });

// After:
const _t0 = Date.now();
try {
  await runClaude({ ... });
  histLatency.update(Date.now() - _t0);
} catch (err) {
  histLatency.update(Date.now() - _t0);
  counterErrors.inc();
  throw err;  // re-throw so the existing catch block handles it
}
```

Note: the existing outer `try/catch` in `handleMessage` handles user-facing error replies. The `throw err` above re-throws into it. Do not duplicate the error-reply logic.

- [ ] **Step 5: Wire STATE and LEARN metrics in onSignal**

Inside the `onSignal` callback within `handleMessage`, add to the existing signal handlers:

```js
if (signal.type === 'STATE') {
  await sessions.updateSession({ state: signal.value });
  metricSessionState.set(signal.value);  // ← add this line
}
if (signal.type === 'LEARN') {
  await sessions.appendMemory(signal.entry);
  await log(`[bek] learned: ${signal.entry.slice(0, 80)}`);
  counterLearn.inc();  // ← add this line
}
```

- [ ] **Step 6: Restart and verify metrics appear**

```bash
pm2 restart quantumbek
pm2 monit
```

In the `pm2 monit` UI, select the `quantumbek` process. The right panel should show:
- Queue depth: 0
- Session state: (empty until a session starts)
- Claude errors: 0
- LEARN signals: 0
- Claude ms: 0

Send a message to trigger a Claude call. After it resolves, Claude ms should show a non-zero mean.

- [ ] **Step 7: Commit**

```bash
git add bek-daemon.mjs package.json package-lock.json
git commit -m "feat(bek): add pm2-io-apm metrics — queue depth, latency, errors, learns, session state"
```

---

## Task 4: native conversation summarizer

**Files:**
- Modify: `claude-runner.mjs` (add `onText` callback)
- Modify: `session-manager.mjs` (add `summarizeIfNeeded`, `readConversationForContext`)
- Modify: `system-prompt.mjs` (update `buildFirstPrompt`)
- Modify: `bek-daemon.mjs` (call summarizer after appendConversation)
- Modify: `test/session-manager.test.mjs` (add summarizer tests)

### Sub-task 4a: add `onText` to claude-runner.mjs

The summarizer needs to capture Claude's raw text output (not signals). Add an optional `onText` callback to `runClaude`.

- [ ] **Step 1: Update runClaude signature and wiring**

In `claude-runner.mjs`, update the function signature and the text-block handler:

```js
// Signature: add onText to destructured params
export function runClaude({ claudeBin, workspacePath, sessionId, message, onSignal, onSessionId, timeoutMs, env, onText }) {
```

In the stdout data handler, after the existing signal loop, add the raw text callback:

```js
// Existing code:
if (parsed.type === 'assistant' && Array.isArray(parsed.message?.content)) {
  for (const block of parsed.message.content) {
    if (block.type === 'text' && block.text) {
      for (const signal of parseSignals(block.text)) {
        Promise.resolve(onSignal(signal)).catch((err) => {
          process.stderr.write(`[claude-runner] onSignal error: ${err.message}\n`);
        });
      }
      // ← ADD: fire onText with raw block text
      if (onText) {
        Promise.resolve(onText(block.text)).catch((err) => {
          process.stderr.write(`[claude-runner] onText error: ${err.message}\n`);
        });
      }
    }
  }
}
```

No other changes to `claude-runner.mjs`.

### Sub-task 4b: add summarizer to session-manager.mjs

- [ ] **Step 2: Write the failing tests first**

Add to `test/session-manager.test.mjs`, inside the existing `describe('SessionManager', () => {` block, after the existing tests:

```js
describe('summarizeIfNeeded', () => {
  let smSumm;
  let tmpSumm;

  before(async () => {
    tmpSumm = await mkdtemp(join(tmpdir(), 'bek-summ-'));
    smSumm = new SessionManager(tmpSumm);
    // Write 130 lines to conversation.md (above the 120-line threshold)
    const lines = Array.from({ length: 130 }, (_, i) => `line ${i + 1}`).join('\n');
    await smSumm.appendConversation(lines);
  });

  after(async () => {
    await rm(tmpSumm, { recursive: true, force: true });
  });

  it('does not summarize when under threshold', async () => {
    const smSmall = new SessionManager(tmpSumm + '-small');
    await mkdtemp(join(tmpdir(), 'bek-small-'));
    // Write only 10 lines
    const dir = await mkdtemp(join(tmpdir(), 'bek-small-'));
    const smS = new SessionManager(dir);
    await smS.appendConversation('a\nb\nc');
    let called = false;
    await smS.summarizeIfNeeded(async (_text) => { called = true; return 'summary'; });
    assert.equal(called, false);
    await rm(dir, { recursive: true, force: true });
  });

  it('calls summarizeFn with the older lines when over threshold', async () => {
    let receivedText = '';
    await smSumm.summarizeIfNeeded(async (text) => {
      receivedText = text;
      return 'SUMMARY_OUTPUT';
    });
    // Older lines should not contain the last 40 lines
    assert.ok(receivedText.includes('line 1'));
    assert.ok(!receivedText.includes('line 130'));
  });

  it('writes SUMMARY_OUTPUT to conversation-summary.md', async () => {
    const { readFile } = await import('node:fs/promises');
    const summaryFile = join(tmpSumm, 'active', 'conversation-summary.md');
    const content = await readFile(summaryFile, 'utf8');
    assert.ok(content.includes('SUMMARY_OUTPUT'));
  });

  it('truncates conversation.md to last 40 lines', async () => {
    const conv = await smSumm.readConversation();
    const lines = conv.split('\n').filter(l => l.trim());
    assert.ok(lines.length <= 40);
    // Last line of original should be present
    assert.ok(conv.includes('line 130'));
  });

  it('readConversationForContext returns summary and tail', async () => {
    const { summary, tail } = await smSumm.readConversationForContext();
    assert.ok(summary.includes('SUMMARY_OUTPUT'));
    assert.ok(tail.includes('line 130'));
  });
});
```

- [ ] **Step 3: Run tests — expect failure**

```bash
node --test test/session-manager.test.mjs
```

Expected: tests fail with `TypeError: smSumm.summarizeIfNeeded is not a function`.

- [ ] **Step 4: Implement summarizeIfNeeded and readConversationForContext in session-manager.mjs**

Add these constants near the top of `session-manager.mjs` (after imports):

```js
const SUMMARIZE_THRESHOLD = 120; // lines
const TAIL_SIZE = 40;            // lines to keep verbatim
```

Add these two methods to the `SessionManager` class:

```js
/**
 * If conversation.md exceeds SUMMARIZE_THRESHOLD lines, compress older content.
 * @param {(olderText: string) => Promise<string>} summarizeFn
 */
async summarizeIfNeeded(summarizeFn) {
  const full = await this.readConversation();
  const lines = full.split('\n').filter(l => l.trim());
  if (lines.length < SUMMARIZE_THRESHOLD) return;

  const older = lines.slice(0, -TAIL_SIZE).join('\n');
  const tail  = lines.slice(-TAIL_SIZE).join('\n');

  let summaryText;
  try {
    summaryText = await summarizeFn(older);
  } catch (err) {
    // Never crash BEK because of summarization failure
    process.stderr.write(`[session-manager] summarizeIfNeeded failed: ${err.message}\n`);
    return;
  }

  const dateHeader = `\n\n[${new Date().toISOString().slice(0, 10)}]\n`;
  const existing = await this.readActiveFile('conversation-summary.md');
  await writeFile(
    join(this.activePath, 'conversation-summary.md'),
    existing + dateHeader + summaryText.trim()
  );
  await writeFile(join(this.activePath, 'conversation.md'), tail);
}

/**
 * Return { summary, tail } for use in buildFirstPrompt.
 * summary = contents of conversation-summary.md (may be empty string)
 * tail    = last 40 lines of conversation.md
 * @returns {Promise<{ summary: string, tail: string }>}
 */
async readConversationForContext() {
  const [summary, tail] = await Promise.all([
    this.readActiveFile('conversation-summary.md'),
    this.readRecentConversation(TAIL_SIZE),
  ]);
  return { summary, tail };
}
```

Also add `writeFile` to the existing `node:fs/promises` import at the top of `session-manager.mjs`:

```js
import { readFile, writeFile, mkdir, rm, cp, appendFile, unlink } from 'node:fs/promises';
```

(`writeFile` is already imported — verify it's present, add only if missing.)

- [ ] **Step 5: Run tests — expect pass**

```bash
node --test test/session-manager.test.mjs
```

Expected: all tests pass including the new summarizer tests.

### Sub-task 4c: update buildFirstPrompt in system-prompt.mjs

- [ ] **Step 6: Update buildFirstPrompt to accept { summary, tail }**

In `system-prompt.mjs`, change the `buildFirstPrompt` signature and body:

```js
// Before:
export function buildFirstPrompt(userMessage, conversationHistory = '', brief = '', memory = '') {
  // ...
  const history = conversationHistory.trim()
    ? `\n\n[CONVERSATION SO FAR]\n${conversationHistory.trim()}\n\n`
    : '\n\n';
  return `${BEK_SYSTEM_PROMPT}${memoryBlock}${briefBlock}${history}[NEW MESSAGE]\n${userMessage}`;
}
```

```js
// After — accepts either a string (backward compat) or { summary, tail } object:
export function buildFirstPrompt(userMessage, conversationHistory = '', brief = '', memory = '') {
  const memoryBlock = memory.trim()
    ? `\n\n[PERSISTENT MEMORY — facts you learned in previous plans]\n${memory.trim()}`
    : '';
  const briefBlock = brief.trim()
    ? `\n\n[BRIEF — read and act on this before anything else]\n${brief.trim()}`
    : '';

  let historyBlock;
  if (conversationHistory && typeof conversationHistory === 'object') {
    // New path: { summary, tail }
    const { summary, tail } = conversationHistory;
    const summaryPart = summary.trim()
      ? `[CONVERSATION SUMMARY — earlier sessions]\n${summary.trim()}\n\n`
      : '';
    const tailPart = tail.trim()
      ? `[RECENT CONVERSATION]\n${tail.trim()}\n\n`
      : '';
    historyBlock = summaryPart || tailPart
      ? `\n\n${summaryPart}${tailPart}`
      : '\n\n';
  } else {
    // Legacy path: plain string
    historyBlock = conversationHistory.trim()
      ? `\n\n[CONVERSATION SO FAR]\n${conversationHistory.trim()}\n\n`
      : '\n\n';
  }

  return `${BEK_SYSTEM_PROMPT}${memoryBlock}${briefBlock}${historyBlock}[NEW MESSAGE]\n${userMessage}`;
}
```

### Sub-task 4d: wire summarizer into bek-daemon.mjs

- [ ] **Step 7: Add the summarize callback and call site in handleMessage**

In `bek-daemon.mjs`, inside `handleMessage()`, after the `await sessions.appendConversation(...)` call, add the summarizer call:

```js
await sessions.appendConversation(`[${ctx.from?.username ?? 'user'}]: ${text}`);

// Summarize conversation.md if it has grown past threshold
await sessions.summarizeIfNeeded(async (olderText) => {
  let captured = '';
  await runClaude({
    claudeBin: config.claude_bin,
    workspacePath: config.workspace_path,
    sessionId: null,
    message: [
      'Summarize this conversation log into a compact block (max 400 words, plain English prose).',
      'Cover: product decisions made, current plan status, Alex\'s requirements and preferences,',
      'any rules or constraints established. No bullet lists. No technical jargon.',
      '',
      '[CONVERSATION]',
      olderText,
    ].join('\n'),
    timeoutMs: 60_000,
    env: process.env,
    onSessionId: () => {},
    onSignal: () => {},
    onText: (text) => { captured += text; },
  });
  return captured;
});
```

- [ ] **Step 8: Update isFirst branch to use readConversationForContext**

In `handleMessage()`, find the `if (isFirst)` branch:

```js
// Before:
if (isFirst) {
  const history = await sessions.readConversation();
  prompt = buildFirstPrompt(fullText, history, brief, memory);
  ...
}

// After:
if (isFirst) {
  const conversationCtx = await sessions.readConversationForContext();
  prompt = buildFirstPrompt(fullText, conversationCtx, brief, memory);
  ...
}
```

- [ ] **Step 9: Run all tests**

```bash
node --test test/*.test.mjs
```

Expected: all tests pass.

- [ ] **Step 10: Restart and verify**

```bash
pm2 restart quantumbek
pm2 logs quantumbek --lines 10
```

Expected: no errors. Send a message. Confirm normal operation. The summarizer will only fire after `conversation.md` exceeds 120 lines — no immediate visible effect.

- [ ] **Step 11: Commit**

```bash
git add claude-runner.mjs session-manager.mjs system-prompt.mjs bek-daemon.mjs test/session-manager.test.mjs
git commit -m "feat(bek): add native conversation summarizer — compresses conversation.md at 120-line threshold"
```

---

## Task 5: GramIO — replace Telegraf

**Files:**
- Modify: `bek-daemon.mjs` (full framework migration)
- Modify: `package.json`

This is the largest change. All existing logic (queue, summarizer, metrics, override commands, file download) stays identical. Only the Telegram framework API surface changes.

**Before starting:** verify gramio API at https://gramio.dev — confirm `ctx.send()`, `ctx.react()`, `bot.api.*` method names and parameter shapes. The plan below reflects current gramio.dev documentation but API details can shift in pre-1.0 packages.

- [ ] **Step 1: Swap packages**

```bash
npm install gramio
npm uninstall telegraf
```

Verify `package.json` shows `gramio` in dependencies and `telegraf` is gone.

- [ ] **Step 2: Replace imports at the top of bek-daemon.mjs**

```js
// DELETE:
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

// ADD:
import { Bot } from 'gramio';
```

- [ ] **Step 3: Replace bot construction**

```js
// DELETE:
const bot = new Telegraf(config.telegram_token);

// ADD:
const bot = new Bot(config.telegram_token);
```

- [ ] **Step 4: Add withTyping helper**

After the bot is constructed, add this helper function (replaces Telegraf's `ctx.persistentChatAction`):

```js
async function withTyping(chatId, fn) {
  await bot.api.sendChatAction({ chat_id: chatId, action: 'typing' }).catch(() => {});
  const interval = setInterval(() => {
    bot.api.sendChatAction({ chat_id: chatId, action: 'typing' }).catch(() => {});
  }, 4500);
  try {
    return await fn();
  } finally {
    clearInterval(interval);
  }
}
```

- [ ] **Step 5: Update makeStreamer to use bot.api**

In `makeStreamer()`, replace `bot.telegram.*` calls:

```js
// Before:
const sent = await bot.telegram.sendMessage(chatId, chunk);
// After:
const sent = await bot.api.sendMessage({ chat_id: chatId, text: chunk });

// Before:
await bot.telegram.editMessageText(chatId, msgId, undefined, accumulated);
// After:
await bot.api.editMessageText({ chat_id: chatId, message_id: msgId, text: accumulated });
```

The `msgId` extraction also changes — `bot.telegram.sendMessage` returned `{ message_id }` directly. Verify what `bot.api.sendMessage` returns. If it returns the full Message object, `sent.message_id` still works.

- [ ] **Step 6: Update handleMessage — replace ctx methods**

In `handleMessage()`:

```js
// Before:
ctx.react('👀').catch(() => {});
// After:
ctx.react([{ type: 'emoji', emoji: '👀' }]).catch(() => {});

// Before:
await ctx.persistentChatAction('typing', async () => { ... });
// After:
await withTyping(ctx.chat.id, async () => { ... });

// Before (success reaction):
ctx.react('✅').catch(() => {});
// After:
ctx.react([{ type: 'emoji', emoji: '✅' }]).catch(() => {});

// Before (error reaction):
ctx.react('❌').catch(() => {});
// After:
ctx.react([{ type: 'emoji', emoji: '❌' }]).catch(() => {});
```

- [ ] **Step 7: Update handleOverride — replace ctx.reply**

```js
// Before:
await ctx.reply(sanitize('Пауза.'));
// After:
await ctx.send(sanitize('Пауза.'));
```

Apply to every `ctx.reply(...)` call in `handleOverride`. There are approximately 8 — replace all.

For the `/plan` command that reads `plan.md` and sends directly to Telegram:

```js
// Before:
await ctx.reply(sanitize(plan.slice(0, 3800)));
// After:
await ctx.send(sanitize(plan.slice(0, 3800)));
```

- [ ] **Step 8: Replace the text handler**

```js
// DELETE:
bot.on(message('text'), async (ctx) => {
  ...
});

// ADD:
bot.on('message', async (ctx) => {
  if (!ctx.message?.text) return;
  if (!await isLockedGroup(ctx.chat.id)) return;

  const text = ctx.message.text;
  const username = ctx.from?.username ?? '';

  const override = parseOverride(text, username);
  if (override) {
    if (!override.authorized) {
      await ctx.send(randomUnauthorizedResponse());
      return;
    }
    await handleOverride(ctx, override.command);
    return;
  }

  if (queue.isPaused) { await ctx.send(sanitize('На паузе. Подожди.')); return; }
  if (queue.size + queue.pending >= MAX_QUEUE_DEPTH) { await ctx.send(sanitize('Слишком много сообщений. Подожди.')); return; }

  queue.add(() => handleMessage(ctx, text));
  metricQueueDepth.set(queue.size + queue.pending);
});
```

- [ ] **Step 9: Replace the photo handler**

```js
// DELETE:
bot.on(message('photo'), async (ctx) => { ... });

// ADD:
bot.on('message', async (ctx) => {
  if (!ctx.message?.photo) return;
  if (!await isLockedGroup(ctx.chat.id)) return;
  if (queue.isPaused) { await ctx.send(sanitize('На паузе. Подожди.')); return; }
  if (queue.size + queue.pending >= MAX_QUEUE_DEPTH) { await ctx.send(sanitize('Слишком много сообщений. Подожди.')); return; }

  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
  const caption = ctx.message.caption ?? '';
  const username = ctx.from?.username ?? 'user';

  queue.add(async () => {
    await sessions.appendConversation(`[${username}]: [изображение] ${caption}`);
    const photoPath = await downloadTelegramFile(fileId, 'photo');
    const text = caption
      ? `[${username} прислал изображение с подписью: ${caption}]`
      : `[${username} прислал изображение]`;
    await handleMessage(ctx, text, photoPath);
  });
  metricQueueDepth.set(queue.size + queue.pending);
});
```

- [ ] **Step 10: Replace the document handler**

```js
// DELETE:
bot.on(message('document'), async (ctx) => { ... });

// ADD:
bot.on('message', async (ctx) => {
  if (!ctx.message?.document) return;
  if (!await isLockedGroup(ctx.chat.id)) return;
  if (queue.isPaused) { await ctx.send(sanitize('На паузе. Подожди.')); return; }
  if (queue.size + queue.pending >= MAX_QUEUE_DEPTH) { await ctx.send(sanitize('Слишком много сообщений. Подожди.')); return; }

  const mime = ctx.message.document.mime_type ?? '';
  const fileId = ctx.message.document.file_id;
  const caption = ctx.message.caption ?? '';
  const username = ctx.from?.username ?? 'user';

  if (mime.startsWith('image/')) {
    queue.add(async () => {
      await sessions.appendConversation(`[${username}]: [изображение] ${caption}`);
      const photoPath = await downloadTelegramFile(fileId, 'photo');
      const text = caption
        ? `[${username} прислал изображение с подписью: ${caption}]`
        : `[${username} прислал изображение]`;
      await handleMessage(ctx, text, photoPath);
    });
    metricQueueDepth.set(queue.size + queue.pending);
  } else if (mime === 'application/pdf') {
    queue.add(async () => {
      await sessions.appendConversation(`[${username}]: [PDF] ${caption}`);
      const pdfPath = await downloadTelegramFile(fileId, 'pdf');
      const text = caption
        ? `[${username} прислал PDF с подписью: ${caption}]`
        : `[${username} прислал PDF]`;
      await handleMessage(ctx, text, pdfPath);
    });
    metricQueueDepth.set(queue.size + queue.pending);
  }
});
```

- [ ] **Step 11: Replace the voice handler**

```js
// DELETE:
bot.on(message('voice'), async (ctx) => { ... });

// ADD:
bot.on('message', async (ctx) => {
  if (!ctx.message?.voice) return;
  if (!await isLockedGroup(ctx.chat.id)) return;
  if (queue.isPaused) { await ctx.send(sanitize('На паузе. Подожди.')); return; }
  if (queue.size + queue.pending >= MAX_QUEUE_DEPTH) { await ctx.send(sanitize('Слишком много сообщений. Подожди.')); return; }

  const fileId = ctx.message.voice.file_id;
  const duration = ctx.message.voice.duration;
  const username = ctx.from?.username ?? 'user';

  queue.add(async () => {
    try {
      const fileInfo = await bot.api.getFile({ file_id: fileId });
      const fileUrl = `https://api.telegram.org/file/bot${config.telegram_token}/${fileInfo.file_path}`;
      const res = await fetch(fileUrl);
      const audioBuffer = Buffer.from(await res.arrayBuffer());

      const transcribed = await transcribeVoice(audioBuffer, {
        bin: config.whisper_bin ?? 'whisper',
        model: config.whisper_model ?? 'large-v3-turbo',
      });
      await log(`[bek] voice transcribed (${duration}s) @${username}: "${transcribed}"`);

      await sessions.appendConversation(`[${username}]: [голосовое] ${transcribed}`);
      await handleMessage(ctx, `[${username} отправил голосовое: ${transcribed}]`);
    } catch (err) {
      await log(`[bek] voice handler error: ${err.message}`);
      await ctx.send(sanitize('Голосовое не распознал. Попробуй ещё раз.'));
    }
  });
  metricQueueDepth.set(queue.size + queue.pending);
});
```

- [ ] **Step 12: Update downloadTelegramFile to use bot.api**

```js
// Before:
async function downloadTelegramFile(fileId, prefix) {
  const fileInfo = await bot.telegram.getFile(fileId);
  ...
}

// After:
async function downloadTelegramFile(fileId, prefix) {
  const fileInfo = await bot.api.getFile({ file_id: fileId });
  ...
  // rest of function is unchanged
}
```

- [ ] **Step 13: Update crash recovery to use bot.api**

In the startup crash recovery block at the bottom of `bek-daemon.mjs`:

```js
// Before:
await bot.telegram.sendMessage(config.group_id, msg)
  .catch((err) => log(`[bek] Crash recovery announcement failed: ${err.message}`));

// After:
await bot.api.sendMessage({ chat_id: config.group_id, text: msg })
  .catch((err) => log(`[bek] Crash recovery announcement failed: ${err.message}`));
```

- [ ] **Step 14: Replace bot.launch with bot.start**

```js
// DELETE:
await log('[bek] QuantumBEK online. Polling Telegram.');
bot.launch({ allowedUpdates: ['message'] }).catch(async (err) => {
  if (err?.response?.error_code === 409) {
    await log('[bek] 409 conflict — retrying in 55s...');
    bot.stop();
    setTimeout(() => process.exit(0), 55_000);
  } else {
    await log(`[bek] launch error: ${err?.message ?? err}`);
    process.exit(1);
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// ADD:
await log('[bek] QuantumBEK online. Polling Telegram.');
bot.start().catch(async (err) => {
  if (err?.response?.error_code === 409) {
    await log('[bek] 409 conflict — retrying in 55s...');
    setTimeout(() => process.exit(0), 55_000);
  } else {
    await log(`[bek] launch error: ${err?.message ?? err}`);
    process.exit(1);
  }
});

process.once('SIGINT',  () => bot.stop());
process.once('SIGTERM', () => bot.stop());
```

**Note:** GramIO may use a different error shape for 409. If the 409 check doesn't fire correctly, inspect the raw error with `console.error(JSON.stringify(err))` on first run and adjust the property path.

- [ ] **Step 15: Run tests**

```bash
node --test test/*.test.mjs
```

Expected: all tests pass. (Tests don't cover bot handlers — those are integration-tested live.)

- [ ] **Step 16: Restart and smoke-test**

```bash
pm2 restart quantumbek
pm2 logs quantumbek --lines 15
```

Expected: `[bek] QuantumBEK online. Polling Telegram.` — no import errors, no crash.

Send a text message to the Telegram group. Confirm:
- `👀` reaction appears
- Claude call fires (`[bek] running Claude`)
- BEK replies via Telegram
- `✅` or `❌` reaction appears on completion

Send a photo. Confirm it is downloaded and passed to Claude.

- [ ] **Step 17: Commit**

```bash
git add bek-daemon.mjs package.json package-lock.json
git commit -m "feat(bek): replace Telegraf with GramIO — full framework migration"
```

---

## Self-review checklist

- [x] **Spec coverage:** U1 (Task 2 ✓), U2 (Task 4 ✓), U3 (Task 1 ✓), U4 (Task 5 ✓), U5 (Task 3 ✓)
- [x] **Placeholder scan:** No TBD/TODO/similar. All steps have exact code.
- [x] **Type consistency:** `summarizeIfNeeded(summarizeFn)` defined in Task 4b and used in Task 4d. `readConversationForContext()` defined in Task 4b and used in Task 4d. `buildFirstPrompt(userMessage, conversationCtx, brief, memory)` updated in Task 4c and called in Task 4d with `conversationCtx` (object). `onText` added to `runClaude` in Task 4a and consumed in Task 4d. All consistent.
- [x] **GramIO API note:** Step 14 explicitly calls out that `error_code === 409` check may need verification against live GramIO error shape.
- [x] **Multiple message handlers:** GramIO supports multiple `bot.on('message', ...)` registrations — each fires for every message, with the `if (!ctx.message?.text) return` guard ensuring only the correct handler processes each message type. Verify this is GramIO's documented behaviour at gramio.dev before dispatch.
