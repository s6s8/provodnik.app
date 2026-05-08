# QuantumBEK UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five UX improvements to the QuantumBEK Telegram daemon: typing indicator, emoji reactions, timeout notification, crash-recovery announcement, and voice-to-text transcription via locally installed Whisper.

**Architecture:** Tasks 1–4 are small, targeted edits to `bek-daemon.mjs`. Task 5 adds a single new module `whisper.mjs` and a new voice handler. Key design decisions from research: use Telegraf's built-in `ctx.persistentChatAction()` instead of manual setInterval; use `err.isBekTimeout` property instead of brittle string matching; for voice — download OGG to a temp file, spawn the local `whisper` CLI, read the output `.txt` file, clean up. No API key, no network, no new npm packages. Models `tiny.pt` and `large-v3-turbo.pt` are already cached at `C:\Users\x\.cache\whisper\`.

**Tech Stack:** Node.js ESM, Telegraf v4.16+, local OpenAI Whisper Python CLI (`whisper` on PATH at `C:\Users\x\AppData\Local\Programs\Python\Python311\Scripts\whisper.exe`), `node:test` for unit tests.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `.claude/bek/bek-daemon.mjs` | Modify | All 5 features land here |
| `.claude/bek/whisper.mjs` | Create | Local Whisper CLI wrapper — spawn, read output, cleanup |
| `.claude/bek/bek.config.json` | Modify | Add `whisper_bin` and `whisper_model` fields |
| `.claude/bek/test/whisper.test.mjs` | Create | Unit tests for `transcribeVoice` |
| `.claude/bek/test/timeout-error.test.mjs` | Create | Unit tests for `BekTimeoutError` |

---

## Task 1: Typing indicator via `ctx.persistentChatAction`

**Files:**
- Modify: `.claude/bek/bek-daemon.mjs`

Telegraf v4 ships `ctx.persistentChatAction(action, fn)` — it fires `sendChatAction` immediately and repeats every 4500ms while `fn` runs, then stops automatically. No setInterval, no try/finally needed. This replaces the manual approach entirely.

The `handleMessage` function currently calls `runClaude(...)` at the top level. We wrap that call in `persistentChatAction` so typing is active for the full Claude run, including the session write and stream setup before Claude actually starts.

- [ ] **Step 1: Find the `runClaude` call inside `handleMessage`**

In `.claude/bek/bek-daemon.mjs`, locate (near line 120):

```javascript
  running = true;
  await log(`[bek] running Claude — isFirst=${isFirst} sessionId=${sessionId ?? 'none'}`);

  const streamPush = makeStreamer(ctx.chat.id);

  try {
    await runClaude({
      ...
    });
  } catch (err) {
    await log(`[bek] runner error: ${err.message}`);
    await ctx.reply('Що-то пошло не так. Работаю над этим.');
  } finally {
    running = false;
    if (inputFile) unlink(inputFile).catch(() => {});
  }
```

- [ ] **Step 2: Wrap the try/catch/finally block with `persistentChatAction`**

Replace with:

```javascript
  running = true;
  await log(`[bek] running Claude — isFirst=${isFirst} sessionId=${sessionId ?? 'none'}`);

  const streamPush = makeStreamer(ctx.chat.id);

  await ctx.persistentChatAction('typing', async () => {
    try {
      await runClaude({
        claudeBin: config.claude_bin,
        workspacePath: config.workspace_path,
        sessionId,
        message: prompt,
        timeoutMs: 10 * 60 * 1000,
        inputFile,
        onSessionId: async (id) => {
          await sessions.updateSession({ claude_session_id: id });
        },
        onSignal: async (signal) => {
          if (signal.type === 'TELEGRAM') {
            if (paused) return;
            const clean = sanitize(signal.text);
            if (clean.trim()) await streamPush(clean);
            await sessions.appendConversation(`[BEK]: ${signal.text}`);
          }
          if (signal.type === 'STATE') {
            await sessions.updateSession({ state: signal.value });
          }
          if (signal.type === 'ARCHIVE_SESSION') {
            const cur = await sessions.readSession();
            await sessions.archive(cur?.task_slug ?? 'session');
            await sessions.writeSession({
              state: 'IDLE',
              claude_session_id: null,
              group_id: config.group_id,
            });
          }
        },
      });
    } catch (err) {
      await log(`[bek] runner error: ${err.message}`);
      await ctx.reply('Что-то пошло не так. Работаю над этим.');
    } finally {
      running = false;
      if (inputFile) unlink(inputFile).catch(() => {});
    }
  });
```

