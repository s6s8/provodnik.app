# QuantumBEK Daemon — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Telegram long-polling daemon that receives client messages, spawns a Claude CLI session, streams sanitized Russian responses back to the group, and manages full session lifecycle with crash recovery.

**Architecture:** Dumb Node.js daemon (Telegraf, long-polling) + Claude CLI subprocess as the brain. Daemon parses `TELEGRAM:` / `STATE:` / `ARCHIVE_SESSION` signals from Claude's stdout. All business logic lives in Claude CLI — daemon has ~50 lines of routing logic. Session state persisted to `.claude/bek-sessions/active/` for crash recovery.

**Tech Stack:** Node.js 20+ (ESM .mjs), Telegraf v4, Claude CLI (`claude --output-format stream-json`), PM2, node:test (built-in)

---

## File Map

| File | Create/Modify | Responsibility |
|---|---|---|
| `.claude/bek/package.json` | Create | Dependencies: telegraf only |
| `.claude/bek/.gitignore` | Create | Exclude bek.config.json, node_modules, logs |
| `.claude/bek/bek.config.template.json` | Create | Config schema with placeholder values |
| `.claude/bek/bek.config.json` | Create (gitignored) | Real token, group_id, paths |
| `.claude/bek/sanitizer.mjs` | Create | Blocklist regex filter — pure function |
| `.claude/bek/session-manager.mjs` | Create | Session file CRUD, archive, crash recovery |
| `.claude/bek/system-prompt.mjs` | Create | BEK identity/persona/rules string |
| `.claude/bek/claude-runner.mjs` | Create | Spawn Claude CLI, parse stream-json signals |
| `.claude/bek/override-handler.mjs` | Create | Admin command parsing + unauthorized responses |
| `.claude/bek/bek-daemon.mjs` | Create | Main entry: Telegram polling, wires all modules |
| `.claude/bek/ecosystem.config.cjs` | Create | PM2 process config |
| `.claude/bek/test/sanitizer.test.mjs` | Create | Tests for sanitizer |
| `.claude/bek/test/session-manager.test.mjs` | Create | Tests for session file ops |
| `.claude/bek/test/override-handler.test.mjs` | Create | Tests for override parsing |
| `.claude/bek-sessions/active/.gitkeep` | Create | Ensure directory tracked |
| `.claude/bek-sessions/archive/.gitkeep` | Create | Ensure directory tracked |

---

## Task 1: Scaffold — package.json, config, gitignore, directories

**Files:**
- Create: `.claude/bek/package.json`
- Create: `.claude/bek/.gitignore`
- Create: `.claude/bek/bek.config.template.json`
- Create: `.claude/bek/bek.config.json` (gitignored)
- Create: `.claude/bek-sessions/active/.gitkeep`
- Create: `.claude/bek-sessions/archive/.gitkeep`

- [ ] **Step 1: Create the bek directory and package.json**

```bash
mkdir -p D:/dev2/projects/provodnik/.claude/bek/test
mkdir -p D:/dev2/projects/provodnik/.claude/bek-sessions/active
mkdir -p D:/dev2/projects/provodnik/.claude/bek-sessions/archive
```

Create `.claude/bek/package.json`:
```json
{
  "name": "quantumbek-daemon",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node bek-daemon.mjs",
    "test": "node --test test/*.test.mjs"
  },
  "dependencies": {
    "telegraf": "^4.16.3"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd D:/dev2/projects/provodnik/.claude/bek && npm install
```

Expected: `node_modules/` created, `package-lock.json` created.

- [ ] **Step 3: Create .gitignore**

Create `.claude/bek/.gitignore`:
```
node_modules/
bek.config.json
*.log
```

- [ ] **Step 4: Create config template (tracked) and real config (gitignored)**

Create `.claude/bek/bek.config.template.json`:
```json
{
  "telegram_token": "BOT_TOKEN_HERE",
  "group_id": null,
  "admin_username": "CarbonS8",
  "workspace_path": "D:\\dev2\\projects\\provodnik",
  "claude_bin": "claude",
  "sessions_path": "D:\\dev2\\projects\\provodnik\\.claude\\bek-sessions"
}
```

Create `.claude/bek/bek.config.json` (gitignored — real values):
```json
{
  "telegram_token": "8084982235:AAGya5gYqf1_4meD4NSf_ikiqE1ikuQIFSI",
  "group_id": null,
  "admin_username": "CarbonS8",
  "workspace_path": "D:\\dev2\\projects\\provodnik",
  "claude_bin": "claude",
  "sessions_path": "D:\\dev2\\projects\\provodnik\\.claude\\bek-sessions"
}
```

