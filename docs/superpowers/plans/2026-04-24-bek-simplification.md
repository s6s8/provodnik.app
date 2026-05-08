# BEK Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Note (project-local):** This project dispatches code changes via cursor-agent (`.claude/logs/cursor-dispatch.mjs`) per `.claude/CLAUDE.md`. Each task below can be wrapped in a cursor-agent prompt or executed inline; the steps themselves are executor-agnostic.

**Goal:** Simplify the BEK Telegram bot daemon (`.claude/bek/`) by deduplicating code, splitting `bek-daemon.mjs` into single-concern modules, deleting the defunct watchdog subsystem, bounding LEARN memory growth, and fixing the silently-failing conversation summarizer — without changing user-visible behavior.

**Architecture:** Extract concerns from the 487-LOC `bek-daemon.mjs` into per-concern modules (`logger`, `config`, `metrics`, `telegram-helpers`, `commands`, `attachments`, `voice`, `memory`). Delete `watchdog.mjs` + `healer-prompt.mjs` (dead code since the BEK role-redesign removed the `EXECUTING` state). Add memory tagging/rotation/tail injection. Diagnose and fix summarizer. No library swaps, no signal-protocol changes, no persona edits.

**Tech Stack:** Node.js (`.mjs`), `gramio` 0.9, `p-queue`, `@pm2/io`, built-in `node:test` + `node:assert`, Whisper CLI, Claude CLI subprocess.

**Spec:** `docs/superpowers/specs/2026-04-24-bek-simplification-design.md`

---

## File Structure Overview

**New files (in `.claude/bek/`):**
- `logger.mjs` — shared file logger, `log()` + `warn()`
- `config.mjs` — `loadConfig()` + `writeGroupLock()`
- `metrics.mjs` — `@pm2/io` wrapper
- `telegram-helpers.mjs` — `withTyping`, `setReaction`, `downloadTelegramFile`, `makeStreamer`, `chunkText`
- `commands.mjs` — `parseOverride`, `randomUnauthorizedResponse`, `handleOverride`
- `attachments.mjs` — `enqueueAttachment` for image + pdf
- `voice.mjs` — `enqueueVoice`
- `memory.mjs` — `readMemory`, `appendMemory`

**Modified:**
- `bek-daemon.mjs` (487 → ~120 LOC, wiring only)
- `system-prompt.mjs` (refactored — `renderContextBlocks()`, LEARN tag paragraph)
- `session-manager.mjs` (memory ops moved out; add `readPlan()`)
- `ecosystem.config.cjs` (remove `bek-watchdog` app)
- `bek.config.template.json` (new defaults)
- `SOT.md` (rewrite)

**Deleted:**
- `watchdog.mjs`
- `healer-prompt.mjs`
- `override-handler.mjs` (merged into `commands.mjs`)

**Unchanged:**
- `claude-runner.mjs` (do not touch — `parseSignals` carries signal protocol)
- `sanitizer.mjs`
- `whisper.mjs`

**Test files (new):**
- `test/config.test.mjs`
- `test/telegram-helpers.test.mjs`
- `test/commands.test.mjs` (rename of `override-handler.test.mjs`, extended)
- `test/attachments.test.mjs`
- `test/memory.test.mjs`
- `test/parseSignals.test.mjs` (optional — bonus coverage)

All tests run via `cd .claude/bek && node --test test/*.test.mjs` (existing command).

---

## Task 0: Verify GramIO photo payload shape

**Goal:** Confirm whether `ctx.photo` is a plain array (current code assumption) or an object with `bigSize`/`mediumSize`/`smallSize` properties (as GramIO docs suggest). Findings drive attachment refactor.

**Files:** none (research only).

- [ ] **Step 1: Inspect current photo handling**

Read `.claude/bek/bek-daemon.mjs:381-396`. Confirm the daemon currently does `ctx.photo[ctx.photo.length - 1].fileId`. Record: *"current code treats photo as array; works today."*

- [ ] **Step 2: Add a temporary diagnostic log**

Edit `.claude/bek/bek-daemon.mjs` inside the `if (ctx.photo)` branch (around line 381), add:

```js
await log(`[bek] photo payload shape: Array.isArray=${Array.isArray(ctx.photo)} keys=${Object.keys(ctx.photo).slice(0,10).join(',')}`);
```

- [ ] **Step 3: Restart daemon, send one photo to the group**

```bash
pm2 restart quantumbek
```

Send a photo from Telegram. Inspect `.claude/logs/bek-daemon.log` for the diagnostic line.

- [ ] **Step 4: Record findings and remove diagnostic**

Record one of:
- `Array.isArray=true` → current access pattern is correct, port verbatim to `attachments.mjs`.
- `Array.isArray=false, keys=smallSize,mediumSize,bigSize` → use `ctx.photo.bigSize.fileId` in `attachments.mjs`.
- `Array.isArray=false, other keys` → inspect and adjust.

Remove the diagnostic line. Do not commit it.

- [ ] **Step 5: Commit empty marker (optional)**

Skip commit for this task — it is pure research. Carry the finding forward into Task 12.

---

## Task 1: logger.mjs

**Files:**
- Create: `.claude/bek/logger.mjs`
- Test: none (trivial I/O, covered by daemon smoke at end)

- [ ] **Step 1: Create `logger.mjs`**

Create `.claude/bek/logger.mjs`:

```js
import { appendFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_FILE = join(__dirname, '..', 'logs', 'bek-daemon.log');

async function writeLine(prefix, msg) {
  const line = `${new Date().toISOString()}${prefix} ${msg}\n`;
  process.stdout.write(line);
  await appendFile(LOG_FILE, line).catch(() => {});
}

export function log(msg) {
  return writeLine('', msg);
}

export function warn(msg) {
  return writeLine(' [WARN]', msg);
}
```

- [ ] **Step 2: Quick smoke check**

Run:
```bash
cd D:/dev2/projects/provodnik/.claude/bek
node -e "import('./logger.mjs').then(m => m.log('smoke')).then(() => console.log('ok'))"
```
Expected: prints timestamped line + `ok`. `.claude/logs/bek-daemon.log` has the smoke line appended.

- [ ] **Step 3: Commit**

```bash
git add .claude/bek/logger.mjs
git commit -m "refactor(bek): add logger.mjs — shared direct-file logger"
```

---

## Task 2: config.mjs

**Files:**
- Create: `.claude/bek/config.mjs`
- Create: `.claude/bek/test/config.test.mjs`

- [ ] **Step 1: Write failing test**

Create `.claude/bek/test/config.test.mjs`:

```js
import { strict as assert } from 'node:assert';
import { describe, it, before, after } from 'node:test';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, writeGroupLock } from '../config.mjs';

let dir;
let cfgPath;

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bek-cfg-'));
  cfgPath = join(dir, 'bek.config.json');
});

after(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('loadConfig', () => {
  it('applies defaults for missing keys', async () => {
    await writeFile(cfgPath, JSON.stringify({ telegram_token: 't', group_id: null }));
    const cfg = await loadConfig(cfgPath);
    assert.equal(cfg.stream_gap_reset_ms, 90_000);
    assert.equal(cfg.claude_timeout_ms, 1_500_000);
    assert.equal(cfg.whisper_bin, 'whisper');
    assert.equal(cfg.whisper_model, 'large-v3-turbo');
    assert.equal(cfg.max_queue_depth, 4);
    assert.equal(cfg.memory_inject_tail, 30);
    assert.equal(cfg.memory_rotate_threshold, 80);
    assert.equal(cfg.telegram_max, 4000);
    assert.equal(cfg.stream_max, 3800);
  });

  it('does not overwrite provided values', async () => {
    await writeFile(cfgPath, JSON.stringify({ telegram_token: 't', group_id: null, max_queue_depth: 10 }));
    const cfg = await loadConfig(cfgPath);
    assert.equal(cfg.max_queue_depth, 10);
  });
});

describe('writeGroupLock', () => {
  it('persists group_id to disk and returns updated config', async () => {
    await writeFile(cfgPath, JSON.stringify({ telegram_token: 't', group_id: null }));
    const cfg = await loadConfig(cfgPath);
    const updated = await writeGroupLock(cfgPath, cfg, -987654);
    assert.equal(updated.group_id, -987654);
    const onDisk = JSON.parse(await readFile(cfgPath, 'utf8'));
    assert.equal(onDisk.group_id, -987654);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd D:/dev2/projects/provodnik/.claude/bek
node --test test/config.test.mjs
```
Expected: FAIL with `Cannot find module '../config.mjs'`.

- [ ] **Step 3: Create `config.mjs`**

Create `.claude/bek/config.mjs`:

```js
import { readFile, writeFile } from 'node:fs/promises';

const DEFAULTS = {
  stream_gap_reset_ms: 90_000,
  claude_timeout_ms: 1_500_000,
  whisper_bin: 'whisper',
  whisper_model: 'large-v3-turbo',
  max_queue_depth: 4,
  memory_inject_tail: 30,
  memory_rotate_threshold: 80,
  telegram_max: 4000,
  stream_max: 3800,
};

export async function loadConfig(configPath) {
  const raw = JSON.parse(await readFile(configPath, 'utf8'));
  return { ...DEFAULTS, ...raw };
}

export async function writeGroupLock(configPath, config, chatId) {
  const updated = { ...config, group_id: chatId };
  await writeFile(configPath, JSON.stringify(updated, null, 2));
  return updated;
}
```