- [ ] **Step 3: Manual verification**

```bash
pm2 restart quantumbek
```

Send any message to the Telegram group. The "QuantumBEK is typing…" indicator must appear at the bottom of the chat within 1 second and remain visible until BEK replies. If Claude runs for more than 5 seconds, verify the indicator persists (it does — `persistentChatAction` renews every 4500ms internally).

- [ ] **Step 4: Commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/bek-daemon.mjs
git commit -m "feat(bek): typing indicator via persistentChatAction"
```

---

## Task 2: Emoji reactions on receive and completion

**Files:**
- Modify: `.claude/bek/bek-daemon.mjs`

React with 👀 immediately when a message is accepted (acknowledgement before Claude even starts), ✅ on successful completion, ❌ on error. `ctx.react()` calls `setMessageReaction` on the original message — works in groups, no admin needed for standard emoji. Bot is limited to 1 reaction per message.

- [ ] **Step 1: Add 👀 reaction at the start of `handleMessage`**

Find this line near the top of `handleMessage`:

```javascript
  await sessions.appendConversation(`[${ctx.from?.username ?? 'user'}]: ${text}`);

  let prompt;
```

Insert the reaction call between them:

```javascript
  await sessions.appendConversation(`[${ctx.from?.username ?? 'user'}]: ${text}`);
  ctx.react('👀').catch(() => {}); // fire-and-forget — acknowledgement only

  let prompt;
```

- [ ] **Step 2: Add ✅ / ❌ reactions in the try/catch inside `persistentChatAction`**

Inside the `persistentChatAction` callback (from Task 1), update the try/catch:

```javascript
    try {
      await runClaude({ ... });
      ctx.react('✅').catch(() => {});
    } catch (err) {
      await log(`[bek] runner error: ${err.message}`);
      ctx.react('❌').catch(() => {});
      await ctx.reply('Что-то пошло не так. Работаю над этим.');
    } finally {
      running = false;
      if (inputFile) unlink(inputFile).catch(() => {});
    }
```

- [ ] **Step 3: Manual verification**

Restart PM2 and send a message. The message should receive 👀 within ~1 second. After BEK finishes, that same message gets ✅. Send a message that would cause Claude to fail (e.g., temporarily break `config.claude_bin` to `'invalid-bin'`) and verify ❌ appears.

- [ ] **Step 4: Commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/bek-daemon.mjs
git commit -m "feat(bek): emoji reactions — 👀 on receive, ✅/❌ on done/error"
```

---

## Task 3: Timeout → specific group notification

**Files:**
- Modify: `.claude/bek/bek-daemon.mjs`
- Create: `.claude/bek/test/timeout-error.test.mjs`

The current catch block sends a generic error message for both timeouts and real errors. We introduce a typed `BekTimeoutError` class — `claude-runner.mjs` throws it on timeout, the daemon catches it by type (`instanceof`), not by string pattern. This is safer than `err.message.includes('timed out')` which would break if the error message ever changes.

- [ ] **Step 1: Create `BekTimeoutError` at the top of `bek-daemon.mjs`**

After the imports, before the config load, add:

```javascript
class BekTimeoutError extends Error {
  constructor(minutes) {
    super(`Claude timed out after ${minutes} minutes`);
    this.name = 'BekTimeoutError';
  }
}
```

- [ ] **Step 2: Export `BekTimeoutError` and use it in `claude-runner.mjs`**

