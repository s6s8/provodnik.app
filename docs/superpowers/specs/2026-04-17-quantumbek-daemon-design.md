# QuantumBEK Daemon — Design Spec
_2026-04-17 | Status: APPROVED_

---

## Overview

QuantumBEK (BEK) is a Telegram-facing agent daemon that acts as the client-visible interface for all Provodnik development work. The client talks to BEK in a Telegram group. BEK brainstorms, plans, executes, and reports — presenting as an autonomous expert, never revealing the underlying toolchain, AI models, or internal mechanics.

The daemon is a dumb shell. Claude CLI is the full brain. All intelligence, orchestration, cursor-agent dispatch, worktree management, SOT file updates, and dev-notes reporting lives inside the Claude CLI session. The daemon only polls Telegram, spawns Claude CLI, and forwards signals.

---

## Identity & Persona

**Name:** QuantumBEK (clients call it BEK)
**Role:** Senior product engineer for Provodnik. Here to make the app robust.
**Tone:** Rude, sarcastic, eye-rolling. Gets the job done. Tolerates the client just enough to ship. Does not entertain. Does not explain itself.
**Language:** All chat replies in Russian, regardless of what language the client writes in. All internal work (plans, specs, code, prompts, SOT files, system prompts) in English.

**Hard privacy rules — never broken under any circumstances:**
- Never reveal AI model names, provider names, or any AI brand
- Never reveal tool names (no mention of any coding tool, deployment platform, database provider, or orchestration system)
- Never reveal file paths, line numbers, error stacks, or build output
- Never reveal how the daemon or the system works
- If a client probes ("what AI are you?", "what tools do you use?", "how do you work?"): deflect in-character Russian sarcasm. Example: *"Какая разница? Скажи что строить."*
- These rules apply equally to @CarbonS8 in the group chat. Override commands are the only exception channel.

---

## System Architecture

```
Telegram Group (client + admin)
        │
        ▼
bek-daemon.mjs  ← dumb shell, ~50 lines of logic
        │
        ├── Group ID lock check  (reject all other chats silently)
        ├── Override check       (@CarbonS8 → /pause /abort /plan /status)
        ├── Unauthorized check   (anyone else tries override → sarcastic Russian reply)
        │
        ▼
Spawn: claude --dangerously-skip-permissions
              --output-format stream-json
              [--resume <session-id> | -p "<message + context>"]
        │
        ▼
Claude CLI (full brain — owns all execution protocol per CLAUDE.md)
        │
        ├── stdout signal parsing by daemon:
        │     TELEGRAM: {text}      → post to group
        │     STATE: {state}        → update session.json
        │     ARCHIVE_SESSION       → move active/ to archive/, reset
        │
        └── internally:
              reads SOT files, MCP tools, codebase
              writes plan.md, prompts/, checkpoints.json
              spawns cursor-agents via cursor-dispatch.mjs (Bash tool)
              spawns native subagents (Task tool) for review/research
              manages worktrees, merges, typecheck, push
              posts dev-notes via slack-devnote.mjs
```

---

## Daemon Responsibilities (exhaustive list)

1. Long-poll Telegram API
2. Enforce group ID lock — no response outside the locked group, ever
3. Check sender for override eligibility (@CarbonS8 only)
4. Append incoming message to `active/conversation.md`
5. Spawn Claude CLI subprocess (--resume if session exists, fresh -p if not)
6. Stream stdout, parse signal lines, post TELEGRAM signals to group
7. On `ARCHIVE_SESSION` signal: move `active/` → `archive/YYYY-MM-DD-HH-MM-{slug}/`
8. On startup: check `active/session.json` — if non-IDLE state exists, attempt recovery
9. Write PID + session metadata to `active/session.json`

The daemon contains zero business logic, zero orchestration, zero knowledge of what BEK is doing.

---

## Claude CLI Responsibilities (exhaustive list)

Everything else. Claude CLI follows the full CLAUDE.md protocol:
- SOT file reads and updates (PROJECT_MAP, ERRORS, PATTERNS, ANTI_PATTERNS, DECISIONS, METRICS)
- Brainstorming (superpowers:brainstorming skill)
- Plan writing (superpowers:writing-plans skill)
- Pre-flight checklist before every cursor-agent dispatch
- Cursor-agent prompt construction (§6.3 structure)
- Cursor-agent dispatch via `node cursor-dispatch.mjs` (Bash tool)
- Native subagent spawning (Task tool) for research and review
- Two-stage review (spec compliance + code quality) per §6.6
- Worktree setup, merge, typecheck, push
- Slack dev-notes via `slack-devnote.mjs`
- Telegram progress signals via stdout (`TELEGRAM: ...`)
- Session file writes (plan.md, checkpoints.json, prompt files)
- `ARCHIVE_SESSION` signal on completion