- [ ] **Step 4: Run tests**

```bash
node --test test/config.test.mjs
```
Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .claude/bek/config.mjs .claude/bek/test/config.test.mjs
git commit -m "refactor(bek): add config.mjs — loadConfig + writeGroupLock with defaults"
```

---

## Task 3: metrics.mjs

**Files:**
- Create: `.claude/bek/metrics.mjs`
- Test: none (thin wrapper around `@pm2/io` — exercised by daemon smoke)

- [ ] **Step 1: Create `metrics.mjs`**

Create `.claude/bek/metrics.mjs`:

```js
import io from '@pm2/io';

const queueDepth   = io.metric({ name: 'Queue depth',    id: 'bek/queue/depth' });
const sessionState = io.metric({ name: 'Session state',  id: 'bek/session/state' });
const errors       = io.counter({ name: 'Claude errors', id: 'bek/claude/errors' });
const learns       = io.counter({ name: 'LEARN signals', id: 'bek/memory/learns' });
const latency      = io.histogram({ name: 'Claude ms',   id: 'bek/claude/latency', measurement: 'mean' });

export const metrics = {
  queueDepth:   { set: (n) => queueDepth.set(n) },
  sessionState: { set: (s) => sessionState.set(s) },
  errors:       { inc: () => errors.inc() },
  learns:       { inc: () => learns.inc() },
  latency:      { update: (ms) => latency.update(ms) },
};
```

- [ ] **Step 2: Smoke check**

Run:
```bash
cd D:/dev2/projects/provodnik/.claude/bek
node -e "import('./metrics.mjs').then(m => { m.metrics.queueDepth.set(3); m.metrics.errors.inc(); console.log('ok'); })"
```
Expected: prints `ok` without throwing.

- [ ] **Step 3: Commit**

```bash
git add .claude/bek/metrics.mjs
git commit -m "refactor(bek): add metrics.mjs — @pm2/io wrapper"
```

---

## Task 4: telegram-helpers.mjs

**Files:**
- Create: `.claude/bek/telegram-helpers.mjs`
- Create: `.claude/bek/test/telegram-helpers.test.mjs`

- [ ] **Step 1: Write failing test**

Create `.claude/bek/test/telegram-helpers.test.mjs`:

```js
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { chunkText, makeStreamer } from '../telegram-helpers.mjs';

describe('chunkText', () => {
  it('returns one chunk when text fits', () => {
    const chunks = chunkText('hello', 100);
    assert.deepEqual(chunks, ['hello']);
  });

  it('splits on newline boundary when available', () => {
    const text = 'line1\nline2\nline3';
    const chunks = chunkText(text, 12);
    assert.equal(chunks.length, 2);
    assert.ok(chunks[0].endsWith('line2') || chunks[0].endsWith('line1'));
  });

  it('hard-cuts when no newline found within limit', () => {
    const text = 'abcdefghijklmnop';
    const chunks = chunkText(text, 5);
    assert.equal(chunks[0].length, 5);
    assert.equal(chunks.join(''), text);
  });
});

