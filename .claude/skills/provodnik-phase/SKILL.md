---
name: provodnik-phase
description: Fire the next Provodnik phase task via Codex — loads PLAN.md, picks the next unchecked item, and fires the right codex exec prompt with superpowers injected
---

# Provodnik Phase Runner

Use when: user says "start phase X", "run next task", "do 1.1", "implement auth", etc.

## Step 1 — Read current phase state

```
Read D:\dev\projects\provodnik\PLAN.md
Identify the next unchecked [ ] item
Read D:\dev\projects\codex-ops\state\handoffs\provodnik\handoff.md for blockers
```

## Step 2 — Pick the right superpowers skill to inject

| Task type | Inject this skill |
|---|---|
| Bug, error, unexpected behavior | `systematic-debugging` |
| New feature / page | `test-driven-development` |
| Multiple independent sub-tasks | `dispatching-parallel-agents` |
| Any task before finishing | `verification-before-completion` |

## Step 3 — Fire Codex

```bash
codex exec --dangerously-bypass-approvals-and-sandbox "
Read D:\dev\projects\provodnik\provodnik.app\AGENTS.md first.
Read D:\dev\projects\provodnik\DESIGN.md section 6 before touching any UI.
Workspace: D:\dev\projects\provodnik\provodnik.app

Before writing any code, read and follow the superpowers skill:
C:\Users\x\.agents\skills\superpowers\<skill-name>\SKILL.md

--- TASK ---
<paste the full PLAN.md task text here>

--- CONSTRAINTS ---
- Use @supabase/ssr (already installed) for all auth — never supabase-js Auth directly
- Fetch library docs via Context7 before writing any Supabase/Next.js API calls
- All styles in src/app/globals.css only — no inline style={{}} for layout
- bun not npm
- Do NOT push — commit only

--- ACCEPTANCE ---
- bun run build passes with zero errors
- bun run typecheck passes
- No inline style={{}} added for layout
- Commit exists with Co-Authored-By line
"
```

## Step 4 — After Codex completes

The CODEX_DONE hook will fire automatically. When it does, invoke `/codex-result` immediately.
Do not wait for the user to ask. /codex-result handles everything:
- Commit verification
- Build + typecheck
- PLAN.md update
- handoff.md update
- Report to user