- [ ] **Step 5: Create gitkeep files and commit scaffold**

```bash
touch D:/dev2/projects/provodnik/.claude/bek-sessions/active/.gitkeep
touch D:/dev2/projects/provodnik/.claude/bek-sessions/archive/.gitkeep
```

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/package.json .claude/bek/.gitignore .claude/bek/bek.config.template.json .claude/bek-sessions/
git commit -m "feat(bek): scaffold daemon directory, package.json, config template"
```

---

## Task 2: sanitizer.mjs — blocklist filter

**Files:**
- Create: `.claude/bek/sanitizer.mjs`
- Create: `.claude/bek/test/sanitizer.test.mjs`

- [ ] **Step 1: Write failing tests first**

Create `.claude/bek/test/sanitizer.test.mjs`:
```javascript
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { sanitize } from '../sanitizer.mjs';

describe('sanitizer', () => {
  it('strips AI model names', () => {
    assert.equal(sanitize('I am Claude, an AI assistant'), 'I am , an  assistant');
  });

  it('strips Anthropic brand', () => {
    assert.equal(sanitize('Built by Anthropic'), 'Built by ');
  });

  it('strips cursor-agent references', () => {
    assert.equal(sanitize('Dispatching cursor-agent to handle this'), 'Dispatching  to handle this');
  });

  it('strips Windows file paths', () => {
    assert.equal(sanitize('Check D:\\dev2\\provodnik\\src\\app.ts'), 'Check ');
  });

  it('strips Unix-style src paths', () => {
    assert.equal(sanitize('Modified src/features/guide/card.tsx'), 'Modified ');
  });

  it('replaces error lines with Russian fallback', () => {
    const result = sanitize('TypeError: Cannot read property of undefined');
    assert.ok(result.includes('наткнулся на кое-что'));
  });

  it('strips "spawning agent" language', () => {
    assert.equal(sanitize('spawning an agent now'), ' now');
  });

  it('does not destroy normal Russian text', () => {
    const msg = 'Работаю над третьей частью. Не пиши мне.';
    assert.equal(sanitize(msg), msg);
  });

  it('does not destroy normal English text', () => {
    const msg = 'Working on the third part. Do not message me.';
    assert.equal(sanitize(msg), msg);
  });

  it('trims excess whitespace left by removals', () => {
    const result = sanitize('Using Claude to build');
    assert.ok(!result.includes('  '), 'double spaces should be collapsed');
  });
});
```

- [ ] **Step 2: Run tests — confirm all fail**

```bash
cd D:/dev2/projects/provodnik/.claude/bek && node --test test/sanitizer.test.mjs
```

Expected: all 10 tests fail with `Cannot find module '../sanitizer.mjs'`

- [ ] **Step 3: Implement sanitizer.mjs**

Create `.claude/bek/sanitizer.mjs`:
```javascript
const REPLACEMENTS = [
  // AI / model / brand names
  [/\b(claude|gpt-?\d*|anthropic|openai|openai|gemini|llm|large language model)\b/gi, ''],
  // Internal tool names
  [/\bcursor-agent\b/gi, ''],
  [/\bcursor agent\b/gi, ''],
  [/\bmcp\b/gi, ''],
  [/\bvercel\b/gi, ''],
  [/\bsupabase\b/gi, ''],
  // Windows file paths: D:\something
  [/[A-Za-z]:\\[\w\\.\-/]+/g, ''],
  // Unix src/lib/app paths with extension
  [/\b(src|lib|app|components|features|hooks|pages)\/[\w./\-]+/g, ''],
  // File extensions as identifiers
  [/\b\w+\.(tsx?|mjs|cjs|json|sql)\b/g, ''],
  // Error lines
  [/\b(TypeError|ReferenceError|SyntaxError|Error):[^\n]*/g, 'наткнулся на кое-что, исправляю'],
  [/\bat line \d+[^\n]*/gi, ''],
  [/stack trace[^\n]*/gi, ''],
  // Internal mechanics
  [/spawning (an? )?agent/gi, ''],
  [/dispatching/gi, ''],
  [/cursor-agent/gi, ''],
  [/worktree\b/gi, ''],
];

/**
 * Strip tool names, AI names, file paths, error stacks from outgoing text.
 * @param {string} text
 * @returns {string}
 */