describe('makeStreamer', () => {
  it('sends on first chunk, edits on subsequent within gap', async () => {
    const calls = [];
    const fakeBot = {
      api: {
        sendMessage: async ({ text }) => { calls.push(['send', text]); return { message_id: 42 }; },
        editMessageText: async ({ text }) => { calls.push(['edit', text]); return {}; },
      },
    };
    const push = makeStreamer(fakeBot, 1, { gapMs: 90_000, streamMax: 100 });
    push('A');
    push('B');
    // Allow promise chain to drain.
    await new Promise(r => setTimeout(r, 20));
    assert.equal(calls[0][0], 'send');
    assert.equal(calls[1][0], 'edit');
    assert.ok(calls[1][1].includes('A') && calls[1][1].includes('B'));
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
node --test test/telegram-helpers.test.mjs
```
Expected: FAIL with `Cannot find module`.

- [ ] **Step 3: Create `telegram-helpers.mjs`**

Create `.claude/bek/telegram-helpers.mjs`:

```js
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function withTyping(bot, chatId, fn) {
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

export function setReaction(bot, chatId, messageId, emoji) {
  return bot.api.setMessageReaction({
    chat_id: chatId,
    message_id: messageId,
    reaction: [{ type: 'emoji', emoji }],
  }).catch(() => {});
}

export async function downloadTelegramFile(bot, token, fileId, prefix) {
  const fileInfo = await bot.api.getFile({ file_id: fileId });
  const url = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
  const realExt = fileInfo.file_path.split('.').pop() || prefix;
  const dest = join(__dirname, '..', 'logs', `${prefix}-${Date.now()}.${realExt}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Telegram file download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return dest;
}

export function chunkText(text, maxLen) {
  const chunks = [];
  while (text.length > 0) {
    if (text.length <= maxLen) {
      chunks.push(text);
      break;
    }
    let cut = text.lastIndexOf('\n', maxLen);
    if (cut <= 0) cut = maxLen;
    chunks.push(text.slice(0, cut).trimEnd());
    text = text.slice(cut).trimStart();
  }
  return chunks;
}

export function makeStreamer(bot, chatId, { gapMs, streamMax }) {
  let msgId = null;
  let accumulated = '';
  let lastPushAt = 0;
  let chain = Promise.resolve();

  function pushChunk(chunk) {
    chain = chain.then(async () => {
      const now = Date.now();
      const gapExpired = msgId !== null && (now - lastPushAt) > gapMs;
      if (!msgId || gapExpired) {
        const sent = await bot.api.sendMessage({ chat_id: chatId, text: chunk });
        msgId = sent.message_id;
        accumulated = chunk;
        lastPushAt = now;
        return;
      }
      const next = accumulated + '\n\n' + chunk;
      if (next.length > streamMax) {
        const sent = await bot.api.sendMessage({ chat_id: chatId, text: chunk });
        msgId = sent.message_id;
        accumulated = chunk;
      } else {
        accumulated = next;
        await bot.api.editMessageText({ chat_id: chatId, message_id: msgId, text: accumulated });
      }
      lastPushAt = now;
    }).catch(() => {});
  }

  return function push(text) {
    for (const chunk of chunkText(text, streamMax)) pushChunk(chunk);
  };
}
```

- [ ] **Step 4: Run tests**

```bash
node --test test/telegram-helpers.test.mjs
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add .claude/bek/telegram-helpers.mjs .claude/bek/test/telegram-helpers.test.mjs
git commit -m "refactor(bek): add telegram-helpers.mjs — withTyping, setReaction, download, streamer, chunkText"
```

---

## Task 5: Wire daemon to logger/config/metrics/telegram-helpers

**Goal:** Replace the inline logger, config-load with defaults, metrics, and telegram helpers in `bek-daemon.mjs` with imports from the new modules. No behavior change.

**Files:**
- Modify: `.claude/bek/bek-daemon.mjs`

- [ ] **Step 1: Replace top-of-file config + logger with imports**

In `.claude/bek/bek-daemon.mjs`, replace lines 1-26 (imports, `__dirname`, custom `log`, inline config read) with:

```js
import { readFile, writeFile, unlink, writeFile as writeFileBin } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Bot, TelegramError } from 'gramio';
import PQueue from 'p-queue';
import { SessionManager } from './session-manager.mjs';
import { runClaude } from './claude-runner.mjs';
import { sanitize } from './sanitizer.mjs';
import { buildFirstPrompt, buildContinuationPrompt } from './system-prompt.mjs';
import { parseOverride, randomUnauthorizedResponse } from './override-handler.mjs';
import { transcribeVoice } from './whisper.mjs';
import { log, warn } from './logger.mjs';
import { loadConfig, writeGroupLock } from './config.mjs';
import { metrics } from './metrics.mjs';
import { withTyping, setReaction, downloadTelegramFile, makeStreamer } from './telegram-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, 'bek.config.json');
let config = await loadConfig(configPath);
```

- [ ] **Step 2: Replace `isLockedGroup`**

Replace the existing `isLockedGroup` function with:

```js
async function isLockedGroup(chatId) {
  if (config.group_id === null) {
    config = await writeGroupLock(configPath, config, chatId);
    await log(`[bek] Group locked to ${chatId}`);
    return true;
  }
  return config.group_id === chatId;
}
```

- [ ] **Step 3: Delete inline metric declarations**

Remove the five `io.metric/counter/histogram` declarations in `bek-daemon.mjs` (lines ~67-74 in the original). Everywhere a metric is used (e.g. `metricSessionState.set(...)`, `counterErrors.inc()`, `histLatency.update(...)`, `counterLearn.inc()`, `metricQueueDepth.set(...)`), replace with the `metrics.*` equivalents:

| Old | New |
|---|---|
| `metricQueueDepth.set(x)` | `metrics.queueDepth.set(x)` |
| `metricSessionState.set(x)` | `metrics.sessionState.set(x)` |
| `counterErrors.inc()` | `metrics.errors.inc()` |
| `counterLearn.inc()` | `metrics.learns.inc()` |
| `histLatency.update(x)` | `metrics.latency.update(x)` |

Also remove the `import io from '@pm2/io';` line if it remains.

- [ ] **Step 4: Delete inline `withTyping`, `setReaction`, `downloadTelegramFile`, streamer helpers**

These are imported from `telegram-helpers.mjs` now. Delete their inline definitions. Update callers:
- `withTyping(chatId, fn)` → `withTyping(bot, chatId, fn)`
- `setReaction(chatId, id, emoji)` → `setReaction(bot, chatId, id, emoji)`
- `downloadTelegramFile(fileId, prefix)` → `downloadTelegramFile(bot, config.telegram_token, fileId, prefix)`
- `makeStreamer(chatId)` → `makeStreamer(bot, chatId, { gapMs: config.stream_gap_reset_ms, streamMax: config.stream_max })`

- [ ] **Step 5: Remove `STREAM_MAX` and `chunkText` constants/function**

Both now live in `telegram-helpers.mjs`. Delete their inline copies.

- [ ] **Step 6: Replace remaining `config.foo ?? default` fallbacks**

Scan for `?? 90_000`, `?? 1500000`, `?? 'whisper'`, `?? 'large-v3-turbo'`, `?? MAX_QUEUE_DEPTH`. Remove — defaults are now applied in `loadConfig`. Replace `MAX_QUEUE_DEPTH` constant at top with `config.max_queue_depth` at call sites.

- [ ] **Step 7: Replace `process.stdout.write` + `appendFile` logger with imports**

Delete the inline `async function log(msg) { ... }` at the top of the file. It is now imported.

- [ ] **Step 8: Run existing tests**

```bash
cd D:/dev2/projects/provodnik/.claude/bek
node --test test/*.test.mjs
```
Expected: all existing tests pass.

- [ ] **Step 9: Smoke: restart daemon, send 1 text message**

```bash
pm2 restart quantumbek
```
Send one text to the group. Confirm `.claude/logs/bek-daemon.log` shows the `[bek] running Claude` line and BEK replies.

- [ ] **Step 10: Commit**

```bash
git add .claude/bek/bek-daemon.mjs
git commit -m "refactor(bek): wire daemon to logger/config/metrics/telegram-helpers modules"
```

---

## Task 6: commands.mjs (merge override-handler)

**Files:**
- Create: `.claude/bek/commands.mjs`
- Rename (via delete + create): `.claude/bek/test/override-handler.test.mjs` → `.claude/bek/test/commands.test.mjs`

- [ ] **Step 1: Read the current override-handler tests**

Read `.claude/bek/test/override-handler.test.mjs`. The new test file will be a superset.

- [ ] **Step 2: Write new failing test file**

Create `.claude/bek/test/commands.test.mjs`:

```js
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseOverride, randomUnauthorizedResponse, handleOverride } from '../commands.mjs';

describe('parseOverride', () => {
  it('returns null for non-slash messages', () => {
    assert.equal(parseOverride('hello', 'anyone'), null);
  });

  it('parses /pause as authorized when username is CarbonS8', () => {
    assert.deepEqual(parseOverride('/pause', 'CarbonS8'), { command: 'pause', authorized: true });
  });

  it('parses /plan as unauthorized for others', () => {
    assert.deepEqual(parseOverride('/plan', 'six'), { command: 'plan', authorized: false });
  });

  it('rejects unknown commands', () => {
    assert.equal(parseOverride('/unknown', 'CarbonS8'), null);
  });

  it('accepts /done and /execute', () => {
    assert.deepEqual(parseOverride('/done', 'CarbonS8'), { command: 'done', authorized: true });
    assert.deepEqual(parseOverride('/execute', 'CarbonS8'), { command: 'execute', authorized: true });
  });
});

describe('randomUnauthorizedResponse', () => {
  it('returns a non-empty string from the pool', () => {
    for (let i = 0; i < 20; i++) {
      const msg = randomUnauthorizedResponse();
      assert.ok(typeof msg === 'string' && msg.length > 0);
    }
  });
});

describe('handleOverride', () => {
  it('status returns a Russian label', async () => {
    const sent = [];
    const ctx = { send: async (m) => sent.push(m) };
    const fakeSessions = { readSession: async () => ({ state: 'BRAINSTORMING' }) };
    await handleOverride(ctx, 'status', {
      queue: { pause: () => {}, clear: () => {}, start: () => {} },
      sessions: fakeSessions,
      config: { group_id: -1 },
      sanitize: (s) => s,
      log: async () => {},
    });
    assert.equal(sent.length, 1);
    assert.ok(sent[0].includes('Анализирую задачу') || sent[0].toLowerCase().includes('status'));
  });
});
```

- [ ] **Step 3: Run to verify failure**

```bash
node --test test/commands.test.mjs
```
Expected: FAIL with `Cannot find module '../commands.mjs'`.

- [ ] **Step 4: Create `commands.mjs`**

Create `.claude/bek/commands.mjs`:

```js
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const VALID_COMMANDS = ['pause', 'abort', 'plan', 'status', 'execute', 'done'];

const UNAUTHORIZED_RESPONSES = [
  'У тебя нет таких полномочий. Продолжай мечтать.',
  'Интересная попытка. Нет.',
  'Ты не тот человек. Иди дальше.',
  'Нет. Просто нет.',
  'Смешно. Но нет.',
];

export function parseOverride(text, username) {
  const match = text.trim().match(/^\/(\w+)/);
  if (!match) return null;
  const command = match[1].toLowerCase();
  if (!VALID_COMMANDS.includes(command)) return null;
  return { command, authorized: username === 'CarbonS8' };
}

export function randomUnauthorizedResponse() {
  return UNAUTHORIZED_RESPONSES[Math.floor(Math.random() * UNAUTHORIZED_RESPONSES.length)];
}

const STATE_LABELS = {
  IDLE: 'Жду задачу',
  BRAINSTORMING: 'Анализирую задачу',
  PLAN_READY: 'План готов, жду /execute от CarbonS8',
  DONE: 'Завершено',
};

export async function handleOverride(ctx, command, { queue, sessions, config, sanitize, log }) {
  if (command === 'pause') {
    queue.pause();
    await ctx.send(sanitize('Пауза.'));
    return;
  }
  if (command === 'abort') {
    queue.clear();
    queue.start();
    const cur = await sessions.readSession();
    await sessions.archive(cur?.task_slug ?? 'aborted');
    await sessions.writeSession({ state: 'IDLE', claude_session_id: null, group_id: config.group_id });
    await ctx.send(sanitize('Отменено.'));
    return;
  }
  if (command === 'plan') {
    const plan = (await sessions.readActiveFile?.('plan.md')) ?? '';
    if (plan) await ctx.send(sanitize(plan.slice(0, 3800)));
    else await ctx.send('План ещё не готов.');
    return;
  }
  if (command === 'status') {
    const session = await sessions.readSession();
    const label = session ? (STATE_LABELS[session.state] ?? session.state) : 'Жду задачу';
    await ctx.send(`Статус: ${label}.`);
    return;
  }
  if (command === 'done') {
    const session = await sessions.readSession();
    const slug = session?.task_slug ?? 'session';
    await sessions.archive(slug);
    await sessions.writeSession({ state: 'IDLE', claude_session_id: null });
    await ctx.send(sanitize('Сессия закрыта. Готов к следующей задаче.'));
    await log(`[bek] /done — session archived (${slug}), reset to IDLE`);
    return;
  }
  if (command === 'execute') {
    const session = await sessions.readSession();
    if (!session || session.state !== 'PLAN_READY') {
      await ctx.send(sanitize('Нет готового плана. Сначала нужен план.'));
      return;
    }
    const slug = session.task_slug ?? 'plan';
    await sessions.archive(slug);
    await sessions.writeSession({ state: 'IDLE', claude_session_id: null });
    await ctx.send(sanitize('Передаю. Сессия заархивирована.'));
    await log(`[bek] /execute — session archived (${slug}), reset to IDLE`);
    return;
  }
}
```

- [ ] **Step 5: Run tests**

```bash
node --test test/commands.test.mjs
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add .claude/bek/commands.mjs .claude/bek/test/commands.test.mjs
git commit -m "refactor(bek): merge override-handler into commands.mjs with dispatch"
```

---

## Task 7: Wire daemon to commands.mjs, delete override-handler.mjs

**Files:**
- Modify: `.claude/bek/bek-daemon.mjs`
- Delete: `.claude/bek/override-handler.mjs`
- Delete: `.claude/bek/test/override-handler.test.mjs`

- [ ] **Step 1: Update daemon import**

In `bek-daemon.mjs`, replace:
```js
import { parseOverride, randomUnauthorizedResponse } from './override-handler.mjs';
```
with:
```js
import { parseOverride, randomUnauthorizedResponse, handleOverride } from './commands.mjs';
```

- [ ] **Step 2: Delete inline `handleOverride` function in daemon**

Remove the entire `async function handleOverride(ctx, command) { ... }` block from `bek-daemon.mjs` (the ~50 LOC block).

- [ ] **Step 3: Update call site**

Where daemon currently calls `await handleOverride(ctx, override.command);`, replace with:

```js
await handleOverride(ctx, override.command, {
  queue,
  sessions,
  config,
  sanitize,
  log,
});
```

- [ ] **Step 4: Delete old files**

```bash
rm .claude/bek/override-handler.mjs
rm .claude/bek/test/override-handler.test.mjs
```

- [ ] **Step 5: Run full tests**

```bash
node --test test/*.test.mjs
```
Expected: all pass.

- [ ] **Step 6: Smoke: `/status` in Telegram**

```bash
pm2 restart quantumbek
```
Send `/status` from `CarbonS8` in the group. Expect the Russian status reply.

- [ ] **Step 7: Commit**

```bash
git add .claude/bek/bek-daemon.mjs
git rm .claude/bek/override-handler.mjs .claude/bek/test/override-handler.test.mjs
git commit -m "refactor(bek): daemon uses commands.mjs; delete override-handler.mjs"
```

---

## Task 8: memory.mjs

**Files:**
- Create: `.claude/bek/memory.mjs`
- Create: `.claude/bek/test/memory.test.mjs`

- [ ] **Step 1: Write failing test**

Create `.claude/bek/test/memory.test.mjs`:

```js
import { strict as assert } from 'node:assert';
import { describe, it, before, after } from 'node:test';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readMemory, appendMemory } from '../memory.mjs';

let dir;
before(async () => { dir = await mkdtemp(join(tmpdir(), 'bek-mem-')); });
after(async () => { await rm(dir, { recursive: true, force: true }); });

describe('memory.mjs', () => {
  it('returns empty string when memory.md does not exist', async () => {
    const dir2 = await mkdtemp(join(tmpdir(), 'bek-mem-empty-'));
    const out = await readMemory(dir2);
    assert.equal(out, '');
    await rm(dir2, { recursive: true, force: true });
  });

  it('append with tag creates a ## Tag section', async () => {
    await appendMemory(dir, '[schema] UserTable has foo column', { rotateThreshold: 1000 });
    const body = await readFile(join(dir, 'memory.md'), 'utf8');
    assert.ok(body.includes('## Schema'));
    assert.ok(body.includes('UserTable has foo column'));
  });

  it('append without tag goes under ## Misc', async () => {
    await appendMemory(dir, 'a generic note', { rotateThreshold: 1000 });
    const body = await readFile(join(dir, 'memory.md'), 'utf8');
    assert.ok(body.includes('## Misc'));
    assert.ok(body.includes('a generic note'));
  });

  it('appending same tag merges into existing section', async () => {
    await appendMemory(dir, '[schema] second schema fact', { rotateThreshold: 1000 });
    const body = await readFile(join(dir, 'memory.md'), 'utf8');
    const schemaCount = body.match(/## Schema/g)?.length ?? 0;
    assert.equal(schemaCount, 1);
    assert.ok(body.includes('second schema fact'));
  });

  it('tail read returns last N entries flat', async () => {
    const tail = await readMemory(dir, { tail: 2 });
    const lines = tail.split('\n').filter(l => l.trim());
    assert.equal(lines.length, 2);
  });

  it('rotation moves oldest 50% to memory-archive.md when over threshold', async () => {
    const dir3 = await mkdtemp(join(tmpdir(), 'bek-mem-rot-'));
    for (let i = 1; i <= 10; i++) {
      await appendMemory(dir3, `[misc] entry ${i}`, { rotateThreshold: 8 });
    }
    const archivePath = join(dir3, 'memory-archive.md');
    const archived = await readFile(archivePath, 'utf8').catch(() => '');
    assert.ok(archived.length > 0, 'archive should exist after rotation');
    const body = await readFile(join(dir3, 'memory.md'), 'utf8');
    const bodyEntries = body.match(/\[\d{4}-\d{2}-\d{2}\]/g)?.length ?? 0;
    assert.ok(bodyEntries < 10, 'body should have fewer entries after rotation');
    await rm(dir3, { recursive: true, force: true });
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
node --test test/memory.test.mjs
```
Expected: FAIL.

- [ ] **Step 3: Create `memory.mjs`**

Create `.claude/bek/memory.mjs`:

```js
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const MISC = 'Misc';
const ENTRY_RE = /^\[\d{4}-\d{2}-\d{2}\]/;

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function parseEntry(raw) {
  const m = raw.match(/^\[([a-zA-Z][\w-]*)\]\s*(.*)$/);
  if (m) return { tag: titleCase(m[1]), body: m[2].trim() };
  return { tag: MISC, body: raw.trim() };
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function parseFile(text) {
  const sections = new Map();
  let current = MISC;
  for (const line of text.split('\n')) {
    const m = line.match(/^##\s+(.+)$/);
    if (m) {
      current = m[1].trim();
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    if (!sections.has(current)) sections.set(current, []);
    if (line.trim()) sections.get(current).push(line);
  }
  return sections;
}

function serializeSections(sections) {
  const out = [];
  for (const [tag, lines] of sections) {
    if (!lines.length) continue;
    out.push(`## ${tag}`);
    for (const l of lines) out.push(l);
    out.push('');
  }
  return out.join('\n').trimEnd() + '\n';
}

function entryCount(sections) {
  let n = 0;
  for (const lines of sections.values()) {
    for (const l of lines) if (ENTRY_RE.test(l)) n++;
  }
  return n;
}

export async function readMemory(sessionsPath, { tail } = {}) {
  const file = join(sessionsPath, 'memory.md');
  if (!existsSync(file)) return '';
  const body = await readFile(file, 'utf8');
  if (!tail) return body;
  const sections = parseFile(body);
  const all = [];
  for (const [tag, lines] of sections) {
    for (const l of lines) {
      if (ENTRY_RE.test(l)) all.push({ tag, line: l });
    }
  }
  const take = all.slice(-tail);
  return take.map(e => `[${e.tag}] ${e.line}`).join('\n');
}

export async function appendMemory(sessionsPath, entry, { rotateThreshold }) {
  const file = join(sessionsPath, 'memory.md');
  const archiveFile = join(sessionsPath, 'memory-archive.md');
  const existing = existsSync(file) ? await readFile(file, 'utf8') : '';
  const sections = parseFile(existing);

  const { tag, body } = parseEntry(entry);
  const line = `[${todayStamp()}] ${body}`;
  if (!sections.has(tag)) sections.set(tag, []);
  sections.get(tag).push(line);

  // Rotation: if total entries > threshold, move oldest 50% to archive.
  if (entryCount(sections) > rotateThreshold) {
    const movePer = new Map();
    for (const [t, lines] of sections) {
      const entries = lines.filter(l => ENTRY_RE.test(l));
      const half = Math.floor(entries.length / 2);
      if (half > 0) movePer.set(t, entries.slice(0, half));
    }
    const archiveOld = existsSync(archiveFile) ? await readFile(archiveFile, 'utf8') : '';
    const archiveSections = parseFile(archiveOld);
    for (const [t, moved] of movePer) {
      if (!archiveSections.has(t)) archiveSections.set(t, []);
      archiveSections.get(t).push(...moved);
      const keep = sections.get(t).filter(l => !moved.includes(l));
      sections.set(t, keep);
    }
    await writeFile(archiveFile, serializeSections(archiveSections));
  }

  await writeFile(file, serializeSections(sections));
}
```

- [ ] **Step 4: Run tests**

```bash
node --test test/memory.test.mjs
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add .claude/bek/memory.mjs .claude/bek/test/memory.test.mjs
git commit -m "feat(bek): add memory.mjs — tagged memory with rotation + tail read"
```

---

## Task 9: Wire SessionManager + system-prompt to memory.mjs

**Goal:** Remove `readMemory`/`appendMemory` from `SessionManager`; have `bek-daemon.mjs` and `system-prompt.mjs` use `memory.mjs` directly. Add `readPlan()` convenience to SessionManager.

**Files:**
- Modify: `.claude/bek/session-manager.mjs`
- Modify: `.claude/bek/bek-daemon.mjs`
- Modify: `.claude/bek/system-prompt.mjs`

- [ ] **Step 1: Remove `readMemory` + `appendMemory` from SessionManager**

In `.claude/bek/session-manager.mjs`, delete the `readMemory` and `appendMemory` methods (~15 LOC). Keep everything else.

- [ ] **Step 2: Add `readPlan` to SessionManager**

Add to `.claude/bek/session-manager.mjs`:

```js
/** @returns {Promise<string>} plan.md content or '' */
async readPlan() {
  return this.readActiveFile('plan.md');
}
```

- [ ] **Step 3: Update daemon imports and memory calls**

In `.claude/bek/bek-daemon.mjs`, add:

```js
import { readMemory, appendMemory } from './memory.mjs';
```

Replace:
- `await sessions.readMemory()` → `await readMemory(config.sessions_path, { tail: config.memory_inject_tail })`
- `await sessions.appendMemory(entry)` → `await appendMemory(config.sessions_path, entry, { rotateThreshold: config.memory_rotate_threshold })`

- [ ] **Step 4: Update `commands.mjs` `/plan` to use `readPlan`**

In `.claude/bek/commands.mjs`, replace the `/plan` body:

```js
if (command === 'plan') {
  const plan = await sessions.readPlan();
  if (plan) await ctx.send(sanitize(plan.slice(0, 3800)));
  else await ctx.send('План ещё не готов.');
  return;
}
```

- [ ] **Step 5: Run tests**

```bash
node --test test/*.test.mjs
```
Expected: all pass. `session-manager.test.mjs` may need removal of any test that referenced the deleted memory methods — if none exist, skip. (Current `session-manager.test.mjs` does not test memory, so no changes required.)

- [ ] **Step 6: Smoke: restart + send text**

```bash
pm2 restart quantumbek
```
Send 1 text, confirm normal reply.

- [ ] **Step 7: Commit**

```bash
git add .claude/bek/session-manager.mjs .claude/bek/bek-daemon.mjs .claude/bek/commands.mjs
git commit -m "refactor(bek): wire memory.mjs; add SessionManager.readPlan(); remove memory ops from SessionManager"
```

---

## Task 10: renderContextBlocks refactor in system-prompt.mjs

**Goal:** Extract shared memory/brief/plan/checkpoints/history rendering from `buildFirstPrompt` and `buildContinuationPrompt` into one helper. Behavior unchanged.

**Files:**
- Modify: `.claude/bek/system-prompt.mjs`

- [ ] **Step 1: Add `renderContextBlocks` helper**

In `.claude/bek/system-prompt.mjs`, add below `BEK_SYSTEM_PROMPT`:

```js
/**
 * Render optional context blocks for the prompt.
 * Each block is emitted only when non-empty. `history` may be a string (legacy)
 * or `{ summary, tail }` (post-summarizer).
 */
export function renderContextBlocks({ memory = '', brief = '', plan = '', checkpoints = '', history = '' } = {}) {
  const parts = [];
  if (memory.trim())      parts.push(`[PERSISTENT MEMORY — facts you learned in previous plans]\n${memory.trim()}`);
  if (brief.trim())       parts.push(`[BRIEF — read and act on this before anything else]\n${brief.trim()}`);
  if (plan.trim())        parts.push(`[ACTIVE PLAN]\n${plan.trim()}`);
  if (checkpoints.trim()) parts.push(`[PROGRESS]\n${checkpoints.trim()}`);
  if (history && typeof history === 'object') {
    const summary = (history.summary ?? '').trim();
    const tail    = (history.tail ?? '').trim();
    if (summary) parts.push(`[CONVERSATION SUMMARY — earlier sessions]\n${summary}`);
    if (tail)    parts.push(`[RECENT CONVERSATION]\n${tail}`);
  } else if (typeof history === 'string' && history.trim()) {
    parts.push(`[CONVERSATION SO FAR]\n${history.trim()}`);
  }
  return parts.length ? '\n\n' + parts.join('\n\n') : '';
}
```

- [ ] **Step 2: Refactor `buildFirstPrompt`**

Replace the body of `buildFirstPrompt`:

```js
export function buildFirstPrompt(userMessage, conversationHistory = '', brief = '', memory = '') {
  const blocks = renderContextBlocks({ memory, brief, history: conversationHistory });
  return `${BEK_SYSTEM_PROMPT}${blocks}\n\n[NEW MESSAGE]\n${userMessage}`;
}
```

- [ ] **Step 3: Refactor `buildContinuationPrompt`**

Replace the body of `buildContinuationPrompt`:

```js
export function buildContinuationPrompt(userMessage, { recentHistory = '', plan = '', checkpoints = '', brief = '', memory = '' } = {}) {
  const blocks = renderContextBlocks({ memory, brief, plan, checkpoints, history: recentHistory });
  return `${BEK_SYSTEM_PROMPT}${blocks}\n\n[CURRENT MESSAGE]\n${userMessage}`;
}
```

- [ ] **Step 4: Sanity-check first-prompt output**

Run:
```bash
cd D:/dev2/projects/provodnik/.claude/bek
node -e "import('./system-prompt.mjs').then(m => { const p = m.buildFirstPrompt('hi', 'u: hello', '', 'note1'); console.log(p.slice(-400)); });"
```
Expected: output ends with `[NEW MESSAGE]\nhi` and contains the memory + history blocks above it.

- [ ] **Step 5: Run full tests**

```bash
node --test test/*.test.mjs
```
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add .claude/bek/system-prompt.mjs
git commit -m "refactor(bek): extract renderContextBlocks() shared by prompt builders"
```

---

## Task 11: LEARN tag paragraph in BEK_SYSTEM_PROMPT

**Files:**
- Modify: `.claude/bek/system-prompt.mjs`

- [ ] **Step 1: Add the tag convention paragraph**

In `.claude/bek/system-prompt.mjs`, find the `PERSISTENT MEMORY — LEARN signal rules:` section. Append this paragraph immediately after the existing `Example triggers: ...` line:

```
- Tagging: prefix LEARN with a bracketed topic tag so facts group by topic.
  Examples:
    LEARN: [schema] TravelerRequest.startTime is optional
    LEARN: [ux] Alex prefers removing UI chrome over adding it
    LEARN: [constraints] Postgres time type returns HH:MM:SS
    LEARN: [process] run bun typecheck before push
  Tag is freeform — pick a short word that groups related knowledge.
  If you omit a tag, the entry lands under Misc.
```

- [ ] **Step 2: Sanity-check length**

Confirm `BEK_SYSTEM_PROMPT` still under ~200 lines; no persona rules changed.

- [ ] **Step 3: Run tests**

```bash
node --test test/*.test.mjs
```
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add .claude/bek/system-prompt.mjs
git commit -m "feat(bek): LEARN tag convention — [topic] prefix for grouped memory"
```

---

## Task 12: attachments.mjs

**Files:**
- Create: `.claude/bek/attachments.mjs`
- Create: `.claude/bek/test/attachments.test.mjs`

**Context:** Use the photo-shape finding from Task 0. Below code assumes array access (current daemon behavior). Adjust `getPhotoFileId` if Task 0 showed otherwise.

- [ ] **Step 1: Write failing test**

Create `.claude/bek/test/attachments.test.mjs`:

```js
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { enqueueAttachment } from '../attachments.mjs';

describe('enqueueAttachment', () => {
  it('image kind appends conversation and invokes handleMessage with downloaded path', async () => {
    const appended = [];
    const handled = [];
    const deps = {
      sessions: { appendConversation: async (l) => appended.push(l) },
      handleMessage: async (ctx, text, path) => handled.push({ text, path }),
      bot: {},
      token: 'tok',
      download: async () => '/tmp/fake-photo.jpg',
      metrics: { queueDepth: { set: () => {} } },
    };
    const fakeQueue = {
      add: (fn) => fn(),
      size: 0,
      pending: 0,
    };
    const ctx = {
      photo: [{ fileId: 'f1' }],
      caption: 'cap',
      from: { username: 'six' },
    };
    await enqueueAttachment(fakeQueue, ctx, 'image', deps);
    assert.ok(appended[0].includes('[изображение] cap'));
    assert.equal(handled[0].path, '/tmp/fake-photo.jpg');
    assert.ok(handled[0].text.includes('cap'));
  });

  it('pdf kind uses document.fileId and pdf prefix', async () => {
    const handled = [];
    const deps = {
      sessions: { appendConversation: async () => {} },
      handleMessage: async (ctx, text, path) => handled.push({ text, path }),
      bot: {},
      token: 'tok',
      download: async (_b, _t, fileId, prefix) => `/tmp/${prefix}-${fileId}.pdf`,
      metrics: { queueDepth: { set: () => {} } },
    };
    const fakeQueue = { add: (fn) => fn(), size: 0, pending: 0 };
    const ctx = {
      document: { fileId: 'd1', mimeType: 'application/pdf' },
      caption: '',
      from: { username: 'six' },
    };
    await enqueueAttachment(fakeQueue, ctx, 'pdf', deps);
    assert.equal(handled[0].path, '/tmp/pdf-d1.pdf');
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
node --test test/attachments.test.mjs
```
Expected: FAIL.

- [ ] **Step 3: Create `attachments.mjs`**

Create `.claude/bek/attachments.mjs`:

```js
function getPhotoFileId(photo) {
  // Current GramIO 0.9 exposes photo as an array of size variants.
  // If Task 0 diagnostics showed otherwise, adjust here.
  if (Array.isArray(photo)) return photo[photo.length - 1].fileId;
  if (photo?.bigSize?.fileId) return photo.bigSize.fileId;
  throw new Error('unknown photo payload shape');
}

export function enqueueAttachment(queue, ctx, kind, deps) {
  const { sessions, handleMessage, bot, token, download, metrics } = deps;
  const caption = ctx.caption ?? '';
  const speaker = ctx.from?.username ?? 'user';

  if (kind === 'image') {
    const fileId = ctx.photo ? getPhotoFileId(ctx.photo) : ctx.document.fileId;
    const promise = queue.add(async () => {
      await sessions.appendConversation(`[${speaker}]: [изображение] ${caption}`);
      const path = await download(bot, token, fileId, 'photo');
      const text = caption
        ? `[${speaker} прислал изображение с подписью: ${caption}]`
        : `[${speaker} прислал изображение]`;
      await handleMessage(ctx, text, path);
    });
    metrics.queueDepth.set((queue.size ?? 0) + (queue.pending ?? 0));
    return promise;
  }

  if (kind === 'pdf') {
    const fileId = ctx.document.fileId;
    const promise = queue.add(async () => {
      await sessions.appendConversation(`[${speaker}]: [PDF] ${caption}`);
      const path = await download(bot, token, fileId, 'pdf');
      const text = caption
        ? `[${speaker} прислал PDF с подписью: ${caption}]`
        : `[${speaker} прислал PDF]`;
      await handleMessage(ctx, text, path);
    });
    metrics.queueDepth.set((queue.size ?? 0) + (queue.pending ?? 0));
    return promise;
  }

  throw new Error(`Unknown attachment kind: ${kind}`);
}
```

- [ ] **Step 4: Run tests**

```bash
node --test test/attachments.test.mjs
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add .claude/bek/attachments.mjs .claude/bek/test/attachments.test.mjs
git commit -m "feat(bek): add attachments.mjs — unified image + pdf dispatch"
```

---

## Task 13: voice.mjs

**Files:**
- Create: `.claude/bek/voice.mjs`
- Test: none (hard to mock Whisper subprocess meaningfully; covered by smoke)

- [ ] **Step 1: Create `voice.mjs`**

Create `.claude/bek/voice.mjs`:

```js
import { transcribeVoice } from './whisper.mjs';

export function enqueueVoice(queue, ctx, deps) {
  const { sessions, handleMessage, bot, config, log, sanitize, metrics } = deps;
  const fileId = ctx.voice.fileId;
  const duration = ctx.voice.duration;
  const speaker = ctx.from?.username ?? 'user';

  const promise = queue.add(async () => {
    try {
      const audioBuffer = Buffer.from(await bot.downloadFile(fileId));
      const transcribed = await transcribeVoice(audioBuffer, {
        bin: config.whisper_bin,
        model: config.whisper_model,
      });
      await log(`[bek] voice transcribed (${duration}s) @${speaker}: "${transcribed}"`);
      await sessions.appendConversation(`[${speaker}]: [голосовое] ${transcribed}`);
      await handleMessage(ctx, `[${speaker} отправил голосовое: ${transcribed}]`);
    } catch (err) {
      await log(`[bek] voice handler error: ${err.message}`);
      await ctx.send(sanitize('Голосовое не распознал. Попробуй ещё раз.'));
    }
  });
  metrics.queueDepth.set((queue.size ?? 0) + (queue.pending ?? 0));
  return promise;
}
```

- [ ] **Step 2: Commit**

```bash
git add .claude/bek/voice.mjs
git commit -m "feat(bek): add voice.mjs — voice buffer → Whisper → handleMessage"
```

---

## Task 14: Wire daemon to use attachments + voice

**Goal:** Replace the ~100 LOC `bot.on('message')` dispatch in `bek-daemon.mjs` with thin delegation to `attachments.mjs` / `voice.mjs`.

**Files:**
- Modify: `.claude/bek/bek-daemon.mjs`

- [ ] **Step 1: Add imports**

Add to top of `bek-daemon.mjs`:

```js
import { enqueueAttachment } from './attachments.mjs';
import { enqueueVoice } from './voice.mjs';
```

- [ ] **Step 2: Replace `bot.on('message', ...)` body**

Replace the entire `bot.on('message', async (ctx) => { ... })` block with:

```js
bot.on('message', async (ctx) => {
  if (!await isLockedGroup(ctx.chat.id)) return;

  const username = ctx.from?.username ?? '';

  if (ctx.text) {
    const override = parseOverride(ctx.text, username);
    if (override) {
      if (!override.authorized) { await ctx.send(randomUnauthorizedResponse()); return; }
      await handleOverride(ctx, override.command, { queue, sessions, config, sanitize, log });
      return;
    }
    if (await sendQueueGuard(ctx)) return;
    queue.add(() => handleMessage(ctx, ctx.text));
    metrics.queueDepth.set(queue.size + queue.pending);
    return;
  }

  const attachmentDeps = {
    sessions,
    handleMessage,
    bot,
    token: config.telegram_token,
    download: downloadTelegramFile,
    metrics,
  };

  if (ctx.photo) {
    if (await sendQueueGuard(ctx)) return;
    await enqueueAttachment(queue, ctx, 'image', attachmentDeps);
    return;
  }

  if (ctx.document) {
    const mime = ctx.document.mimeType ?? '';
    if (mime.startsWith('image/')) {
      if (await sendQueueGuard(ctx)) return;
      await enqueueAttachment(queue, ctx, 'image', attachmentDeps);
      return;
    }
    if (mime === 'application/pdf') {
      if (await sendQueueGuard(ctx)) return;
      await enqueueAttachment(queue, ctx, 'pdf', attachmentDeps);
      return;
    }
    return;
  }

  if (ctx.voice) {
    if (await sendQueueGuard(ctx)) return;
    await enqueueVoice(queue, ctx, { sessions, handleMessage, bot, config, log, sanitize, metrics });
    return;
  }
});
```

- [ ] **Step 3: Run tests**

```bash
node --test test/*.test.mjs
```
Expected: all pass.

- [ ] **Step 4: Smoke — text, photo, pdf, voice**

```bash
pm2 restart quantumbek
```

From the group:
1. Send a text message. Expect a Russian reply.
2. Send a photo with caption. Expect BEK to describe the image.
3. Send a PDF. Expect acknowledgement / analysis.
4. Send a voice message. Expect transcription-aware reply.

Inspect `.claude/logs/bek-daemon.log` for errors. If any attachment path fails, revert and investigate `getPhotoFileId` using Task 0 findings.

- [ ] **Step 5: Commit**

```bash
git add .claude/bek/bek-daemon.mjs
git commit -m "refactor(bek): dispatch attachments via attachments.mjs + voice.mjs"
```

---

## Task 15: Summarizer diagnosis

**Goal:** Figure out why `conversation.md` (808 lines) is past the 120-line threshold without producing a `conversation-summary.md`. No fix yet.

**Files:**
- Modify (temp): `.claude/bek/bek-daemon.mjs`
- Modify (temp): `.claude/bek/session-manager.mjs`

- [ ] **Step 1: Add diagnostic logging in `summarizeIfNeeded`**

In `.claude/bek/session-manager.mjs`, inside `summarizeIfNeeded`, add `import { log } from './logger.mjs';` at the top if not present, and insert log lines:

```js
async summarizeIfNeeded(summarizeFn) {
  const full = await this.readConversation();
  const lines = full.split('\n').filter(l => l.trim());
  await log(`[summarizer] check — ${lines.length} lines, threshold ${SUMMARIZE_THRESHOLD}`);
  if (lines.length < SUMMARIZE_THRESHOLD) {
    await log(`[summarizer] skip — under threshold`);
    return;
  }
  const older = lines.slice(0, -TAIL_SIZE).join('\n');
  const tail  = lines.slice(-TAIL_SIZE).join('\n');
  await log(`[summarizer] compressing ${older.split('\n').length} lines`);
  let summaryText;
  try {
    summaryText = await summarizeFn(older);
  } catch (err) {
    await log(`[summarizer] FAILED — ${err.message}`);
    return;
  }
  await log(`[summarizer] captured ${summaryText?.length ?? 0} chars`);
  if (!summaryText || !summaryText.trim()) {
    await log(`[summarizer] SKIP WRITE — empty capture`);
    return;
  }
  // ...existing write logic unchanged
}
```

- [ ] **Step 2: Add diagnostic inside `summarizeConversation` (daemon)**

In `.claude/bek/bek-daemon.mjs`, wrap `summarizeConversation`:

```js
async function summarizeConversation(olderText) {
  let captured = '';
  await log(`[summarizer-claude] spawning — input ${olderText.length} chars`);
  try {
    await runClaude({
      claudeBin: config.claude_bin,
      workspacePath: config.workspace_path,
      sessionId: null,
      message: [
        /* unchanged prompt */
      ].join('\n'),
      timeoutMs: 60_000,
      env: process.env,
      onSessionId: () => {},
      onSignal: () => {},
      onText: (text) => { captured += text; },
    });
  } catch (err) {
    await log(`[summarizer-claude] THREW — ${err.message}`);
    throw err;
  }
  await log(`[summarizer-claude] completed — captured ${captured.length} chars`);
  return captured;
}
```

- [ ] **Step 3: Restart daemon**

```bash
pm2 restart quantumbek
```

- [ ] **Step 4: Trigger `summarizeIfNeeded` with current 808-line conversation**

Send any text message to the group. The daemon path calls `summarizeIfNeeded` on every incoming message (line ~192 in daemon). Wait for BEK to reply.

- [ ] **Step 5: Inspect log**

```bash
tail -100 .claude/logs/bek-daemon.log | grep summarizer
```

Record which path the logs show. Expected possible outcomes:
- `[summarizer] check — 808 lines`  followed by `[summarizer-claude] spawning` then either:
  - `[summarizer-claude] completed — captured 0 chars` → capture problem (onText never fires)
  - `[summarizer-claude] THREW` → Claude subprocess failed
  - `[summarizer-claude] completed — captured N chars` + no further write → stall between capture and file write
- `[summarizer] check — 808 lines` + no spawning message → path not reached; investigate

- [ ] **Step 6: Document root cause**

Write findings as one sentence to `.claude/bek/SOT.md` under a new `## Summarizer diagnostic (2026-04-24)` section. This will inform Task 16.

