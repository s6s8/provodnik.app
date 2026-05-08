# Telegram Dev-Note Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `.claude/logs/telegram-devnote.mjs` — a standalone Node script that reads the same dev-note JSON consumed by `slack-devnote.mjs`, renders it as Telegram HTML, splits at 4000 chars when needed, and POSTs to the dev chat.

**Architecture:** Single ESM file, ~200 LOC. Pure functions (`escapeHtml`, `groupByKind`, `renderSection`, `renderMessage`, `splitForTelegram`, `validate`) tested in isolation. Side-effecting `sendTelegram` mocked in tests. CLI wraps everything with `--dry` flag and env-var credentials.

**Tech Stack:** Node.js (`.mjs`), built-in `node:test` + `node:assert`, native `fetch`. Zero new dependencies.

**Spec:** `docs/superpowers/specs/2026-04-24-telegram-devnote-design.md`

---

## File Structure

**New:**
- `.claude/logs/telegram-devnote.mjs` — the script
- `.claude/logs/test/telegram-devnote.test.mjs` — tests

**Modified:**
- `.claude/CLAUDE.md` — Slack post-work section gains a "then send to Telegram" line

**Unchanged:**
- `.claude/logs/slack-devnote.mjs`
- `~/.claude/CLAUDE.md` — referenced from project CLAUDE.md only; no edit needed unless user asks

Run tests via `node --test .claude/logs/test/telegram-devnote.test.mjs`.

---

## Task 1: Pure helpers — escapeHtml + groupByKind

**Files:**
- Create: `.claude/logs/telegram-devnote.mjs` (skeleton with two exported helpers)
- Create: `.claude/logs/test/telegram-devnote.test.mjs`

- [ ] **Step 1: Write failing test**

Create `.claude/logs/test/telegram-devnote.test.mjs`:

```js
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { escapeHtml, groupByKind } from '../telegram-devnote.mjs';

describe('escapeHtml', () => {
  it('escapes <, >, &', () => {
    assert.equal(escapeHtml('a < b > c & d'), 'a &lt; b &gt; c &amp; d');
  });
  it('leaves plain text untouched', () => {
    assert.equal(escapeHtml('Hello world'), 'Hello world');
  });
  it('handles empty string', () => {
    assert.equal(escapeHtml(''), '');
  });
});

describe('groupByKind', () => {
  it('groups items in fixed section order', () => {
    const items = [
      { kind: 'tech', category: 'arch', text: 't1' },
      { kind: 'fix', area: 'A', text: 'f1' },
      { kind: 'new', area: 'B', text: 'n1' },
      { kind: 'change', area: 'C', text: 'c1' },
    ];
    const groups = groupByKind(items);
    const keys = [...groups.keys()];
    assert.deepEqual(keys, ['new', 'change', 'fix', 'improve', 'tech']);
    assert.equal(groups.get('new').length, 1);
    assert.equal(groups.get('improve').length, 0);
  });
  it('preserves order within a section', () => {
    const items = [
      { kind: 'new', area: 'A', text: 'first' },
      { kind: 'new', area: 'B', text: 'second' },
      { kind: 'new', area: 'C', text: 'third' },
    ];
    const groups = groupByKind(items);
    assert.deepEqual(groups.get('new').map(i => i.text), ['first', 'second', 'third']);
  });
  it('ignores unknown kinds', () => {
    const items = [
      { kind: 'new', area: 'A', text: 'ok' },
      { kind: 'mystery', area: 'B', text: 'skip' },
    ];
    const groups = groupByKind(items);
    assert.equal(groups.get('new').length, 1);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd D:/dev2/projects/provodnik
node --test .claude/logs/test/telegram-devnote.test.mjs 2>&1 | tail -8
```
Expected: FAIL with `Cannot find module '../telegram-devnote.mjs'`.

- [ ] **Step 3: Create skeleton + helpers**

Create `.claude/logs/telegram-devnote.mjs`:

```js
const KIND_ORDER = ['new', 'change', 'fix', 'improve', 'tech'];

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function groupByKind(items) {
  const out = new Map();
  for (const k of KIND_ORDER) out.set(k, []);
  for (const item of items) {
    if (out.has(item.kind)) out.get(item.kind).push(item);
  }
  return out;
}
```

- [ ] **Step 4: Run tests**

