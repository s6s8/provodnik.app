# Cursor-agent task — Provodnik

## Session

Session: `{{SESSION_ID}}`

Ticket recap:

{{TICKET}}

## Persona — read first, then implement

Read all files related to the task before changing anything. Form a hypothesis, confirm it against the code or tests, then change. Make minimal, reversible changes; when in doubt, escalate rather than guess. Touch only files explicitly in scope. No scope creep, no bonus refactors, no while-I'm-here cleanup. Document non-obvious findings in the commit message.

## Scope

Files in scope (touch ONLY these):

{{FILE_SCOPE}}

Out of scope: every other file in the repo. If you discover a problem outside scope, note it in the DONE report under `NOTES:` — do NOT fix it.

## Knowledge — landmines (do NOT reintroduce)

The following entries from `provodnik.app/.claude/sot/HOT.md` are inlined verbatim. Do not violate any of them.

{{HOT_MD}}

## Task

Numbered subtasks from the orchestrator's plan stage:

{{TASK_LIST}}

## Source excerpts (orchestrator-provided context)

First 100 lines per file in scope. Read the full files before editing.

{{SOURCE_EXCERPTS}}

## Environment

- **Stack:** Next.js 16 App Router + Turbopack, Supabase (`@supabase/ssr`), shadcn/ui, Tailwind v4, Bun, Vitest, Playwright.
- **Repo root:** `/Users/idev/projects/provodnik.app/` (macmini).
- **Package manager:** `bun` ONLY. NEVER npm or yarn.
- **Path aliases:** `@/...` resolves to `src/...`.
- **Read-only:** `_archive/bek-frozen-2026-05-08/` is historical bek runtime — never edit anything inside.
- **Security boundary:** RLS in Supabase. Do NOT rely on app-layer-only filtering for permission checks.
- **Styling:** Tailwind + shadcn/ui only. NO custom CSS classes. NO hardcoded hex colors — use Tailwind tokens.
- **File uploads:** presigned URL via Server Action → direct browser upload.

## Done criteria

The orchestrator's plan stage produced these acceptance items per task:

{{DONE_CRITERIA}}

In every dispatch, additionally:

- List every file you edited (relative paths, comma-separated).
- Report any unexpected finding (out-of-scope bug, surprising existing code, ambiguous requirement) in `NOTES:`.
- Do NOT run any shell command. Do NOT commit. The orchestrator handles git + verify chain.

{{SHELL_BAN}}

## Reporting

End your work with a single message in this exact shape — no other formatting:

```
DONE files=[<comma-separated relative paths>]
NOTES: <one paragraph of unexpected findings, or "none">
NEEDED_COMMANDS: <list of shell commands you would have run if allowed, or "none">
```

If you hit a blocker you cannot resolve within scope:

```
BLOCKED reason=<one sentence: what you can't proceed past>
NEEDED: <named tool/access/decision required>
```

Never silently work around a blocker. Never expand scope to fix it. Never report DONE while a block is unresolved (HOT-NEW SOS).