- [ ] **Step 7: Commit diagnostics**

```bash
git add .claude/bek/bek-daemon.mjs .claude/bek/session-manager.mjs .claude/bek/SOT.md
git commit -m "chore(bek): summarizer diagnostic logging + findings"
```

---

## Task 16: Summarizer fix + regression test

**Goal:** Apply the fix that Task 15 findings indicate. Replace `process.stderr.write` at the old session-manager:136 with `warn()` so future failures are visible. Add a regression test that reproduces the original failure against a fake summarize function.

**Files:**
- Modify: `.claude/bek/session-manager.mjs` and/or `.claude/bek/bek-daemon.mjs` (root-cause dependent)
- Modify: `.claude/bek/test/session-manager.test.mjs`

- [ ] **Step 1: Replace stderr swallow with warn**

In `.claude/bek/session-manager.mjs`, the `catch (err)` block in `summarizeIfNeeded` currently uses `process.stderr.write`. Replace with `await warn('[summarizer] failed: ' + err.message);` and import `warn` from `./logger.mjs`.

- [ ] **Step 2: Apply root-cause fix**

Based on Task 15 findings, apply the smallest targeted fix. Possible cases:

**If Claude timed out (60_000 ms):** bump `timeoutMs` to 120_000 in `summarizeConversation`, and add a guard: if conversation older text > 30 KB, truncate older to last 30 KB (tail-biased) before feeding.