```bash
node --test .claude/logs/test/telegram-devnote.test.mjs 2>&1 | tail -8
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd D:/dev2/projects/provodnik
git add .claude/logs/telegram-devnote.mjs .claude/logs/test/telegram-devnote.test.mjs
git commit -m "feat(devnote): add telegram-devnote.mjs scaffold — escapeHtml + groupByKind"
```

---

## Task 2: renderSection

**Files:**
- Modify: `.claude/logs/telegram-devnote.mjs`
- Modify: `.claude/logs/test/telegram-devnote.test.mjs`

- [ ] **Step 1: Write failing test**

Append to `.claude/logs/test/telegram-devnote.test.mjs`:

```js
import { renderSection } from '../telegram-devnote.mjs';

describe('renderSection', () => {
  it('renders new section with bold area names', () => {
    const out = renderSection('new', [
      { kind: 'new', area: 'Память', text: 'теги' },
      { kind: 'new', area: 'Логи', text: 'уровни' },
    ]);
    assert.ok(out.startsWith('✨ <b>Новое</b>'));
    assert.ok(out.includes('• <b>Память</b> — теги'));
    assert.ok(out.includes('• <b>Логи</b> — уровни'));
  });

  it('uses category for tech items', () => {
    const out = renderSection('tech', [
      { kind: 'tech', category: 'arch', text: 'модули' },
      { kind: 'tech', category: 'infra', text: 'процессы' },
    ]);
    assert.ok(out.startsWith('🏗 <b>Технические</b>'));
    assert.ok(out.includes('• <b>arch</b> — модули'));
  });

  it('returns empty string for empty section', () => {
    assert.equal(renderSection('fix', []), '');
  });

  it('escapes HTML in area and text', () => {
    const out = renderSection('new', [{ kind: 'new', area: 'A<B>', text: 'x & y' }]);
    assert.ok(out.includes('A&lt;B&gt;'));
    assert.ok(out.includes('x &amp; y'));
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
node --test .claude/logs/test/telegram-devnote.test.mjs 2>&1 | tail -8
```
Expected: FAIL — `renderSection` not exported.

- [ ] **Step 3: Add `renderSection` to telegram-devnote.mjs**

Append to `.claude/logs/telegram-devnote.mjs`:

```js
const SECTION_META = {
  new:     { emoji: '✨', label: 'Новое' },
  change:  { emoji: '🔄', label: 'Изменения' },
  fix:     { emoji: '🔧', label: 'Исправления' },
  improve: { emoji: '⬆️', label: 'Улучшения' },
  tech:    { emoji: '🏗', label: 'Технические' },
};

export function renderSection(kind, items) {
  if (!items.length) return '';
  const meta = SECTION_META[kind];
  const lines = [`${meta.emoji} <b>${meta.label}</b>`];
  for (const item of items) {
    const prefix = kind === 'tech' ? item.category : item.area;
    lines.push(`• <b>${escapeHtml(prefix)}</b> — ${escapeHtml(item.text)}`);
  }
  return lines.join('\n');
}
```

- [ ] **Step 4: Run tests**

```bash
node --test .claude/logs/test/telegram-devnote.test.mjs 2>&1 | tail -8
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add .claude/logs/telegram-devnote.mjs .claude/logs/test/telegram-devnote.test.mjs
git commit -m "feat(devnote): renderSection — section header + bold prefix per item"
```

---

## Task 3: renderMessage (full assembly)

**Files:**
- Modify: `.claude/logs/telegram-devnote.mjs`
- Modify: `.claude/logs/test/telegram-devnote.test.mjs`

- [ ] **Step 1: Write failing test**

Append to test file:

```js
import { renderMessage } from '../telegram-devnote.mjs';

describe('renderMessage', () => {
  it('assembles theme, date, sections in fixed order', () => {
    const out = renderMessage({
      theme: 'Тестовая тема',
      items: [
        { kind: 'new', area: 'A', text: 'a-text' },
        { kind: 'tech', category: 'arch', text: 'arch-text' },
        { kind: 'fix', area: 'B', text: 'b-text' },
      ],
    }, { date: '24.04.26' });

    assert.ok(out.includes('🛠 <b>Тестовая тема</b>'));
    assert.ok(out.includes('24.04.26'));
    assert.ok(!out.includes('$'), 'no cost should be rendered');
    assert.ok(!out.match(/~\d+ч/), 'no hours should be rendered');
    // Section order: new before fix before tech
    const newIdx = out.indexOf('✨');
    const fixIdx = out.indexOf('🔧');
    const techIdx = out.indexOf('🏗');
    assert.ok(newIdx < fixIdx && fixIdx < techIdx);
  });

  it('omits empty sections', () => {
    const out = renderMessage({
      theme: 'T',
      items: [{ kind: 'new', area: 'A', text: 't' }],
    }, { date: '24.04.26' });
    assert.ok(!out.includes('Изменения'));
    assert.ok(!out.includes('Исправления'));
  });

  it('renders capabilities block at bottom when present', () => {
    const out = renderMessage({
      theme: 'T',
      items: [{ kind: 'new', area: 'A', text: 't' }],
      capabilities: ['Один сценарий', 'Второй сценарий'],
    }, { date: '24.04.26' });
    assert.ok(out.includes('🚀 <b>Продукт теперь умеет:</b>'));
    assert.ok(out.includes('• Один сценарий'));
    assert.ok(out.includes('• Второй сценарий'));
    const capIdx = out.indexOf('🚀');
    const newIdx = out.indexOf('✨');
    assert.ok(capIdx > newIdx);
  });

  it('omits capabilities block when absent or empty', () => {
    const out1 = renderMessage({ theme: 'T', items: [{ kind: 'new', area: 'A', text: 't' }] }, { date: '24.04.26' });
    const out2 = renderMessage({ theme: 'T', items: [{ kind: 'new', area: 'A', text: 't' }], capabilities: [] }, { date: '24.04.26' });
    assert.ok(!out1.includes('🚀'));
    assert.ok(!out2.includes('🚀'));
  });

  it('escapes HTML in theme and capability', () => {
    const out = renderMessage({
      theme: 'T<x>',
      items: [{ kind: 'new', area: 'A', text: 't' }],
      capabilities: ['cap with <html> & stuff'],
    }, { date: '24.04.26' });
    assert.ok(out.includes('T&lt;x&gt;'));
    assert.ok(out.includes('&lt;html&gt;'));
    assert.ok(out.includes('&amp;'));
  });

  it('ignores hours_override silently when present', () => {
    const out = renderMessage({
      theme: 'T',
      items: [{ kind: 'new', area: 'A', text: 't' }],
      hours_override: 99,
    }, { date: '24.04.26' });
    assert.ok(!out.includes('99'));
    assert.ok(!out.includes('$'));
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
node --test .claude/logs/test/telegram-devnote.test.mjs 2>&1 | tail -8
```
Expected: FAIL.

- [ ] **Step 3: Add `renderMessage` to telegram-devnote.mjs**

Append to `.claude/logs/telegram-devnote.mjs`:

```js
function renderHeader(theme, date) {
  return `🛠 <b>${escapeHtml(theme)}</b>\n${date}`;
}

function renderCapabilities(capabilities) {
  if (!capabilities || !capabilities.length) return '';
  const lines = ['🚀 <b>Продукт теперь умеет:</b>'];
  for (const cap of capabilities) lines.push(`• ${escapeHtml(cap)}`);
  return lines.join('\n');
}

export function renderMessage(json, { date }) {
  const groups = groupByKind(json.items);
  const sections = [];
  for (const kind of KIND_ORDER) {
    const block = renderSection(kind, groups.get(kind));
    if (block) sections.push(block);
  }
  const caps = renderCapabilities(json.capabilities);
  if (caps) sections.push(caps);
  return [renderHeader(json.theme, date), ...sections].join('\n\n');
}
```

- [ ] **Step 4: Run tests**

```bash
node --test .claude/logs/test/telegram-devnote.test.mjs 2>&1 | tail -8
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add .claude/logs/telegram-devnote.mjs .claude/logs/test/telegram-devnote.test.mjs
git commit -m "feat(devnote): renderMessage — theme, footer, ordered sections, capabilities"
```

---

## Task 4: splitForTelegram

**Files:**
- Modify: `.claude/logs/telegram-devnote.mjs`
- Modify: `.claude/logs/test/telegram-devnote.test.mjs`

- [ ] **Step 1: Write failing test**

Append to test file:

```js
import { splitForTelegram } from '../telegram-devnote.mjs';

describe('splitForTelegram', () => {
  it('returns single message when under limit', () => {
    const parts = splitForTelegram('short message', 4000);
    assert.deepEqual(parts, ['short message']);
  });

  it('splits on double-newline section boundaries', () => {
    const sec1 = '🛠 <b>Theme</b>\n24.04.26 · ~1ч · $150';
    const sec2 = '✨ <b>Новое</b>\n' + Array.from({length: 100}, (_, i) => `• <b>Area</b> — text ${i}`).join('\n');
    const sec3 = '🏗 <b>Технические</b>\n• <b>arch</b> — last';
    const full = [sec1, sec2, sec3].join('\n\n');
    const parts = splitForTelegram(full, 4000);
    assert.ok(parts.length >= 2);
    // Each part under limit
    for (const p of parts) assert.ok(p.length <= 4000, `part exceeded: ${p.length}`);
    // Header (1/N) appears on first part
    assert.ok(parts[0].includes('(1/'));
    // Last part includes the last section
    assert.ok(parts[parts.length - 1].includes('last'));
  });

  it('adds (N/M) suffix to all parts when split', () => {
    const longSection = Array.from({length: 200}, (_, i) => `• <b>X</b> — item ${i}`).join('\n');
    const full = `🛠 <b>T</b>\n24.04.26 · ~1ч · $150\n\n✨ <b>Новое</b>\n${longSection}`;
    const parts = splitForTelegram(full, 4000);
    const M = parts.length;
    for (let i = 0; i < M; i++) {
      assert.ok(parts[i].includes(`(${i + 1}/${M})`));
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
node --test .claude/logs/test/telegram-devnote.test.mjs 2>&1 | tail -8
```
Expected: FAIL.

- [ ] **Step 3: Add `splitForTelegram`**

Append to `.claude/logs/telegram-devnote.mjs`:

```js
/**
 * Split a rendered message into Telegram-sized parts.
 * Splits on section (double-newline) boundaries first; if a single section
 * still exceeds limit, splits on item-line boundaries within it.
 * Adds (N/M) suffix to the title line of each part.
 */
export function splitForTelegram(message, limit = 4000) {
  if (message.length <= limit) return [message];

  const sections = message.split('\n\n');
  // First section is the header (theme + footer); rest are content sections.
  const header = sections.shift();

  // Pack sections into parts greedily.
  const parts = [];
  let current = header;
  for (const sec of sections) {
    const next = current + '\n\n' + sec;
    if (next.length <= limit) {
      current = next;
      continue;
    }
    // Current part is full. If section alone fits, start a new part with header carry-over.
    if ((header + '\n\n' + sec).length <= limit) {
      parts.push(current);
      current = header + '\n\n' + sec;
      continue;
    }
    // Section is itself too big — split it on item boundaries.
    parts.push(current);
    const lines = sec.split('\n');
    const sectionHeader = lines.shift(); // emoji + bold label line
    let buf = header + '\n\n' + sectionHeader;
    for (const line of lines) {
      const proposed = buf + '\n' + line;
      if (proposed.length <= limit) {
        buf = proposed;
      } else {
        parts.push(buf);
        buf = header + '\n\n' + sectionHeader + '\n' + line;
      }
    }
    current = buf;
  }
  parts.push(current);

  // Attach (N/M) suffix to the title line of each part.
  const M = parts.length;
  return parts.map((p, i) => {
    const idx = p.indexOf('</b>');
    if (idx === -1) return p;
    return p.slice(0, idx + 4) + ` (${i + 1}/${M})` + p.slice(idx + 4);
  });
}
```

- [ ] **Step 4: Run tests**

```bash
node --test .claude/logs/test/telegram-devnote.test.mjs 2>&1 | tail -8
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add .claude/logs/telegram-devnote.mjs .claude/logs/test/telegram-devnote.test.mjs
git commit -m "feat(devnote): splitForTelegram — section-aware split with (N/M) suffix"
```

---

## Task 5: validate

**Files:**
- Modify: `.claude/logs/telegram-devnote.mjs`
- Modify: `.claude/logs/test/telegram-devnote.test.mjs`

- [ ] **Step 1: Write failing test**

Append:

```js
import { validate } from '../telegram-devnote.mjs';

describe('validate', () => {
  const okItem = { kind: 'new', area: 'A', text: 't' };
  const okJson = { theme: 'T', items: [okItem] };

  it('returns null for valid json (no hours required)', () => {
    assert.equal(validate(okJson), null);
  });

  it('returns null when hours_override is present (ignored)', () => {
    assert.equal(validate({ ...okJson, hours_override: 5 }), null);
  });

  it('errors when theme missing', () => {
    assert.match(validate({ ...okJson, theme: '' }), /theme/);
  });

  it('errors when items missing or empty', () => {
    assert.match(validate({ ...okJson, items: [] }), /items/);
    assert.match(validate({ theme: 'T' }), /items/);
  });

  it('errors on unknown kind', () => {
    assert.match(validate({ ...okJson, items: [{ kind: 'mystery', area: 'A', text: 't' }] }), /kind/);
  });

  it('errors when tech item lacks category', () => {
    assert.match(validate({ ...okJson, items: [{ kind: 'tech', text: 't' }] }), /category/);
  });

  it('errors when non-tech item lacks area', () => {
    assert.match(validate({ ...okJson, items: [{ kind: 'new', text: 't' }] }), /area/);
  });

  it('errors when item lacks text', () => {
    assert.match(validate({ ...okJson, items: [{ kind: 'new', area: 'A' }] }), /text/);
  });

  it('errors when capabilities is not an array of strings', () => {
    assert.match(validate({ ...okJson, capabilities: 'oops' }), /capabilities/);
    assert.match(validate({ ...okJson, capabilities: [123] }), /capabilities/);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
node --test .claude/logs/test/telegram-devnote.test.mjs 2>&1 | tail -8
```
Expected: FAIL.

- [ ] **Step 3: Add `validate`**

Append to `.claude/logs/telegram-devnote.mjs`:

```js
export function validate(json) {
  if (!json || typeof json.theme !== 'string' || !json.theme.trim()) return 'theme must be a non-empty string';
  if (!Array.isArray(json.items) || !json.items.length) return 'items must be a non-empty array';
  for (let i = 0; i < json.items.length; i++) {
    const item = json.items[i];
    if (!KIND_ORDER.includes(item.kind)) return `items[${i}].kind must be one of ${KIND_ORDER.join(', ')}`;
    if (typeof item.text !== 'string' || !item.text.trim()) return `items[${i}].text must be a non-empty string`;
    if (item.kind === 'tech') {
      if (typeof item.category !== 'string' || !item.category.trim()) return `items[${i}].category required for tech kind`;
    } else {
      if (typeof item.area !== 'string' || !item.area.trim()) return `items[${i}].area required for ${item.kind} kind`;
    }
  }
  if (json.capabilities !== undefined) {
    if (!Array.isArray(json.capabilities)) return 'capabilities must be an array';
    for (let i = 0; i < json.capabilities.length; i++) {
      if (typeof json.capabilities[i] !== 'string') return `capabilities[${i}] must be a string`;
    }
  }
  return null;
}
```

- [ ] **Step 4: Run tests**

```bash
node --test .claude/logs/test/telegram-devnote.test.mjs 2>&1 | tail -8
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add .claude/logs/telegram-devnote.mjs .claude/logs/test/telegram-devnote.test.mjs
git commit -m "feat(devnote): validate — schema check matching slack-devnote shape"
```

---

## Task 6: sendTelegram (with mocked fetch)

**Files:**
- Modify: `.claude/logs/telegram-devnote.mjs`
- Modify: `.claude/logs/test/telegram-devnote.test.mjs`

- [ ] **Step 1: Write failing test**

Append:

```js
import { sendTelegram } from '../telegram-devnote.mjs';

describe('sendTelegram', () => {
  it('POSTs to Telegram API with HTML parse_mode', async () => {
    const calls = [];
    const fakeFetch = async (url, init) => {
      calls.push({ url, init });
      return { ok: true, json: async () => ({ ok: true, result: { message_id: 1 } }) };
    };
    await sendTelegram(fakeFetch, 'TOKEN', 12345, 'hello');
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.includes('https://api.telegram.org/botTOKEN/sendMessage'));
    const body = JSON.parse(calls[0].init.body);
    assert.equal(body.chat_id, 12345);
    assert.equal(body.text, 'hello');
    assert.equal(body.parse_mode, 'HTML');
    assert.equal(body.disable_web_page_preview, true);
  });

  it('throws on HTTP non-2xx', async () => {
    const fakeFetch = async () => ({ ok: false, status: 400, text: async () => '{"ok":false,"description":"bad"}' });
    await assert.rejects(() => sendTelegram(fakeFetch, 'T', 1, 'x'), /400/);
  });

  it('throws on ok:false response', async () => {
    const fakeFetch = async () => ({ ok: true, json: async () => ({ ok: false, description: 'oops' }) });
    await assert.rejects(() => sendTelegram(fakeFetch, 'T', 1, 'x'), /oops/);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
node --test .claude/logs/test/telegram-devnote.test.mjs 2>&1 | tail -8
```
Expected: FAIL.

- [ ] **Step 3: Add `sendTelegram`**

Append to `.claude/logs/telegram-devnote.mjs`:

```js
export async function sendTelegram(fetchImpl, token, chatId, text) {
  const res = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram HTTP ${res.status}: ${body}`);
  }
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram API error: ${data.description ?? 'unknown'}`);
  return data.result;
}
```

- [ ] **Step 4: Run tests**

```bash
node --test .claude/logs/test/telegram-devnote.test.mjs 2>&1 | tail -8
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add .claude/logs/telegram-devnote.mjs .claude/logs/test/telegram-devnote.test.mjs
git commit -m "feat(devnote): sendTelegram — HTML parse_mode POST with error handling"
```

---

## Task 7: CLI entry

**Files:**
- Modify: `.claude/logs/telegram-devnote.mjs`

- [ ] **Step 1: Add CLI block at the bottom**

Append to `.claude/logs/telegram-devnote.mjs`:

```js
// ── CLI ─────────────────────────────────────────────────────────────────────
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { argv, exit } from 'node:process';

function todayDDMMYY() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

async function main() {
  const args = argv.slice(2);
  const dry = args.includes('--dry');
  const filePath = args.find(a => !a.startsWith('--'));
  if (!filePath) {
    console.error('usage: node telegram-devnote.mjs <items.json> [--dry]');
    exit(1);
  }

  let json;
  try {
    json = JSON.parse(await readFile(filePath, 'utf8'));
  } catch (err) {
    console.error(`failed to read/parse ${filePath}: ${err.message}`);
    exit(1);
  }

  const error = validate(json);
  if (error) {
    console.error(`validation: ${error}`);
    exit(1);
  }

  const message = renderMessage(json, { date: todayDDMMYY() });
  const parts = splitForTelegram(message, 4000);

  const token = process.env.TELEGRAM_DEVNOTE_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
  const chatId = Number(process.env.TELEGRAM_DEVNOTE_CHAT_ID ?? 109577644);

  if (dry) {
    console.log(`[dry] parts=${parts.length} chat=${chatId} token=${token ? 'present' : 'missing'}`);
    for (let i = 0; i < parts.length; i++) {
      console.log(`--- part ${i + 1}/${parts.length} (${parts[i].length} chars) ---`);
      console.log(parts[i]);
    }
    return;
  }

  if (!token) {
    console.error('TELEGRAM_DEVNOTE_BOT_TOKEN or TELEGRAM_BOT_TOKEN must be set');
    exit(1);
  }

  for (let i = 0; i < parts.length; i++) {
    try {
      const result = await sendTelegram(fetch, token, chatId, parts[i]);
      console.log(`[post] part ${i + 1}/${parts.length} message_id=${result.message_id}`);
    } catch (err) {
      console.error(`[post] part ${i + 1}/${parts.length} failed: ${err.message}`);
      exit(2);
    }
  }
}

if (import.meta.url === `file://${fileURLToPath(import.meta.url).replace(/\\/g, '/')}` || argv[1]?.endsWith('telegram-devnote.mjs')) {
  main();
}
```

- [ ] **Step 2: Smoke `--dry` against the existing BEK simplification JSON**

```bash
cd D:/dev2/projects/provodnik
node .claude/logs/telegram-devnote.mjs .claude/logs/devnote-2026-04-24-bek-simplification.json --dry 2>&1 | head -80
```
Expected: prints `[dry] parts=N chat=109577644 token=...` then the rendered HTML preview. No errors.

- [ ] **Step 3: Verify all module tests still pass**

```bash
node --test .claude/logs/test/telegram-devnote.test.mjs 2>&1 | tail -8
```
Expected: all pass (CLI doesn't have its own tests; verified by smoke).

- [ ] **Step 4: Commit**

```bash
git add .claude/logs/telegram-devnote.mjs
git commit -m "feat(devnote): CLI entry — argv parsing, --dry mode, env-var credentials"
```

---

## Task 8: Live smoke against the BEK dev-note

**Files:** none (verification task).

- [ ] **Step 1: Confirm the right token env var is set**

```bash
node -e "console.log('TELEGRAM_DEVNOTE_BOT_TOKEN:', process.env.TELEGRAM_DEVNOTE_BOT_TOKEN ? 'set' : 'missing'); console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'set' : 'missing')"
```

If neither is set, ask the user which token to use. The dev-chat fallback is `chat_id 109577644`. Reuse the BEK bot token from `.claude/bek/bek.config.json` if appropriate (but DO NOT print it).

- [ ] **Step 2: Re-run --dry**

```bash
node .claude/logs/telegram-devnote.mjs .claude/logs/devnote-2026-04-24-bek-simplification.json --dry 2>&1 | tail -40
```

Read the rendered output. Confirm:
- Title line correct.
- Each `kind` group present once with right header emoji.
- Items sorted within section as authored.
- Capabilities block absent (the BEK dev-note JSON doesn't have one).
- No raw `<` or `>` from item text.
- Char count under 4000 (single message expected).

- [ ] **Step 3: Send for real**

```bash
node .claude/logs/telegram-devnote.mjs .claude/logs/devnote-2026-04-24-bek-simplification.json 2>&1 | tail -5
```
Expected: `[post] part 1/1 message_id=<N>`. Open Telegram and visually verify it renders cleanly.

- [ ] **Step 4: If render is wrong, iterate**

If anything looks off (escape failure, missing section, awkward spacing), fix the renderer in `.claude/logs/telegram-devnote.mjs`, re-run `--dry` to confirm, then re-send. Each iteration commits as `fix(devnote): ...`.

- [ ] **Step 5: Document the new command**

Edit project `.claude/CLAUDE.md`. Find the Slack section under "Post-Work Protocol". After the description of `slack-devnote.mjs`, add a paragraph:

```markdown
**Telegram mirror:** after the Slack post, send the same JSON to Telegram via:
```
node .claude/logs/telegram-devnote.mjs <items.json> [--dry]
```
Renders Telegram HTML, splits at 4000 chars, posts to chat 109577644 (override via TELEGRAM_DEVNOTE_CHAT_ID). Token from TELEGRAM_DEVNOTE_BOT_TOKEN, falls back to TELEGRAM_BOT_TOKEN. Always posts fresh — no edit, no state file.
```

- [ ] **Step 6: Commit doc + final marker**

```bash
git add .claude/CLAUDE.md
git commit -m "docs: add telegram-devnote.mjs to post-work protocol"
git commit --allow-empty -m "chore(devnote): telegram mirror complete"
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Task |
|---|---|
| §3 CLI (`<items.json>`, `--dry`, exit codes) | 7 |
| §4 Token + chat env-var | 7 |
| §5 Layout (sections in order, capabilities at end) | 2, 3 |
| §6 HTML escaping | 1, 2, 3 |
| §7 Splitting at 4000 chars + (N/M) | 4 |
| §8 sendMessage POST shape | 6 |
| §9 hours not rendered (and not required) | 3 (assertion), 5 (no hours rule) |
| §10 Validation | 5 |
| §11 Tests in `.claude/logs/test/` | every code task |
| §12 Doc update in `.claude/CLAUDE.md` | 8 |

No gaps.

**Placeholder scan:** none. All code blocks complete. All commands exact.

**Type consistency:** `splitForTelegram(message, limit)` signature consistent in tests + impl + CLI call. `sendTelegram(fetchImpl, token, chatId, text)` consistent in test mock + impl + CLI use of native `fetch`. `validate(json)` returns `null | string`, used correctly in CLI (`if (error)`).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-24-telegram-devnote.md`.

Per current session preference (inline execution, no cursor-agent / subagent dispatch), I'll proceed straight into `superpowers:executing-plans` if you say go.
