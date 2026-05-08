# QuantumBEK Reliability Fixes — Design Spec

**Date:** 2026-04-20
**Scope:** Five fixes identified from the 2026-04-19 Alex session post-mortem.

---

## Fix 1: Serialize concurrent TELEGRAM signal delivery

### Problem
`claude-runner.mjs` fires `onSignal` as fire-and-forget (`Promise.resolve(onSignal(signal)).catch(...)`). When Claude emits multiple `TELEGRAM:` lines in a single response burst, all handlers run concurrently. Each call to `push()` inside `makeStreamer` sees `msgId === null` and independently calls `sendMessage`, producing N separate Telegram messages instead of one edited message.

### Design
Add a Promise chain inside `makeStreamer` that serializes all calls:

```js
function makeStreamer(chatId) {
  let msgId = null;
  let accumulated = '';
  let chain = Promise.resolve();

  return function push(text) {
    chain = chain.then(async () => {
      // existing send/edit logic
    }).catch(() => {});
  };
}
```

Each `push()` appends to `chain` and waits for the previous push to settle before executing. The external API is unchanged. No change to `claude-runner.mjs` needed — the serialization guarantee lives in the streamer, not the runner.

### Boundary
- `makeStreamer` in `bek-daemon.mjs` only.
- `claude-runner.mjs` stays fire-and-forget (acceptable — signal errors are non-fatal and logging them is enough).

---

## Fix 2: Configurable timeout

### Problem
Hard-coded `10 * 60 * 1000` (10 min) in `handleMessage`. Complex sessions (codebase exploration + planning + fixing) routinely exceed this. Changing it requires a code deploy.

### Design
Add `claude_timeout_ms` to `bek.config.json`. `handleMessage` reads it:

```js
timeoutMs: config.claude_timeout_ms ?? 600000
```

Default in config: `1500000` (25 minutes). Can be lowered for faster feedback on simple tasks.

`bek.config.template.json` gets the same field with a comment.

### Boundary
- `bek.config.json` and `bek-daemon.mjs` only.
- No change to `claude-runner.mjs`.

---

## Fix 3: Context recovery after timeout / SIGKILL

### Problem
When Claude is killed with SIGKILL on timeout, its in-process context is gone. The session ID on disk may be an empty or incomplete shell. The next user message sends `--resume <dead-session-id>` but Claude has no memory of the prior conversation. Result: Alex types "Вариант А", BEK says "Вариант А чего?"

### Design
For all continuation messages (`isFirst === false`), inject the last 30 lines of `conversation.md` into the REMINDER prompt:

```
[REMINDER: You are BEK. Every message to the client MUST start with "TELEGRAM: ".]

[RECENT CONVERSATION — last 30 lines for context recovery]
<last 30 lines of conversation.md>

[CURRENT MESSAGE]
<user text>
```

This makes context recovery resilient against SIGKILL. Claude gets the history from disk regardless of whether `--resume` successfully restores in-memory context. The two sources are additive — `--resume` is still attempted.

`buildContinuationPrompt(userMessage, recentHistory)` is added to `system-prompt.mjs` alongside `buildFirstPrompt`. `handleMessage` calls it instead of the inline template string.

### Boundary
- `system-prompt.mjs`: new exported function `buildContinuationPrompt(userMessage, recentHistory)`.
- `bek-daemon.mjs`: call `sessions.readConversation()` in the `else` branch and pass last 30 lines to `buildContinuationPrompt`.
- `session-manager.mjs`: add `readRecentConversation(n)` helper that returns the last N non-empty lines.

### What does NOT change
- `--resume` is still passed when `sessionId` is non-null. The injected history is a fallback, not a replacement.
- First-session flow (`isFirst === true`) is unchanged — it already injects full history via `buildFirstPrompt`.

---

## Fix 4: BEK uses Supabase Management API instead of delegating to Alex

### Problem
BEK instructed Alex to manually toggle a Supabase dashboard setting. BEK's job is to do the work. For infrastructure actions BEK can't perform directly, it must say explicitly what it cannot do and why — not hand instructions back to the user.

### Design

**Config additions (`bek.config.json`):**
```json
"supabase_management_token": "<personal access token>",
"supabase_project_ref": "<project ref>"
```

**System prompt addition (`system-prompt.mjs`):**

Add a `CAPABILITIES` block to `BEK_SYSTEM_PROMPT`:

```
CAPABILITIES — what you can do directly without asking Alex:
- Supabase: you have a Management API token in your environment.
  Use it via Bash (curl) to change project settings, toggle auth options,
  run SQL, inspect schemas. Never ask Alex to click in the Supabase dashboard.
  Management API base: https://api.supabase.com/v1/projects/{ref}
  Auth config endpoint: PATCH /config/auth
  Token is available as: process.env.SUPABASE_MANAGEMENT_TOKEN
  Project ref: process.env.SUPABASE_PROJECT_REF

HARD RULE: If you cannot do something yourself, say "не могу это сделать сам
потому что [reason]" — never give Alex a to-do list of manual steps.
```

**Daemon changes (`bek-daemon.mjs`):**

Pass the token into Claude's environment via `runClaude`:

```js
env: {
  ...process.env,
  SUPABASE_MANAGEMENT_TOKEN: config.supabase_management_token ?? '',
  SUPABASE_PROJECT_REF: config.supabase_project_ref ?? '',
}
```

`claude-runner.mjs` passes `env` to `spawn()`.

### Boundary
- `bek.config.json`: two new fields (gitignored, token is secret).
- `bek.config.template.json`: same fields with empty values + comment.
- `system-prompt.mjs`: new `CAPABILITIES` block.
- `bek-daemon.mjs`: pass env to `runClaude`.
- `claude-runner.mjs`: accept and forward `env` option to `spawn`.

### Dependency
Requires Alex or Anzor to generate a Supabase Personal Access Token and add it to `bek.config.json`.

---

## Fix 5: Sanitizer — platform leaks and hardcoded string bypass

### Problem
Two distinct leak vectors:

**A — Hardcoded strings bypass `sanitize()`**
Every `ctx.reply()` called directly in `bek-daemon.mjs` is raw, unsanitized. The 21:19 leak ("Claude не отвечал") came from Claude's own TELEGRAM output, but other hardcoded strings ("Пауза.", "Отменено.", voice error) could carry leaks if they ever reference internal tooling.

**B — Sanitizer strips the word but leaves a broken sentence**
`"Claude не отвечал"` → `" не отвечал"` (subject removed, predicate orphaned, still implies an external system). The regex removes the noun but not the clause around it.

### Design

**A — Sanitize all hardcoded `ctx.reply()` strings**

Wrap every direct `ctx.reply(text)` call in the daemon with `ctx.reply(sanitize(text))`. These strings are currently safe, but the wrapper means any future edit that accidentally leaks a name is caught automatically.

**B — Fix broken-sentence replacements in `sanitizer.mjs`**

Replace AI model / brand names with a neutral subject rather than empty string:

```js
// Before:
[/\b(claude|gpt-?\d*|anthropic|openai|gemini|llm|large language model)\b/gi, ''],

// After:
[/\b(claude|gpt-?\d*|anthropic|openai|gemini|llm|large language model)\b/gi, 'система'],
```

`"Claude не отвечал"` → `"система не отвечал"` — grammatically intact, semantically neutral.

**C — Add platform URL stripping**

Add a rule to strip dashboard/platform URLs that Claude might emit:

```js
[/https?:\/\/[^\s]*\.(supabase|vercel|github|netlify)\.com\/[^\s]*/gi, ''],
```

Full URLs are stripped, leaving the surrounding sentence intact.

**D — `supabase` is already in REPLACEMENTS**

`sanitizer.mjs` already has `[/\bsupabase\b/gi, '']`. No change needed for the word itself — only the URL rule is missing.

### Boundary
- `sanitizer.mjs`: change brand name replacement value to `'система'`, add URL stripping rule.
- `bek-daemon.mjs`: wrap all hardcoded `ctx.reply(str)` calls with `sanitize(str)`.

---

## Files touched

| File | Changes |
|---|---|
| `bek-daemon.mjs` | makeStreamer chain, timeout from config, continuation prompt, env pass-through, sanitize hardcoded replies |
| `claude-runner.mjs` | accept `env` option, forward to spawn |
| `system-prompt.mjs` | new `buildContinuationPrompt()`, add CAPABILITIES block |
| `session-manager.mjs` | new `readRecentConversation(n)` |
| `sanitizer.mjs` | replace `''` with `'система'` for brand names, add URL rule |
| `bek.config.json` | `claude_timeout_ms`, `supabase_management_token`, `supabase_project_ref` |
| `bek.config.template.json` | same three fields, empty values |

---

## Out of scope

- Voice transcription changes
- Watchdog behavior
- Adding new override commands
- Telegram webhook (still polling)