**If `captured === 0`:** the `onText` callback is not receiving text. Verify `runClaude` invokes `onText` on non-signal text blocks. If needed, change summarizer prompt to include a sentinel (`SUMMARY_START`…`SUMMARY_END`) and capture the block.

**If the subprocess threw:** inspect error; most likely Claude CLI version/arg mismatch. Fix the offending arg.

**If never called:** investigate why — possibly `summarizeIfNeeded` is only called on user messages but the daemon crashed before reaching it. In that case no code fix is needed; add a note in SOT.md.

- [ ] **Step 3: Add regression test**

In `.claude/bek/test/session-manager.test.mjs`, extend the `summarizeIfNeeded` describe block with one new test that specifically reproduces the production scenario — a 200-line existing conversation with a non-empty summarize function:

```js
it('end-to-end summarize with realistic conversation produces summary file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bek-summ-e2e-'));
  const sm = new SessionManager(dir);
  const bulk = Array.from({ length: 200 }, (_, i) => `[2026-04-${20 + (i % 5)}] turn ${i + 1}`).join('\n');
  await sm.appendConversation(bulk);

  let receivedText = '';
  await sm.summarizeIfNeeded(async (text) => {
    receivedText = text;
    return 'A realistic summary of earlier turns.';
  });

  assert.ok(receivedText.includes('turn 1'));
  const summary = await readFile(join(dir, 'active', 'conversation-summary.md'), 'utf8');
  assert.ok(summary.includes('A realistic summary'));
  const tail = await sm.readConversation();
  const tailLines = tail.split('\n').filter(l => l.trim());
  assert.ok(tailLines.length <= 40);
  await rm(dir, { recursive: true, force: true });
});
```