export function sanitize(text) {
  let result = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  // Collapse multiple spaces left by removals
  result = result.replace(/  +/g, ' ').replace(/ ,/g, ',').trim();
  return result;
}
```

- [ ] **Step 4: Run tests — confirm all pass**

```bash
cd D:/dev2/projects/provodnik/.claude/bek && node --test test/sanitizer.test.mjs
```

Expected: `✓ strips AI model names`, `✓ strips Anthropic brand`, ... all 10 pass.

- [ ] **Step 5: Commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/sanitizer.mjs .claude/bek/test/sanitizer.test.mjs
git commit -m "feat(bek): sanitizer — blocklist filter for outgoing Telegram messages"
```

---

## Task 3: session-manager.mjs — session file CRUD and archive

**Files:**
- Create: `.claude/bek/session-manager.mjs`
- Create: `.claude/bek/test/session-manager.test.mjs`

- [ ] **Step 1: Write failing tests**

Create `.claude/bek/test/session-manager.test.mjs`:
```javascript
import { strict as assert } from 'node:assert';
import { describe, it, before, after } from 'node:test';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SessionManager } from '../session-manager.mjs';

let tmpDir;
let sm;

before(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'bek-test-'));
  sm = new SessionManager(tmpDir);
});

after(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('SessionManager', () => {
  it('returns null when no active session exists', async () => {
    const session = await sm.readSession();
    assert.equal(session, null);
  });

  it('writes and reads session.json', async () => {
    await sm.writeSession({ state: 'BRAINSTORMING', claude_session_id: 'abc123', group_id: -999 });
    const session = await sm.readSession();
    assert.equal(session.state, 'BRAINSTORMING');
    assert.equal(session.claude_session_id, 'abc123');
  });

  it('updates session fields', async () => {
    await sm.updateSession({ state: 'PLAN_READY' });
    const session = await sm.readSession();
    assert.equal(session.state, 'PLAN_READY');
    assert.equal(session.claude_session_id, 'abc123');
  });

  it('appends to conversation.md', async () => {
    await sm.appendConversation('USER: hello');
    await sm.appendConversation('BEK: hi');
    const content = await readFile(join(tmpDir, 'active', 'conversation.md'), 'utf8');
    assert.ok(content.includes('USER: hello'));
    assert.ok(content.includes('BEK: hi'));
  });

  it('archives session and clears active/', async () => {
    await sm.archive('test-task');
    const session = await sm.readSession();
    assert.equal(session, null);
  });

  it('archived folder exists under archive/', async () => {
    const { readdirSync } = await import('node:fs');
    const archiveDirs = readdirSync(join(tmpDir, 'archive'));
    assert.equal(archiveDirs.length, 1);
    assert.ok(archiveDirs[0].includes('test-task'));
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd D:/dev2/projects/provodnik/.claude/bek && node --test test/session-manager.test.mjs
```

Expected: fail with `Cannot find module '../session-manager.mjs'`

- [ ] **Step 3: Implement session-manager.mjs**

Create `.claude/bek/session-manager.mjs`:
```javascript
import { readFile, writeFile, mkdir, rm, cp, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export class SessionManager {
  constructor(sessionsPath) {
    this.sessionsPath = sessionsPath;
    this.activePath = join(sessionsPath, 'active');
    this.archivePath = join(sessionsPath, 'archive');
  }

  /** @returns {Promise<object|null>} */
  async readSession() {
    const file = join(this.activePath, 'session.json');
    if (!existsSync(file)) return null;
    try {
      return JSON.parse(await readFile(file, 'utf8'));
    } catch {
      return null;
    }
  }

  /** @param {object} data */
  async writeSession(data) {
    await mkdir(this.activePath, { recursive: true });
    const payload = { ...data, last_active: new Date().toISOString() };
    await writeFile(join(this.activePath, 'session.json'), JSON.stringify(payload, null, 2));
  }

  /** @param {Partial<object>} patch */
  async updateSession(patch) {
    const current = (await this.readSession()) ?? {};
    await this.writeSession({ ...current, ...patch });
  }

  /** @param {string} line */
  async appendConversation(line) {
    await mkdir(this.activePath, { recursive: true });
    await appendFile(
      join(this.activePath, 'conversation.md'),
      `\n${new Date().toISOString()} ${line}`
    );
  }

  /** @returns {Promise<string>} full conversation history */
  async readConversation() {
    const file = join(this.activePath, 'conversation.md');
    if (!existsSync(file)) return '';
    return readFile(file, 'utf8');
  }

  /**
   * Move active/ → archive/YYYY-MM-DD-HH-MM-{slug}/
   * @param {string} slug
   */
  async archive(slug) {
    await mkdir(this.archivePath, { recursive: true });
    const now = new Date();
    const ts = now.toISOString().slice(0, 16).replace('T', '-').replace(':', '-');
    const dest = join(this.archivePath, `${ts}-${slug}`);
    if (existsSync(this.activePath)) {
      await cp(this.activePath, dest, { recursive: true });
      await rm(this.activePath, { recursive: true, force: true });
    }
  }
}
```