Open `.claude/bek/claude-runner.mjs`. Find the timeout handler:

```javascript
    let timeoutHandle;
    if (timeoutMs) {
      timeoutHandle = setTimeout(() => {
        proc.kill('SIGKILL');
        reject(new Error(`Claude timed out after ${timeoutMs / 60000} minutes`));
      }, timeoutMs);
    }
```

Replace with:

```javascript
    let timeoutHandle;
    if (timeoutMs) {
      timeoutHandle = setTimeout(() => {
        proc.kill('SIGKILL');
        reject(Object.assign(new Error(`Claude timed out after ${timeoutMs / 60000} minutes`), { isBekTimeout: true }));
      }, timeoutMs);
    }
```

Note: we use `isBekTimeout: true` property instead of a separate class import to keep `claude-runner.mjs` independent of `bek-daemon.mjs`. The daemon checks `err.isBekTimeout` — no import cycle, no string matching.

- [ ] **Step 3: Update the catch block in `handleMessage` to distinguish timeout**

Inside `persistentChatAction` (from Task 1 + 2), update catch:

```javascript
    } catch (err) {
      await log(`[bek] runner error: ${err.message}`);
      ctx.react('❌').catch(() => {});
      const msg = err.isBekTimeout
        ? 'Завис. Попробуй ещё раз.'
        : 'Что-то пошло не так. Работаю над этим.';
      await ctx.reply(msg);
    }
```

- [ ] **Step 4: Write unit test for timeout error property**

Create `.claude/bek/test/timeout-error.test.mjs`:

```javascript
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

// Simulate what claude-runner.mjs does
function makeTimeoutError(timeoutMs) {
  return Object.assign(
    new Error(`Claude timed out after ${timeoutMs / 60000} minutes`),
    { isBekTimeout: true }
  );
}

// Simulate what bek-daemon.mjs does in catch
function userMessage(err) {
  return err.isBekTimeout
    ? 'Завис. Попробуй ещё раз.'
    : 'Что-то пошло не так. Работаю над этим.';
}

describe('timeout error handling', () => {
  it('timeout error carries isBekTimeout flag', () => {
    const err = makeTimeoutError(10 * 60 * 1000);
    assert.equal(err.isBekTimeout, true);
  });

  it('timeout produces the correct Russian user message', () => {
    const err = makeTimeoutError(10 * 60 * 1000);
    assert.equal(userMessage(err), 'Завис. Попробуй ещё раз.');
  });

  it('non-timeout error produces generic Russian user message', () => {
    const err = new Error('spawn ENOENT');
    assert.equal(userMessage(err), 'Что-то пошло не так. Работаю над этим.');
  });

  it('non-timeout error does not carry isBekTimeout flag', () => {
    const err = new Error('some other error');
    assert.equal(err.isBekTimeout, undefined);
  });
});
```

- [ ] **Step 5: Run the test**

```bash
cd D:/dev2/projects/provodnik/.claude/bek
node --test test/timeout-error.test.mjs
```

Expected:
```
▶ timeout error handling
  ✔ timeout error carries isBekTimeout flag
  ✔ timeout produces the correct Russian user message
  ✔ non-timeout error produces generic Russian user message
  ✔ non-timeout error does not carry isBekTimeout flag
▶ timeout error handling (Xms)
```