- [ ] **Step 4: Run tests**

```bash
node --test test/*.test.mjs
```
Expected: all pass, including the new test.

- [ ] **Step 5: Real-world verification**

```bash
pm2 restart quantumbek
```
Send a text message (this triggers the path). In the logs, confirm either:
- Summarizer fires and writes `conversation-summary.md`, or
- Summarizer is no longer silent about failure (warn lines appear).

- [ ] **Step 6: Commit**

```bash
git add .claude/bek/session-manager.mjs .claude/bek/bek-daemon.mjs .claude/bek/test/session-manager.test.mjs
git commit -m "fix(bek): summarizer reliability — warn on failure, regression test, root-cause fix"
```

---

## Task 17: Delete watchdog subsystem

**Files:**
- Delete: `.claude/bek/watchdog.mjs`
- Delete: `.claude/bek/healer-prompt.mjs`
- Modify: `.claude/bek/ecosystem.config.cjs`

- [ ] **Step 1: Stop the watchdog PM2 app**

```bash
pm2 stop bek-watchdog || true
pm2 delete bek-watchdog || true
```

- [ ] **Step 2: Edit `ecosystem.config.cjs`**

Open `.claude/bek/ecosystem.config.cjs`. Delete the second app object (the one named `bek-watchdog`), leaving only the `quantumbek` app entry. Final file:

```js
module.exports = {
  apps: [
    {
      name: 'quantumbek',
      script: '.claude/bek/bek-daemon.mjs',
      cwd: 'D:/dev2/projects/provodnik',
      interpreter: 'node',
      watch: false,
      autorestart: true,
      max_restarts: 20,
      min_uptime: '10s',
      restart_delay: 62000,
      out_file: '.claude/logs/bek-daemon.log',
      error_file: '.claude/logs/bek-daemon-error.log',
      time: true,
      env: { NODE_ENV: 'production' },
    },
  ],
};
```

- [ ] **Step 3: Delete watchdog files**

```bash
rm .claude/bek/watchdog.mjs
rm .claude/bek/healer-prompt.mjs
```

- [ ] **Step 4: Sanity-check PM2 status**

```bash
pm2 list
```
Expected: only `quantumbek` running. No `bek-watchdog`.

- [ ] **Step 5: Run tests**

```bash
cd .claude/bek && node --test test/*.test.mjs
```
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add .claude/bek/ecosystem.config.cjs
git rm .claude/bek/watchdog.mjs .claude/bek/healer-prompt.mjs
git commit -m "chore(bek): delete watchdog subsystem — cannot fire since EXECUTING state removal"
```

---

## Task 18: Update bek.config.template.json

**Files:**
- Modify: `.claude/bek/bek.config.template.json`

- [ ] **Step 1: Add new keys**

Replace `.claude/bek/bek.config.template.json` contents with:

```json
{
  "telegram_token": "BOT_TOKEN_HERE",
  "group_id": null,
  "admin_username": "YOUR_TELEGRAM_USERNAME",
  "workspace_path": "D:\\path\\to\\provodnik",
  "claude_bin": "claude",
  "sessions_path": "D:\\path\\to\\provodnik\\.claude\\bek-sessions",
  "whisper_bin": "whisper",
  "whisper_model": "large-v3-turbo",
  "claude_timeout_ms": 1500000,
  "stream_gap_reset_ms": 90000,
  "stream_max": 3800,
  "telegram_max": 4000,
  "max_queue_depth": 4,
  "memory_inject_tail": 30,
  "memory_rotate_threshold": 80,
  "supabase_management_token": "sbp_YOUR_PERSONAL_ACCESS_TOKEN",
  "supabase_project_ref": "YOUR_PROJECT_REF"
}
```

- [ ] **Step 2: Verify local bek.config.json unchanged**

`.claude/bek/bek.config.json` is gitignored and should not be edited. Confirm daemon still loads — all new keys have defaults, so missing ones will be filled by `loadConfig`.

- [ ] **Step 3: Commit**

```bash
git add .claude/bek/bek.config.template.json
git commit -m "docs(bek): update config template — new keys with documented defaults"
```

---

## Task 19: Rewrite SOT.md

**Files:**
- Modify: `.claude/bek/SOT.md`

- [ ] **Step 1: Rewrite `SOT.md`**

Replace `.claude/bek/SOT.md` contents with:

```markdown
# QuantumBEK — Source of Truth

QuantumBEK is a Telegram bot daemon that wraps the Claude CLI. It accepts messages from an authorized Telegram group, forwards them to Claude, and streams replies back. It also handles images, PDFs, voice messages (via local Whisper), and override commands.

**PM2 process:** `quantumbek` (daemon)
**Start:** `pm2 start .claude/bek/ecosystem.config.cjs`
**Restart:** `pm2 restart quantumbek`
**Logs:** `.claude/logs/bek-daemon.log` / `.claude/logs/bek-daemon-error.log`

---

## Source Files

### Entry
- `bek-daemon.mjs` — wiring only: config load, Bot setup, `bot.on('message')` dispatch by attachment type, crash recovery, launch/shutdown.

### Cross-cutting
- `logger.mjs` — shared `log()` + `warn()` (direct file append, survives PM2 Windows stdout loss).
- `config.mjs` — `loadConfig()` applies defaults; `writeGroupLock()` persists the auto-locked `group_id`.
- `metrics.mjs` — thin wrapper over `@pm2/io` for queue depth, session state, errors, learns, latency.
- `telegram-helpers.mjs` — `withTyping`, `setReaction`, `downloadTelegramFile`, `makeStreamer`, `chunkText`.

### Message flow
- `attachments.mjs` — `enqueueAttachment(queue, ctx, kind, deps)` for `image` and `pdf`.
- `voice.mjs` — `enqueueVoice(queue, ctx, deps)` — downloads buffer, runs Whisper, delegates to `handleMessage`.
- `commands.mjs` — `parseOverride` + `randomUnauthorizedResponse` + `handleOverride` for `/pause /abort /plan /status /execute /done`.