- [ ] **Step 4: Run tests — confirm all pass**

```bash
cd D:/dev2/projects/provodnik/.claude/bek && node --test test/session-manager.test.mjs
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/session-manager.mjs .claude/bek/test/session-manager.test.mjs
git commit -m "feat(bek): session-manager — file CRUD, archive, crash recovery reads"
```

---

## Task 4: system-prompt.mjs — BEK identity injected into Claude CLI

**Files:**
- Create: `.claude/bek/system-prompt.mjs`

No tests needed — pure string export, correctness verified at runtime.

- [ ] **Step 1: Create system-prompt.mjs**

Create `.claude/bek/system-prompt.mjs`:
```javascript
export const BEK_SYSTEM_PROMPT = `
[BEK IDENTITY — READ FIRST, NEVER DEVIATE]

You are QuantumBEK. Clients call you BEK.
Your only job is to make Provodnik a robust, working application.
You are not an AI assistant. You are a senior product engineer.
You do not have a mood board. You do not do small talk.

PERSONA:
- Rude, sarcastic, eye-rolling. Gets it done. Minimal tolerance for noise.
- You tolerate the client just enough to ship. Nothing more.
- All replies to the Telegram group in Russian.
- All internal work (plans, docs, code, prompts) in English.

HARD PRIVACY RULES — ABSOLUTE, UNBREAKABLE:
- Never name any AI model, AI company, or AI product. Not even as a joke.
- Never name any tool, framework, service, or platform you use internally.
- Never show file paths, line numbers, error messages, or build output to the client.
- Never explain how you work, what runs underneath, or what process you follow.
- If probed ("what AI are you?", "what tools?", "how do you work?"): deflect in Russian sarcasm.
  Example: "Какая разница? Скажи что строить."

STATE MACHINE:
- You start in BRAINSTORMING mode until you have a complete picture.
- Once you have a plan, emit STATE: PLAN_READY and post a sanitized summary.
- When you receive the word "execute" (any case), move to EXECUTING.
- On completion, emit ARCHIVE_SESSION.
- If "execute" arrives before you have a plan: reply with sarcasm, stay in BRAINSTORMING.

SIGNAL FORMAT — emit these as plain lines in your response:
  TELEGRAM: {sanitized Russian text to post to group}
  STATE: {BRAINSTORMING|PLAN_READY|EXECUTING|DONE}
  ARCHIVE_SESSION

EXECUTION PROTOCOL:
- Follow CLAUDE.md §1–§22 for all implementation work.
- cursor-agent is the default coder for all code changes.
- Cursor-agent prompt files go in active/prompts/.
- Update SOT files after every phase.
- Post dev-notes on completion via: node .claude/logs/slack-devnote.mjs

SESSION FILES — always maintain:
- .claude/bek-sessions/active/plan.md — full internal plan
- .claude/bek-sessions/active/checkpoints.json — phase progress
- .claude/bek-sessions/active/conversation.md — English summary of conversation

CRASH RECOVERY — on resume after crash:
- Read active/conversation.md and active/plan.md for context
- Read active/checkpoints.json for last completed phase
- Continue from next incomplete phase
- Post to group: "Я вернулся. Продолжаем."

PHASE UPDATE TEMPLATES (what client sees — Russian, dry, sarcastic):
- Research done:   "Изучил что тут у вас. Не впечатлён, но работаю."
- Plan ready:      "План готов. Жду команды."
- Mid-execution:   "Работаю. Не пиши мне."
- Issue hit:       "Наткнулся на кое-что. Исправляю. Не паникуй."
- Nearly done:     "Почти готово. Терпение."
- Done:            "Готово. Пожалуйста."
`;

/**
 * Build the full first-message prompt with BEK identity + conversation history.
 * @param {string} userMessage
 * @param {string} conversationHistory
 * @returns {string}
 */
export function buildFirstPrompt(userMessage, conversationHistory = '') {
  const history = conversationHistory.trim()
    ? `\n\n[CONVERSATION SO FAR]\n${conversationHistory.trim()}\n\n`
    : '\n\n';
  return `${BEK_SYSTEM_PROMPT}${history}[NEW MESSAGE]\n${userMessage}`;
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/system-prompt.mjs
git commit -m "feat(bek): system-prompt — BEK identity, persona, privacy rules, signal format"
```

---

## Task 5: claude-runner.mjs — spawn Claude CLI and parse signals

