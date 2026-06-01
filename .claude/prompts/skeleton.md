# Cursor SDK task — Provodnik

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
- **Repo root:** `/Users/idev/quantumbek/orchestrator/apps/provodnik/code` (macmini — per BOOTSTRAP §2, the orchestrator runtime hosts the product code under its `apps/` tree).
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

- List every file you edited (relative paths, comma-separated) — in `files_touched` of the STATUS block below.
- Report any unexpected finding (out-of-scope bug, surprising existing code, ambiguous requirement) — in `verification_output` or as a NEEDS_CONTEXT escalation if the finding blocks correct implementation.
- Do NOT run any shell command. Do NOT commit. The orchestrator handles git + verify chain.

{{SHELL_BAN}}

## STATUS CONTRACT

End your work with a single ```json``` code block under a `## STATUS` heading. The orchestrator parses this via `bot/lib/cursor-status.mjs` (zod schema). Do not include any other STATUS block, prose summary, or markdown outside this contract.

Required shape:

```json
{
  "status": "DONE" | "BLOCKED" | "NEEDS_CONTEXT",
  "files_touched": ["string"],
  "commit_sha": "string?",
  "verification_output": "string?",
  "blocker_reason": "string?",
  "needs_context_question": "string?"
}
```

Field rules:

- `status = "DONE"` requires `files_touched` (≥1 file unless this is a read-only investigation). `commit_sha` is optional — the orchestrator handles commits.
- `status = "BLOCKED"` requires `blocker_reason` (one sentence: what you cannot proceed past). Pair with the SOS rule from HOT-NEW SOS Бек: never silently work around a blocker; never expand scope to fix it; never report DONE while a block is unresolved.
- `status = "NEEDS_CONTEXT"` requires `needs_context_question` (specific + answerable) AND `files_touched: []` (do not write anything — see the next section).

Verification (`typecheck`, `lint`, focused tests, browser smoke) is the **orchestrator's** job, not yours. `verification_output` is optional context only — for a TDD RED step include the failing test output proving the failure is on the assertion line, not a crash.

## NEEDS_CONTEXT — escape hatch

Return `status = "NEEDS_CONTEXT"` and stop without writing any file when ANY of:

- The KNOWLEDGE block is empty when this task touches an unfamiliar API
- A required file in the Source excerpts section is not present in the worktree
- The TASK description references a symbol that doesn't grep in SCOPE
- A pattern reference file is missing or doesn't show the claimed pattern

Phrasing for `needs_context_question` — be specific. Bad: `"more context please"`. Good: `"AP-014 forbids client-side imports from server-only modules — getGuideReviewDetail lives in src/data/server/moderation.ts. May I import it into the 'use client' page at src/app/admin/guides/[id]/page.tsx?"`.

The orchestrator routes NEEDS_CONTEXT to ESCALATED via `bot/lib/escalation-class.mjs` (parallel to PRODUCT_DECISION). The director answers in the epic topic; `/resume` re-dispatches with the extended KNOWLEDGE block. **Do not improvise around missing context** — silent improvisation is the failure mode that drove the 2026-04 Orientir name-hallucination class of incidents.