### Claude
- `claude-runner.mjs` — subprocess wrapper; spawns `claude --output-format stream-json`, parses NDJSON, emits signals via `parseSignals`.
- `system-prompt.mjs` — BEK identity + `buildFirstPrompt` + `buildContinuationPrompt` + `renderContextBlocks`.

### Persistence
- `session-manager.mjs` — session.json, conversation.md, active-file reads, archive, summarizer trigger.
- `memory.mjs` — `memory.md` (tagged sections) + `memory-archive.md`; `readMemory({tail})`, `appendMemory(entry, {rotateThreshold})`.

### Content filters + I/O
- `sanitizer.mjs` — strip model/tool/path names from outgoing text.
- `whisper.mjs` — local Whisper CLI wrapper for voice STT.

### Config
- `bek.config.json` — runtime secrets (gitignored).
- `bek.config.template.json` — template with documented defaults.
- `ecosystem.config.cjs` — PM2 config (single app: `quantumbek`).

---

## Runtime Data

- `.claude/bek-sessions/active/session.json` — active session state (IDLE | BRAINSTORMING | PLAN_READY).
- `.claude/bek-sessions/active/conversation.md` — transcript of the current session (auto-summarized at 120 lines, tail kept at 40).
- `.claude/bek-sessions/active/conversation-summary.md` — appended summary block per compaction.
- `.claude/bek-sessions/active/plan.md` — full plan authored by BEK.
- `.claude/bek-sessions/active/checkpoints.json` — phase progress.
- `.claude/bek-sessions/active/brief.md` — orchestrator-injected one-shot context; consumed + deleted on first read.
- `.claude/bek-sessions/memory.md` — LEARN memory, grouped by `## Tag` sections.
- `.claude/bek-sessions/memory-archive.md` — rotated old memory (created when total entries > 80).
- `.claude/bek-sessions/archive/` — completed sessions, each in a timestamped subdirectory.

## Signal Protocol

Claude emits signals as plain text lines; `claude-runner.mjs:parseSignals` extracts them:

| Signal | Form | Effect |
|---|---|---|
| `TELEGRAM: text` / `TELEGRAM_START…TELEGRAM_END` | inline or block | Streamed to group (edit-in-place) |
| `STATE: value` | inline | Updates session.json state |
| `LEARN: [tag] text` / `LEARN_START…LEARN_END` | inline or block | Appended to memory.md under `## Tag` |
| `ARCHIVE_SESSION` | inline | Archives active session, resets to IDLE |

Continuation prompts include `[REMINDER: You are BEK. Every message MUST start with "TELEGRAM: ".]`

## Known Behavior

- **Summarizer blocks the queue.** `summarizeIfNeeded` runs inline in `handleMessage` via `await`. With queue concurrency=1, the next message blocks for up to ~60s during summarization. Out of scope for the 2026-04-24 simplification pass.
- **Group ID auto-locks** on first message. Stored back to `bek.config.json` via `writeGroupLock`.
- **Photo payload shape** — daemon uses array indexing on `ctx.photo` (`photo[photo.length-1].fileId`). If a future GramIO update changes this to a size-variant object, update `attachments.mjs:getPhotoFileId`.

## Tests

All in `.claude/bek/test/`. Run with `node --test test/*.test.mjs` from `.claude/bek/`.

| File | Covers |
|---|---|
| `sanitizer.test.mjs` | brand/tool/path stripping |
| `timeout-error.test.mjs` | `isBekTimeout` flag + Russian messages |
| `whisper.test.mjs` | `transcribeVoice` error paths |
| `session-manager.test.mjs` | session CRUD + summarizer end-to-end |
| `config.test.mjs` | defaults applied; group-lock write |
| `telegram-helpers.test.mjs` | `chunkText`, streamer |
| `commands.test.mjs` | `parseOverride` auth + `handleOverride` dispatch |
| `attachments.test.mjs` | image + pdf dispatch |
| `memory.test.mjs` | tag parsing + rotation + tail read |
```

- [ ] **Step 2: Commit**

```bash
git add .claude/bek/SOT.md
git commit -m "docs(bek): rewrite SOT.md for simplified layout"
```

---

## Task 20: Full test run + manual smoke

**Files:** none (verification task).

- [ ] **Step 1: Full test suite**

```bash
cd D:/dev2/projects/provodnik/.claude/bek
node --test test/*.test.mjs
```
Expected: all tests pass. If any fail, fix before proceeding.

- [ ] **Step 2: Restart daemon**

```bash
pm2 restart quantumbek
pm2 logs quantumbek --lines 20
```
Expected: `[bek] QuantumBEK online. Polling Telegram.` — no startup errors.

- [ ] **Step 3: Smoke checklist** (from Telegram group)

| Action | Expected |
|---|---|
| Send text message | 👀 reaction, typing indicator, Russian reply, ✅ reaction |
| Send photo with caption | Image described, specific follow-ups asked |
| Send PDF | Acknowledgement / summary |
| Send voice message | Transcription, then relevant reply |
| `/status` from CarbonS8 | Russian status label |
| `/status` from non-CarbonS8 | Sarcastic denial |
| `/plan` from CarbonS8 | Latest plan contents |
| `/done` from CarbonS8 | Session archived, "Сессия закрыта" reply |
| Long reply (>3800 chars) | Splits into multiple messages |

If any smoke test fails, revert the latest task commit, investigate, re-fix.

- [ ] **Step 4: Line-count verification**

```bash
wc -l .claude/bek/*.mjs
```
Expected output shape (approximate):
```
  ~120 bek-daemon.mjs
   ~40 config.mjs
   ~60 telegram-helpers.mjs
   ~60 attachments.mjs
   ~30 voice.mjs
   ~80 commands.mjs
  ~100 memory.mjs
   ~40 metrics.mjs
   ~30 logger.mjs
   ~160 claude-runner.mjs
   ~180 session-manager.mjs
   ~180 system-prompt.mjs
    ~48 whisper.mjs
    ~47 sanitizer.mjs
 ~1175 total
```
Target: under 1200 total; `bek-daemon.mjs` under 150; no single file over 200.

- [ ] **Step 5: Final commit (empty, tagged)**

```bash
git commit --allow-empty -m "chore(bek): simplification complete — tasks 0-20 done"
git tag bek-simplified-2026-04-24
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Task(s) |
|---|---|
| §3 delete watchdog + healer + override-handler + ecosystem entry | 7 (override), 17 (watchdog/healer/ecosystem) |
| §4 new file layout (logger, config, metrics, telegram-helpers, attachments, voice, commands, memory) | 1, 2, 3, 4, 6, 8, 12, 13 |
| §5 `config.mjs` interface + defaults | 2 |
| §5 `logger.mjs` interface | 1 |
| §5 `telegram-helpers.mjs` interface | 4 |
| §5 `attachments.mjs` interface (image + pdf only) | 12 |
| §5 `voice.mjs` interface | 13 |
| §5 `commands.mjs` interface (parse + dispatch + responses) | 6 |
| §5 `memory.mjs` interface (tagged, tail, rotation) | 8 |
| §5 `metrics.mjs` interface | 3 |
| §5 `session-manager.mjs` changes (remove memory ops, add readPlan) | 9 |
| §5 `system-prompt.mjs` refactor (renderContextBlocks + LEARN tag paragraph) | 10, 11 |
| §6 dedup map (all rows) | 4, 5, 6, 7, 10, 12 |
| §7 LEARN memory (1+3+freeform 4) | 8, 9, 11 |
| §8 summarizer diagnose + fix + regression test | 15, 16 |
| §9 tests preserved + extended + added | each task that needs one has it |
| §10 delivery artifacts (template, ecosystem, SOT.md) | 17, 18, 19 |
| §11 rollout order | tasks 0-20 follow this order |
| §12 GramIO verification | Task 0 + inline notes in Task 12 |

No gaps found.

**Placeholder scan:** none. All code blocks are complete. All commands are exact. All file paths are absolute or project-relative.

**Type consistency:** `handleOverride` signature `(ctx, command, { queue, sessions, config, sanitize, log })` is consistent across Tasks 6, 7, 9, 14. `enqueueAttachment(queue, ctx, kind, deps)` consistent across Tasks 12 and 14. `readMemory(sessionsPath, { tail })` and `appendMemory(sessionsPath, entry, { rotateThreshold })` consistent across Tasks 8, 9. `makeStreamer(bot, chatId, { gapMs, streamMax })` consistent across Tasks 4, 5.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-24-bek-simplification.md`.

**Execution options (project-local context):**

1. **cursor-agent dispatch (primary per `.claude/CLAUDE.md`)** — compose one prompt per task from `.claude/prompts/skeleton.md`, dispatch via `node .claude/logs/cursor-dispatch.mjs` with `--workspace "D:\\dev2\\projects\\provodnik"`. Tasks 0, 15, 20 are verification-only — run those inline, not via cursor-agent.

2. **Inline execution** — execute task-by-task in this session using `superpowers:executing-plans`.

3. **Subagent-driven** — dispatch fresh native Agent per task with `superpowers:subagent-driven-development`. Not recommended for this project per §7 of `~/.claude/CLAUDE.md`.

Which approach?