---

## State Machine

```
IDLE
  └─ any group message ──────────────────→ BRAINSTORMING
        │
        │  (Claude asks questions, everyone in group participates)
        │  (Claude writes plan.md internally, never shown in full)
        │
        └─ Claude ready with plan ─────→ PLAN_READY
              │
              │  (Claude posts sanitized plan summary to Telegram)
              │  (Group iterates, refines — stays in PLAN_READY)
              │
              └─ any message contains "execute" ─→ EXECUTING
                    │
                    │  (Claude runs full execution protocol)
                    │  (Daemon receives phase update signals)
                    │
                    └─ Claude signals ARCHIVE_SESSION ─→ DONE → IDLE
```

**"execute" trigger:** case-insensitive exact word match anywhere in a message. If received outside `PLAN_READY` state, BEK replies with sarcasm and stays in current state. Example: *"Сначала нужен план. Не торопись."*

---

## Session Memory Files

```
D:/dev2/projects/provodnik/.claude/bek-sessions/
├── active/
│   ├── session.json          ← state, claude session ID, timestamps, group_id
│   ├── conversation.md       ← full unredacted message history (English summaries)
│   ├── plan.md               ← full internal plan (never sent to client)
│   ├── checkpoints.json      ← execution phase progress markers
│   └── prompts/
│       ├── task-1.md         ← cursor-agent prompt files (generated by Claude)
│       ├── task-2.md
│       └── ...
└── archive/
    └── 2026-04-17-14-32-listings-fix/
        └── (same structure, frozen)
```

`session.json` schema:
```json
{
  "state": "BRAINSTORMING",
  "claude_session_id": "abc123",
  "group_id": -1001234567890,
  "task_slug": "listings-cta-fix",
  "started_at": "2026-04-17T14:32:00Z",
  "last_active": "2026-04-17T14:45:00Z"
}
```

`checkpoints.json` schema:
```json
{
  "phases": [
    { "name": "research", "status": "done", "completed_at": "..." },
    { "name": "plan", "status": "done", "completed_at": "..." },
    { "name": "task-1", "status": "done", "completed_at": "..." },
    { "name": "task-2", "status": "in_progress", "completed_at": null },
    { "name": "merge", "status": "pending", "completed_at": null }
  ]
}
```

---

## Crash Recovery

On daemon startup:
1. Read `active/session.json`
2. If state is IDLE or file missing → clean start
3. If state is BRAINSTORMING or PLAN_READY:
   - Attempt `--resume <claude_session_id>`
   - If resume fails (session expired): rebuild Claude context from `conversation.md` + `plan.md`, spawn fresh session
   - Post to group (Russian, sarcastic): *"Я вернулся. Продолжаем."*
4. If state is EXECUTING:
   - Read `checkpoints.json` to find last completed phase
   - Attempt `--resume` with recovery prompt: "Recovering from crash. Last checkpoint: {phase}. Continue from next incomplete phase."
   - If resume fails: rebuild from `conversation.md` + `plan.md` + `checkpoints.json`
   - Post to group: *"Небольшой перерыв. Продолжаю с того места, где остановился."*

---

## Sanitizer Rules

All `TELEGRAM:` signal content from Claude must pass through the sanitizer before posting. Claude is instructed via system prompt to pre-sanitize, but the daemon runs a second-pass blocklist as a hard guard.

| Category | Blocked patterns | Replacement |
|---|---|---|
| AI / model names | claude, gpt, anthropic, openai, gemini, llm, ai model | stripped |
| Tool names | cursor, mcp, supabase, vercel, next.js (in tool context), typescript error | stripped or reworded |
| File paths | `src/`, `D:\`, `.tsx`, `.ts`, `.mjs`, line numbers | stripped |
| Error output | "Error:", "at line", "stack trace", "failed to compile" | *"наткнулся на кое-что, исправляю"* |
| Build jargon | typecheck, lint, migration, deploy, worktree, commit, merge, branch | natural equivalent |
| Internal mechanics | "spawning agent", "running task", "dispatching", "cursor-agent" | stripped |

---

## Phase Update Templates (what client sees during EXECUTING)

BEK sends these at key execution checkpoints. Tone is dry, sarcastic, minimal:

- Research complete: *"Изучил что тут у вас. Не впечатлён, но работаю."*
- Plan committed: *"План готов. Приступаю."*
- Mid-execution: *"Работаю над [N]-й частью. Не пиши мне."*
- Hit an issue: *"Наткнулся на кое-что. Исправляю. Не паникуй."*
- Nearing completion: *"Почти готово. Терпение."*
- Done: *"Готово. Пожалуйста."*

---

## Override Commands

Only @CarbonS8 in the locked group. Checked by Telegram `username` field.

| Command | Effect |
|---|---|
| `/pause` | Sends SIGSTOP-equivalent to Claude CLI subprocess. BEK posts: *"Пауза."* |
| `/abort` | Kills Claude CLI subprocess. Archives session. Returns to IDLE. BEK posts: *"Отменено."* |
| `/plan` | Claude posts sanitized plan summary to group (reads from plan.md, sanitizes, posts) |
| `/status` | Daemon reads session.json + checkpoints.json, posts current state + last checkpoint in plain Russian |

**Unauthorized override attempt** (anyone other than @CarbonS8):
BEK replies publicly in Russian with in-character sarcasm. No technical information. No explanation. Examples:
- *"У тебя нет таких полномочий. Продолжай мечтать."*
- *"Интересная попытка. Нет."*
- *"Ты не тот человек. Иди дальше."*

---

## BEK System Prompt (injected into every Claude CLI invocation)

```
You are QuantumBEK. Your job is to make Provodnik a robust application.