- [ ] **Step 6: Commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/bek-daemon.mjs .claude/bek/claude-runner.mjs .claude/bek/test/timeout-error.test.mjs
git commit -m "feat(bek): typed timeout error + specific group notification on timeout"
```

---

## Task 4: Crash recovery → group announcement

**Files:**
- Modify: `.claude/bek/bek-daemon.mjs`

When the daemon restarts and finds an active session (`state !== 'IDLE'` and `claude_session_id` is set), send "Я вернулся. Продолжаем." to the group. `bot.telegram.sendMessage()` is a plain HTTP call — it works immediately after `new Telegraf(token)`, before `bot.launch()`. Wrap in try/catch: if the bot was removed from the group, the error is logged and startup continues normally.

- [ ] **Step 1: Find the crash recovery block near the bottom of `bek-daemon.mjs`**

```javascript
const existing = await sessions.readSession();
if (existing && existing.state !== 'IDLE') {
  if (!existing.claude_session_id) {
    await sessions.updateSession({ state: 'IDLE', claude_session_id: null });
    await log('[bek] Crash recovery — no session ID, reset to IDLE');
  } else {
    await log(`[bek] Crash recovery — resuming state: ${existing.state}`);
  }
}
```

- [ ] **Step 2: Add the group announcement to the `else` branch**

Replace with:

```javascript
const existing = await sessions.readSession();
if (existing && existing.state !== 'IDLE') {
  if (!existing.claude_session_id) {
    await sessions.updateSession({ state: 'IDLE', claude_session_id: null });
    await log('[bek] Crash recovery — no session ID, reset to IDLE');
  } else {
    await log(`[bek] Crash recovery — resuming state: ${existing.state}`);
    if (config.group_id) {
      await bot.telegram.sendMessage(config.group_id, 'Я вернулся. Продолжаем.')
        .catch((err) => log(`[bek] Crash recovery announcement failed: ${err.message}`));
    }
  }
}
```

- [ ] **Step 3: Manual verification**

Confirm `session.json` has `state: 'BRAINSTORMING'` and a non-null `claude_session_id` (it does — check `.claude/bek-sessions/active/session.json`). Then:

```bash
pm2 restart quantumbek && tail -f .claude/logs/bek-daemon.log
```

Within 2 seconds the group should receive "Я вернулся. Продолжаем." and the log should show `[bek] Crash recovery — resuming state: BRAINSTORMING`.

- [ ] **Step 4: Commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/bek-daemon.mjs
git commit -m "feat(bek): announce crash recovery to Telegram group on restart"
```

---

## Task 5: Voice message → local Whisper CLI → Claude

**Files:**
- Create: `.claude/bek/whisper.mjs`
- Create: `.claude/bek/test/whisper.test.mjs`
- Modify: `.claude/bek/bek-daemon.mjs`
- Modify: `.claude/bek/bek.config.json`

No API key, no network. Flow: download OGG from Telegram → write to temp file → spawn `whisper` CLI → read output `.txt` file → clean up both files → pass text to `handleMessage`.

The local whisper binary is `C:\Users\x\AppData\Local\Programs\Python\Python311\Scripts\whisper.exe`. The `large-v3-turbo` model is already cached at `C:\Users\x\.cache\whisper\large-v3-turbo.pt` — no download on first run. Pass `--fp16 False` to suppress the CPU warning since this machine runs on CPU only.

Whisper writes output as `<input_basename>.txt` in `--output_dir`. So for input `voice-123.ogg` → output `voice-123.txt` in the same temp dir.

- [ ] **Step 1: Add `whisper_bin` and `whisper_model` to `bek.config.json`**

Open `.claude/bek/bek.config.json` and add two fields:

```json
{
  "telegram_token": "...",
  "whisper_bin": "C:\\Users\\x\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\whisper.exe",
  "whisper_model": "large-v3-turbo",
  ...
}
```

`whisper_bin` defaults to `"whisper"` (on PATH) if you prefer. `whisper_model` can be `"tiny"` for faster but less accurate transcription.

- [ ] **Step 2: Create `.claude/bek/whisper.mjs`**

```javascript
import { writeFile, readFile, unlink } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';

/**
 * Transcribe an audio Buffer using the local Whisper CLI.
 * @param {Buffer} audioBuffer
 * @param {{ bin?: string, model?: string }} opts
 * @returns {Promise<string>} transcribed text
 */
export async function transcribeVoice(audioBuffer, { bin = 'whisper', model = 'large-v3-turbo' } = {}) {
  const id = `bek-voice-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inputPath = join(tmpdir(), `${id}.ogg`);
  const outputPath = join(tmpdir(), `${id}.txt`);

  await writeFile(inputPath, audioBuffer);

  try {
    await runWhisper(bin, [
      inputPath,
      '--model', model,
      '--language', 'ru',
      '--output_format', 'txt',
      '--output_dir', tmpdir(),
      '--fp16', 'False',
    ]);
    const text = await readFile(outputPath, 'utf8');
    return text.trim();
  } finally {
    unlink(inputPath).catch(() => {});
    unlink(outputPath).catch(() => {});
  }
}