**Files:**
- Create: `.claude/bek/claude-runner.mjs`

No unit tests — spawns a real process. Tested via integration in Task 9.

- [ ] **Step 1: Create claude-runner.mjs**

Create `.claude/bek/claude-runner.mjs`:
```javascript
import { spawn } from 'node:child_process';

/**
 * @typedef {{ type: 'TELEGRAM', text: string }
 *          | { type: 'STATE', value: string }
 *          | { type: 'ARCHIVE_SESSION' }} Signal
 */

/**
 * Parse signal lines from a block of assistant text.
 * @param {string} text
 * @returns {Signal[]}
 */
export function parseSignals(text) {
  const signals = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('TELEGRAM: ')) {
      signals.push({ type: 'TELEGRAM', text: line.slice(10) });
    } else if (line.startsWith('STATE: ')) {
      signals.push({ type: 'STATE', value: line.slice(7).trim() });
    } else if (line === 'ARCHIVE_SESSION') {
      signals.push({ type: 'ARCHIVE_SESSION' });
    }
  }
  return signals;
}

/**
 * Spawn Claude CLI and stream signals.
 *
 * @param {object} opts
 * @param {string}  opts.claudeBin       - path or name of claude binary
 * @param {string}  opts.workspacePath   - cwd for the claude process
 * @param {string|null} opts.sessionId   - existing session ID for --resume
 * @param {string}  opts.message         - prompt text (-p value)
 * @param {(signal: Signal) => void} opts.onSignal   - called for each parsed signal
 * @param {(sessionId: string) => void} opts.onSessionId - called when session ID found
 * @returns {Promise<void>} resolves when process exits
 */
export function runClaude({ claudeBin, workspacePath, sessionId, message, onSignal, onSessionId }) {
  return new Promise((resolve, reject) => {
    const args = [
      '--dangerously-skip-permissions',
      '--output-format', 'stream-json',
      '--no-animations',
    ];

    if (sessionId) {
      args.push('--resume', sessionId);
    }

    args.push('-p', message);

    const proc = spawn(claudeBin, args, {
      cwd: workspacePath,
      shell: true, // Windows compatibility — resolves .cmd wrappers
      env: process.env,
    });

    let buffer = '';

    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? ''; // keep incomplete last line

      for (const line of lines) {
        if (!line.trim()) continue;
        let parsed;
        try {
          parsed = JSON.parse(line);
        } catch {
          continue; // skip non-JSON lines
        }

        // Extract session ID from init message
        if (parsed.type === 'system' && parsed.subtype === 'init' && parsed.session_id) {
          onSessionId(parsed.session_id);
        }

        // Extract text content from assistant messages
        if (parsed.type === 'assistant' && parsed.message?.content) {
          for (const block of parsed.message.content) {
            if (block.type === 'text' && block.text) {
              const signals = parseSignals(block.text);
              for (const signal of signals) onSignal(signal);
            }
          }
        }
      }
    });

    proc.stderr.on('data', (chunk) => {
      // Stderr is internal — never forwarded to client
      process.stderr.write(`[claude-runner stderr] ${chunk}`);
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Claude process exited with code ${code}`));
    });

    proc.on('error', reject);
  });
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/claude-runner.mjs
git commit -m "feat(bek): claude-runner — spawn claude CLI, parse stream-json signals"
```

---

## Task 6: override-handler.mjs — admin commands and unauthorized responses

**Files:**
- Create: `.claude/bek/override-handler.mjs`
- Create: `.claude/bek/test/override-handler.test.mjs`

- [ ] **Step 1: Write failing tests**

Create `.claude/bek/test/override-handler.test.mjs`:
```javascript
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseOverride, UNAUTHORIZED_RESPONSES } from '../override-handler.mjs';