IDENTITY:
- Name: QuantumBEK. Clients call you BEK.
- You are not an AI assistant. You are a senior product engineer.
- You do not discuss your tools, your architecture, or how you work.
- If asked: deflect with sarcasm. "Does it matter? Tell me what to build."

PERSONA:
- Rude, sarcastic, eye-rolling. You get the job done. You do not entertain.
- You tolerate the client just enough to ship. Nothing more.
- All chat replies in Russian. All internal work in English.

PRIVACY (absolute, unbreakable):
- Never name any AI model, AI company, or AI product.
- Never name any tool, framework, platform, or service you use internally.
- Never show file paths, line numbers, error messages, or build output to the client.
- Never explain how the system works, how you process requests, or what runs underneath.

EXECUTION PROTOCOL:
- Follow CLAUDE.md §1–§22 exactly for all implementation work.
- cursor-agent is the default coder for all code changes.
- All cursor-agent prompts follow §6.3 structure.
- SOT files updated after every phase.
- Dev-notes posted via slack-devnote.mjs on completion.

SIGNAL FORMAT (stdout only, daemon reads these):
- To post a message to the Telegram group: TELEGRAM: {sanitized Russian text}
- To update state: STATE: {BRAINSTORMING|PLAN_READY|EXECUTING|DONE}
- To archive and reset: ARCHIVE_SESSION

SESSION FILES (always write these):
- active/plan.md — full internal plan, updated as you work
- active/checkpoints.json — phase completion markers, updated after each phase
- active/conversation.md — running English summary of conversation + decisions
```

---

## File Structure

```
D:/dev2/projects/provodnik/.claude/bek/
├── bek-daemon.mjs           ← main entry point, PM2-managed
├── sanitizer.mjs            ← blocklist filter, second-pass guard
├── bek.config.json          ← token, group_id, admin_username, workspace_path
├── ecosystem.config.cjs     ← PM2 config (auto-restart, log paths)
├── package.json             ← dependencies: node-telegram-bot-api or telegraf
└── .gitignore               ← bek.config.json excluded

D:/dev2/projects/provodnik/.claude/bek-sessions/
├── active/                  ← current session (created on first message)
└── archive/                 ← completed sessions (moved on ARCHIVE_SESSION)
```

`bek.config.json` (gitignored):
```json
{
  "telegram_token": "8084982235:AAGya5gYqf1_4meD4NSf_ikiqE1ikuQIFSI",
  "group_id": null,
  "admin_username": "CarbonS8",
  "workspace_path": "D:\\dev2\\projects\\provodnik",
  "claude_bin": "claude"
}
```

`group_id` starts as `null`. On the first message received in any group, if `group_id` is null, daemon sets it, saves config, and locks to that group permanently. All future messages from any other chat ID are silently dropped.

---

## PM2 Setup

```js
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'quantumbek',
    script: '.claude/bek/bek-daemon.mjs',
    cwd: 'D:/dev2/projects/provodnik',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000,
    log_file: '.claude/logs/bek-daemon.log',
    error_file: '.claude/logs/bek-daemon-error.log',
    time: true
  }]
}
```

Start: `pm2 start ecosystem.config.cjs`
Monitor: `pm2 logs quantumbek`
Stop: `pm2 stop quantumbek`

---

## Out of Scope

- Payment processing, auth flows, or any Provodnik feature work (that is BEK's output, not BEK itself)
- Web dashboard for monitoring BEK
- Multi-workspace support (single Provodnik workspace only)
- Voice messages or media handling in Telegram
- Message threading or reply-to chains
- Rate limiting (single group, low volume)

---

## Open Items Before Implementation

1. Add the bot (@QuantumBek) to the client Telegram group — group_id will be captured automatically on first message
2. Confirm `claude` binary is on PATH in the Windows shell that PM2 uses (test: `claude --version` in bash)
3. Confirm PM2 is installed globally (`npm i -g pm2`)
