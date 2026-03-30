---
name: provodnik-phase
description: Fire the next Provodnik phase task via Codex — loads PLAN.md, picks the next unchecked item, and fires the right codex exec prompt
---

# Provodnik Phase Runner

Use when: user says "start phase X", "run next task", "do 1.1", "implement auth", etc.

## Step 1 — Read current phase state

```
Read D:\dev\projects\provodnik\PLAN.md
Identify the next unchecked [ ] item
Read D:\dev\projects\codex-ops\state\handoffs\provodnik\handoff.md for blockers
```

## Step 2 — Fire Codex

```bash
codex exec --dangerously-bypass-approvals-and-sandbox "
Read D:\dev\projects\provodnik\provodnik.app\AGENTS.md first.
Read D:\dev\projects\provodnik\DESIGN.md section 6 before touching any UI.
Workspace: D:\dev\projects\provodnik\provodnik.app

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

## Step 3 — After Codex completes

1. Verify commit exists: `git log --oneline -3`
2. Mark item as `[x]` in PLAN.md
3. Update handoff.md Changed Recently section
4. Report to user: commit hash + what was done