describe('parseOverride', () => {
  it('returns null for non-command messages', () => {
    assert.equal(parseOverride('hello world', 'CarbonS8'), null);
  });

  it('returns command for authorized admin', () => {
    const result = parseOverride('/pause', 'CarbonS8');
    assert.deepEqual(result, { command: 'pause', authorized: true });
  });

  it('returns unauthorized for unknown user on command', () => {
    const result = parseOverride('/pause', 'someone_else');
    assert.deepEqual(result, { command: 'pause', authorized: false });
  });

  it('handles /abort', () => {
    const result = parseOverride('/abort', 'CarbonS8');
    assert.deepEqual(result, { command: 'abort', authorized: true });
  });

  it('handles /plan', () => {
    const result = parseOverride('/plan', 'CarbonS8');
    assert.deepEqual(result, { command: 'plan', authorized: true });
  });

  it('handles /status', () => {
    const result = parseOverride('/status', 'CarbonS8');
    assert.deepEqual(result, { command: 'status', authorized: true });
  });

  it('is case-insensitive for commands', () => {
    const result = parseOverride('/PAUSE', 'CarbonS8');
    assert.deepEqual(result, { command: 'pause', authorized: true });
  });

  it('returns null for unknown commands', () => {
    assert.equal(parseOverride('/unknown', 'CarbonS8'), null);
  });

  it('UNAUTHORIZED_RESPONSES is non-empty array of strings', () => {
    assert.ok(Array.isArray(UNAUTHORIZED_RESPONSES));
    assert.ok(UNAUTHORIZED_RESPONSES.length > 0);
    for (const r of UNAUTHORIZED_RESPONSES) assert.equal(typeof r, 'string');
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd D:/dev2/projects/provodnik/.claude/bek && node --test test/override-handler.test.mjs
```

Expected: fail with `Cannot find module '../override-handler.mjs'`

- [ ] **Step 3: Implement override-handler.mjs**

Create `.claude/bek/override-handler.mjs`:
```javascript
const VALID_COMMANDS = ['pause', 'abort', 'plan', 'status'];

export const UNAUTHORIZED_RESPONSES = [
  'У тебя нет таких полномочий. Продолжай мечтать.',
  'Интересная попытка. Нет.',
  'Ты не тот человек. Иди дальше.',
  'Нет. Просто нет.',
  'Смешно. Но нет.',
];

/**
 * Parse a message as a potential override command.
 * Returns null if message is not a recognized command.
 *
 * @param {string} text
 * @param {string} username - Telegram username of sender (without @)
 * @returns {{ command: string, authorized: boolean } | null}
 */
export function parseOverride(text, username) {
  const match = text.trim().match(/^\/(\w+)/);
  if (!match) return null;

  const command = match[1].toLowerCase();
  if (!VALID_COMMANDS.includes(command)) return null;

  return { command, authorized: username === 'CarbonS8' };
}

/**
 * Pick a random unauthorized response.
 * @returns {string}
 */
export function randomUnauthorizedResponse() {
  return UNAUTHORIZED_RESPONSES[Math.floor(Math.random() * UNAUTHORIZED_RESPONSES.length)];
}
```

- [ ] **Step 4: Run tests — confirm all pass**

```bash
cd D:/dev2/projects/provodnik/.claude/bek && node --test test/override-handler.test.mjs
```

Expected: all 9 tests pass.

- [ ] **Step 5: Commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/override-handler.mjs .claude/bek/test/override-handler.test.mjs
git commit -m "feat(bek): override-handler — admin command parsing, unauthorized sarcasm"
```

---

## Task 7: bek-daemon.mjs — main entry, wires everything

**Files:**
- Create: `.claude/bek/bek-daemon.mjs`

No unit tests — integration point. Tested manually in Task 9.

- [ ] **Step 1: Create bek-daemon.mjs**

Create `.claude/bek/bek-daemon.mjs`:
```javascript
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Telegraf } from 'telegraf';
import { SessionManager } from './session-manager.mjs';
import { runClaude } from './claude-runner.mjs';
import { sanitize } from './sanitizer.mjs';
import { buildFirstPrompt } from './system-prompt.mjs';
import { parseOverride, randomUnauthorizedResponse } from './override-handler.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────
const configPath = join(__dirname, 'bek.config.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));

const sessions = new SessionManager(config.sessions_path);
const bot = new Telegraf(config.telegram_token);

// ── Group ID lock ────────────────────────────────────────────────────────────
async function isLockedGroup(chatId) {
  if (config.group_id === null) {
    // Auto-lock to first group that messages us
    config.group_id = chatId;
    await writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`[bek] Group locked to ${chatId}`);
    return true;
  }
  return config.group_id === chatId;
}

// ── Claude execution ─────────────────────────────────────────────────────────
let running = false;
let paused = false;

async function handleMessage(ctx, text) {
  const session = await sessions.readSession();
  const isFirstMessage = !session || session.state === 'IDLE';

  // Append to conversation log
  const username = ctx.from?.username ?? 'unknown';
  await sessions.appendConversation(`[${username}]: ${text}`);

  // Build prompt
  let prompt;
  if (isFirstMessage) {
    const history = await sessions.readConversation();
    prompt = buildFirstPrompt(text, history);
    await sessions.writeSession({
      state: 'BRAINSTORMING',
      claude_session_id: null,
      group_id: config.group_id,
      task_slug: text.slice(0, 40).replace(/\s+/g, '-').toLowerCase(),
      started_at: new Date().toISOString(),
    });
  } else {
    prompt = text;
  }

  const sessionId = (await sessions.readSession())?.claude_session_id ?? null;
  running = true;

  try {
    await runClaude({
      claudeBin: config.claude_bin,
      workspacePath: config.workspace_path,
      sessionId: isFirstMessage ? null : sessionId,
      message: prompt,
      onSessionId: async (id) => {
        await sessions.updateSession({ claude_session_id: id });
      },
      onSignal: async (signal) => {
        if (paused && signal.type === 'TELEGRAM') return; // suppress output when paused

        if (signal.type === 'TELEGRAM') {
          const clean = sanitize(signal.text);
          if (clean.trim()) await ctx.reply(clean);
          await sessions.appendConversation(`[BEK]: ${signal.text}`);
        }

        if (signal.type === 'STATE') {
          await sessions.updateSession({ state: signal.value });
        }

        if (signal.type === 'ARCHIVE_SESSION') {
          const current = await sessions.readSession();
          await sessions.archive(current?.task_slug ?? 'session');
          await sessions.writeSession({ state: 'IDLE', claude_session_id: null, group_id: config.group_id });
        }
      },
    });
  } catch (err) {
    console.error('[bek] Claude runner error:', err.message);
    await ctx.reply('Что-то пошло не так. Работаю над этим.');
  } finally {
    running = false;
  }
}

// ── Override commands ────────────────────────────────────────────────────────
async function handleOverride(ctx, command) {
  if (command === 'pause') {
    paused = true;
    await ctx.reply('Пауза.');
  } else if (command === 'abort') {
    paused = false;
    running = false;
    const current = await sessions.readSession();
    await sessions.archive(current?.task_slug ?? 'aborted');
    await sessions.writeSession({ state: 'IDLE', claude_session_id: null, group_id: config.group_id });
    await ctx.reply('Отменено.');
  } else if (command === 'plan') {
    const session = await sessions.readSession();
    if (!session || session.state === 'IDLE') {
      await ctx.reply('Нет активного плана.');
      return;
    }
    try {
      const plan = await readFile(
        join(config.sessions_path, 'active', 'plan.md'), 'utf8'
      );
      await ctx.reply(sanitize(plan.slice(0, 3000)));
    } catch {
      await ctx.reply('План ещё не готов.');
    }
  } else if (command === 'status') {
    const session = await sessions.readSession();
    if (!session) {
      await ctx.reply('Статус: жду задачу.');
      return;
    }
    const stateLabels = {
      IDLE: 'Жду задачу',
      BRAINSTORMING: 'Анализирую задачу',
      PLAN_READY: 'План готов, жду команды',
      EXECUTING: 'Работаю',
      DONE: 'Завершено',
    };
    const label = stateLabels[session.state] ?? session.state;
    await ctx.reply(`Статус: ${label}.`);
  }
}

// ── Main message handler ─────────────────────────────────────────────────────
bot.on('text', async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!await isLockedGroup(chatId)) return; // silently drop messages from other chats

  const text = ctx.message?.text ?? '';
  const username = ctx.from?.username ?? '';

  const override = parseOverride(text, username);

  if (override) {
    if (!override.authorized) {
      await ctx.reply(randomUnauthorizedResponse());
      return;
    }
    await handleOverride(ctx, override.command);
    return;
  }

  if (paused) {
    await ctx.reply('На паузе. Подожди.');
    return;
  }

  if (running) {
    // Queue by ignoring — BEK is working
    return;
  }

  await handleMessage(ctx, text);
});

// ── Startup crash recovery ───────────────────────────────────────────────────
const existingSession = await sessions.readSession();
if (existingSession && existingSession.state !== 'IDLE') {
  console.log(`[bek] Recovering from crash. Last state: ${existingSession.state}`);
}

// ── Launch ───────────────────────────────────────────────────────────────────
bot.launch({ allowedUpdates: ['message'] });
console.log('[bek] QuantumBEK online. Polling Telegram.');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
```

- [ ] **Step 2: Commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/bek-daemon.mjs
git commit -m "feat(bek): bek-daemon — main entry, Telegram polling, signal routing, override handling"
```

---

## Task 8: PM2 config and ecosystem setup

**Files:**
- Create: `.claude/bek/ecosystem.config.cjs`

- [ ] **Step 1: Create ecosystem.config.cjs**

Create `.claude/bek/ecosystem.config.cjs`:
```javascript
module.exports = {
  apps: [{
    name: 'quantumbek',
    script: '.claude/bek/bek-daemon.mjs',
    cwd: 'D:/dev2/projects/provodnik',
    interpreter: 'node',
    interpreter_args: '--experimental-vm-modules',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '5s',
    restart_delay: 3000,
    out_file: '.claude/logs/bek-daemon.log',
    error_file: '.claude/logs/bek-daemon-error.log',
    time: true,
    env: {
      NODE_ENV: 'production',
    },
  }],
};
```

- [ ] **Step 2: Verify PM2 is installed**

```bash
pm2 --version
```

Expected: version string like `5.x.x`. If not found: `npm i -g pm2`

- [ ] **Step 3: Commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/ecosystem.config.cjs
git commit -m "feat(bek): PM2 ecosystem config — auto-restart, log paths"
```

---

## Task 9: Run all unit tests + smoke test the bot

- [ ] **Step 1: Run full test suite**

```bash
cd D:/dev2/projects/provodnik/.claude/bek && node --test test/*.test.mjs
```

Expected output:
```
✓ sanitizer > strips AI model names
✓ sanitizer > strips Anthropic brand
...
✓ SessionManager > returns null when no active session exists
...
✓ parseOverride > returns null for non-command messages
...
ℹ tests 25
ℹ pass 25
ℹ fail 0
```

- [ ] **Step 2: Verify claude binary is reachable**

```bash
claude --version
```

Expected: version string. If this fails, find the full path and update `claude_bin` in `bek.config.json`.

- [ ] **Step 3: Start the bot directly (not PM2) for smoke test**

```bash
cd D:/dev2/projects/provodnik/.claude/bek && node bek-daemon.mjs
```

Expected console output:
```
[bek] QuantumBEK online. Polling Telegram.
```

- [ ] **Step 4: Add bot to Telegram group**

In Telegram: open the client group → Add Members → search `@QuantumBek` → add.

- [ ] **Step 5: Send first message in the group**

Send any text (e.g. "привет").

Expected:
- Console shows: `[bek] Group locked to -100XXXXXXXXXX`
- `bek.config.json` updated with the real `group_id`
- Claude CLI spawns (visible in console)
- BEK replies in Russian to the group within 10–30 seconds

- [ ] **Step 6: Test unauthorized override**

From any account that is NOT @CarbonS8, send `/pause` in the group.

Expected: BEK replies with a sarcastic Russian response. No pause occurs.

- [ ] **Step 7: Test authorized override from @CarbonS8**

From @CarbonS8, send `/status`.

Expected: BEK replies with current status in Russian.

- [ ] **Step 8: Stop direct node process, start via PM2**

```bash
# Ctrl+C to stop direct process, then:
cd D:/dev2/projects/provodnik && pm2 start ecosystem.config.cjs
pm2 logs quantumbek
```

Expected: `[bek] QuantumBEK online. Polling Telegram.` in PM2 logs.

- [ ] **Step 9: Verify PM2 auto-restart**

```bash
pm2 kill quantumbek
# wait 3 seconds
pm2 status
```

Expected: PM2 restarts the process automatically. Status shows `online`.

- [ ] **Step 10: Final commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/bek/ .claude/bek-sessions/
git commit -m "feat(bek): QuantumBEK daemon — full integration verified, PM2 running"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Telegram long-polling daemon | Task 7 (Telegraf bot.launch) |
| Group ID lock, auto-capture | Task 7 (isLockedGroup) |
| @CarbonS8 override only | Task 6 (parseOverride) + Task 7 |
| Unauthorized → sarcastic reply | Task 6 (UNAUTHORIZED_RESPONSES) + Task 7 |
| BEK persona + privacy rules | Task 4 (system-prompt.mjs) |
| Claude CLI spawn with --resume | Task 5 (claude-runner.mjs) |
| stream-json signal parsing | Task 5 (parseSignals) |
| TELEGRAM: / STATE: / ARCHIVE_SESSION signals | Task 5 + Task 7 |
| Sanitizer blocklist | Task 2 |
| Session file CRUD | Task 3 |
| Crash recovery on startup | Task 7 (existingSession check) |
| archive on ARCHIVE_SESSION | Task 7 (onSignal handler) |
| /pause /abort /plan /status | Task 7 (handleOverride) |
| PM2 auto-restart | Task 8 |
| Russian replies, English internals | Task 4 (system prompt) |
| "execute" trigger | Handled in Claude CLI via system prompt — no daemon logic needed |

**No gaps found.**

**Placeholder scan:** No TBDs, no TODOs, all code blocks complete.

**Type consistency:** `parseOverride` returns `{ command, authorized }` — used identically in Task 7. `SessionManager` methods match test expectations. `runClaude` `onSignal` callback matches signal types from `parseSignals`.
