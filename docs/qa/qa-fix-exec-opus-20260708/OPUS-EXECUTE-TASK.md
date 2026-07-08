# Opus Execution Task — implement all booking/offer QA fix plan tasks

You are working in `/tmp/provodnik-qa-fix-exec-opus` on branch `fix/booking-offer-qa-fixes-20260708`, based on production main commit `45ccbb50`.

## Required first sentence in final response

Start your final response with exactly:

> I'm using the executing-plans skill to implement this plan.

## Goal

Implement every task in the plan file:

`docs/superpowers/plans/2026-07-08-provodnik-booking-offer-qa-fixes.md`

Fix all seven production QA issues covered by that plan:

1. Traveler confirmed booking card renders full summary, not only `—`.
2. New-offer notification/deep link no longer opens missing request / 404 content for the traveler path.
3. Confirmed booking contact card distinguishes missing contacts from load failure and restores QA fixture safety as needed.
4. Public homepage hero/city images stop returning 400.
5. Admin booking rows become clickable and expose booking detail/admin action path per plan.
6. Guide availability pause/resume events appear in admin audit/moderation history per plan.
7. Guide `/messages` empty-state copy becomes role-aware.

## Required skills / tools inside Claude

Use:
- `superpowers:executing-plans`
- `superpowers:test-driven-development` where tests are added/changed
- `superpowers:verification-before-completion`
- Context7 for Next.js/React/Supabase API details when touching those integration points
- Ponytail review/audit if available before finalizing

Final report must say how these were used or, if one is unavailable, what fallback was used.

## Source of truth

Read first:

1. `CLAUDE.md`
2. `.claude/CLAUDE.md` if present
3. `AGENTS.md`
4. The implementation plan above
5. QA reports copied here:
   - `docs/qa/qa-fix-exec-opus-20260708/admin-report.md`
   - `docs/qa/qa-fix-exec-opus-20260708/guide-report.md`
   - `docs/qa/qa-fix-exec-opus-20260708/traveler-report.md`

## Execution rules

- Implement product code, tests, scripts, migrations/assets only as needed by the plan.
- Follow the plan task-by-task, but adapt if source reality requires it; document deviations.
- Do not push.
- Do not deploy.
- Do not run production DB writes. If a production data repair is needed, create targeted SQL/migration/runbook artifacts and mark production application as a follow-up unless explicitly safe in local/test.
- Do not print secrets, env values, raw passwords, API keys, tokens, or cookies.
- Preserve existing unrelated dirty files if any appear.
- Commit meaningful completed batches locally. Use project commit style. No automation/co-author trailers.
- If a gate is too large or blocked, still run the narrower task-level verification and state the blocker clearly; do not claim full completion without evidence.

## Required verification

At minimum run and report exact results for:

- Relevant task-level tests introduced/changed by the plan.
- `bun run typecheck`
- `bun run lint`
- `bun run test:run`
- `bun run build`

Run Playwright/browser smoke if feasible in this worktree. If Playwright is blocked by env or time, write the exact command and blocker, and produce enough lower-level evidence not to fake browser proof.

## Required final report

Print:

1. Files changed grouped by task.
2. Commits created, with hashes.
3. Exact verification commands and results.
4. Which of the seven QA issues are fixed vs blocked/partial.
5. Any DB/production follow-up steps required.
6. Current branch, final `git status --short`, and whether anything remains uncommitted.