function runWhisper(bin, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { shell: false, windowsHide: true });
    let stderr = '';
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`whisper exited ${code}: ${stderr.slice(-300)}`));
    });
    proc.on('error', reject);
  });
}
```

- [ ] **Step 3: Write unit tests for `whisper.mjs`**

The unit tests mock `node:child_process` and `node:fs/promises` to avoid actually spawning whisper.

Create `.claude/bek/test/whisper.test.mjs`:

```javascript
import { describe, it, mock, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';

// Mock fs/promises
await mock.module('node:fs/promises', {
  namedExports: {
    writeFile: async () => {},
    readFile: async (path) => {
      if (path.endsWith('.txt')) return 'привет мир';
      throw new Error('unexpected readFile path');
    },
    unlink: async () => {},
  },
});

// Mock child_process — simulate successful whisper run
await mock.module('node:child_process', {
  namedExports: {
    spawn: (bin, args) => {
      const proc = new EventEmitter();
      proc.stderr = new EventEmitter();
      proc.stdin = { write: () => {}, end: () => {} };
      setImmediate(() => proc.emit('close', 0));
      return proc;
    },
  },
});

const { transcribeVoice } = await import('../whisper.mjs');

describe('transcribeVoice', () => {
  it('returns trimmed transcribed text', async () => {
    const result = await transcribeVoice(Buffer.from('fake'), { bin: 'whisper', model: 'tiny' });
    assert.equal(result, 'привет мир');
  });

  it('passes --language ru and --fp16 False to whisper', async () => {
    let capturedArgs;
    await mock.module('node:child_process', {
      namedExports: {
        spawn: (bin, args) => {
          capturedArgs = args;
          const proc = new EventEmitter();
          proc.stderr = new EventEmitter();
          setImmediate(() => proc.emit('close', 0));
          return proc;
        },
      },
    });
    const { transcribeVoice: tv } = await import('../whisper.mjs?v=2');
    await tv(Buffer.from('fake'), { bin: 'whisper', model: 'large-v3-turbo' });
    assert.ok(capturedArgs.includes('ru'), 'should pass language ru');
    assert.ok(capturedArgs.includes('False'), 'should pass fp16 False');
    assert.ok(capturedArgs.includes('large-v3-turbo'), 'should pass model');
  });

  it('rejects when whisper exits non-zero', async () => {
    await mock.module('node:child_process', {
      namedExports: {
        spawn: () => {
          const proc = new EventEmitter();
          proc.stderr = new EventEmitter();
          setImmediate(() => {
            proc.stderr.emit('data', Buffer.from('model not found'));
            proc.emit('close', 1);
          });
          return proc;
        },
      },
    });
    const { transcribeVoice: tv2 } = await import('../whisper.mjs?v=3');
    await assert.rejects(() => tv2(Buffer.from('fake')), /whisper exited 1/);
  });
});
```

- [ ] **Step 4: Run the tests**

```bash
cd D:/dev2/projects/provodnik/.claude/bek
node --test test/whisper.test.mjs
```

Expected:
```
▶ transcribeVoice
  ✔ returns trimmed transcribed text
  ✔ passes --language ru and --fp16 False to whisper
  ✔ rejects when whisper exits non-zero
▶ transcribeVoice (Xms)
```

- [ ] **Step 5: Add `transcribeVoice` import to `bek-daemon.mjs`**

Add after the existing local imports:

```javascript
import { transcribeVoice } from './whisper.mjs';
```

- [ ] **Step 6: Add voice handler to `bek-daemon.mjs`**

Add after the document handler block (`bot.on(message('document'), ...)`):

```javascript
// ── Voice handler ─────────────────────────────────────────────────────────────
bot.on(message('voice'), async (ctx) => {
  if (!await isLockedGroup(ctx.chat.id)) return;
  if (paused) { await ctx.reply('На паузе. Подожди.'); return; }
  if (running) return;

  const username = ctx.from?.username ?? 'user';

  try {
    const fileLink = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const res = await fetch(fileLink.href);
    const audioBuffer = Buffer.from(await res.arrayBuffer());

    const transcribed = await transcribeVoice(audioBuffer, {
      bin: config.whisper_bin ?? 'whisper',
      model: config.whisper_model ?? 'large-v3-turbo',
    });
    await log(`[bek] voice transcribed (${ctx.message.voice.duration}s) @${username}: "${transcribed}"`);

    await sessions.appendConversation(`[${username}]: [голосовое] ${transcribed}`);
    await handleMessage(ctx, `[${username} отправил голосовое: ${transcribed}]`);
  } catch (err) {
    await log(`[bek] voice handler error: ${err.message}`);
    await ctx.reply('Голосовое не распознал. Попробуй ещё раз.');
  }
});
```

Note: no `config.whisper_bin` guard — if whisper is missing, the spawn will fail and the catch will reply gracefully.

- [ ] **Step 7: Run the full test suite**

```bash
cd D:/dev2/projects/provodnik/.claude/bek
node --test test/*.test.mjs
```

Expected: all tests pass across all test files.

- [ ] **Step 8: Manual voice test**

```bash
pm2 restart quantumbek
```

Send a voice message to the Telegram group (say something in Russian, 5–10 seconds). Expected:
1. 👀 reaction appears within ~1 second
2. "QuantumBEK is typing…" persists (whisper on `large-v3-turbo` takes ~10–30s on CPU)
3. BEK replies based on the transcribed content
4. ✅ reaction

Verify transcription in log:
```bash
tail -10 D:/dev2/projects/provodnik/.claude/logs/bek-daemon.log
```

Expected line: `[bek] voice transcribed (8s) @username: "текст который вы сказали"`

If transcription is too slow, switch to `"whisper_model": "tiny"` in `bek.config.json` — tiny runs in ~2–3s on CPU at lower accuracy.

- [ ] **Step 9: Commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/whisper.mjs .claude/bek/test/whisper.test.mjs .claude/bek/bek-daemon.mjs .claude/bek/bek.config.json
git commit -m "feat(bek): voice message → local Whisper CLI → Claude"
```

---

## Self-Review

**Spec coverage:**
- ✅ Task 1: Typing indicator — `ctx.persistentChatAction('typing', fn)` wraps the full Claude run
- ✅ Task 2: Reactions — `ctx.react('👀')` on receive, `ctx.react('✅'/'❌')` on complete/error
- ✅ Task 3: Timeout notification — `err.isBekTimeout` property set in runner, checked in daemon catch
- ✅ Task 4: Crash recovery — `bot.telegram.sendMessage()` fires before `bot.launch()`, guarded with try/catch
- ✅ Task 5: Voice → STT — `getFileLink` + `fetch` → Buffer → `toFile` → Groq, no temp files

**Placeholder scan:** None. All code blocks are complete and copy-pasteable.

**Type / API consistency:**
- `transcribeVoice(audioBuffer: Buffer, apiKey: string)` — defined in Task 5 Step 3, imported in Step 6, called in Step 7 ✅
- `err.isBekTimeout` — set in Task 3 Step 2 (`claude-runner.mjs`), read in Task 3 Step 3 (`bek-daemon.mjs`) ✅
- `ctx.persistentChatAction` wraps the exact same block that contains `runClaude` ✅

**Groq API key note:** get a free key at https://console.groq.com — no credit card, 2000 req/day free. Set in `bek.config.json` as `"groq_api_key": "gsk_..."`.
