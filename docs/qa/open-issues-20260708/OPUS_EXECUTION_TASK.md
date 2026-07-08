# Opus execution task — open issues 33 / 35 / 41–47

Date: 2026-07-08
Workspace: `/tmp/provodnik-open-issues-exec-opus-20260708`
Branch: `fix/open-issues-33-47-opus-20260708`
Base: current `origin/main` at dispatch time (`2fbeae2c`).

## Authorization and scope

The operator explicitly asked: **"Dispatch opus with context7 and ponytail self improving prompt /goal to fix all above issues"**.

You are authorized to edit product code and repo migration files in this isolated worktree. You are **not** authorized to:
- push to GitHub;
- merge PRs;
- deploy to VPS/Vercel;
- run production DB writes, `supabase db push`, or any destructive production command;
- expose secrets or credentials;
- make unrelated refactors.

Local-only code, tests, docs, screenshots, and migration SQL files are allowed.

## Required behavior

Act as a senior product engineer with PM authority for missing decisions. Do **not** ask the operator questions. Use the defaults from `OPUS_PLAN.md` unless you prove they are unsafe.

Required trio:
1. **Superpowers** — use systematic debugging, TDD/verification-before-completion, and keep a visible checklist.
2. **Ponytail** — smallest diff that truly fixes the bug; stdlib/components already present; no new abstractions unless necessary.
3. **Context7** — use it for any third-party API you touch (Next.js, React, Supabase, shadcn/Radix, Playwright, Tailwind). If a fix uses only existing local patterns and no external API ambiguity, state that in the final report; otherwise include Context7 library id and exact doc topic used.

Self-improvement loop:
- Before editing each issue: reproduce or cite evidence from `EVIDENCE_SUMMARY.md` / live screenshots / code.
- Implement the smallest safe fix.
- Run a targeted check for that issue.
- If the check fails, diagnose root cause and patch once before moving on.
- Keep `LEDGER.md` updated with status, files changed, evidence, and blockers.

## Source of truth files to read first

- `CLAUDE.md`
- `AGENTS.md`
- `.claude/CLAUDE.md`
- `.claude/sot/HOT.md`
- `.claude/sot/INDEX.md`
- `docs/qa/open-issues-20260708/OPUS_PLAN.md`
- `docs/qa/open-issues-20260708/PLAN_STATUS.json`
- `docs/qa/open-issues-20260708/EVIDENCE_SUMMARY.md`
- `docs/qa/open-issues-20260708/live/results.json`

## PM decisions to assume

Use these defaults:
- **#42:** E1 — one shared request-level group thread, not exposing private per-guide offer QA by default.
- **#43/#47:** F1 — one Moderation center with tabs; remove/redirect duplicate Admin Listings surface.
- **#44:** G1 — separate admin pipeline tab/view for pre-booking requests/offers, leaving Bookings as confirmed ledger.
- **#41:** full notes/interests are visible to logged-in joined members and owners; anonymous public view remains teaser-level.
- **#45:** surviving button label is `Добавить экскурсию`, blue, always visible in header; remove duplicate empty-state action.
- **#33:** center stats row with identity cluster.
- **#35:** proxy blocks suspended users on mutation/dashboard surfaces with logout/support allowlist; DB/RLS remains the security boundary.

## Issue requirements

### #33 — public guide profile centering
- Fix `src/features/guide/components/public/guide-profile-screen.tsx`.
- Center avatar, verified badge, stats row, and region/city line on the public guide hero.
- Preserve left-aligned bio/tags/buttons readability.

### #45 — guide listing duplicate buttons
- Fix `src/features/guide/components/excursions/guide-excursions-screen.tsx`.
- Make one blue `Добавить экскурсию` action visible in the header.
- Remove duplicate/outline empty-state create action.
- Ensure create sheet still opens in empty and non-empty states.

### #46 — guide listing sheet save visible
- Fix the listing create/edit sheet so the form body scrolls and the footer/save action remains visible on mobile/short viewports.
- Prefer the one-line scroll-region fix from the plan if sufficient.

### #41 — joined open group member sees trip details
- Add a logged-in joined-member view gate if needed.
- Render full request notes and interests for joined members/owner, without overexposing to anonymous visitors unless existing product code already does.
- Add/adjust tests.

### #35 — suspended user restrictions
- Verify existing migration files for active-account enforcement.
- Add a new migration file that extends active-account RLS/write guards to remaining write gaps identified in the plan, especially messages insert and listing/profile/update paths.
- Add app-layer active-account guard/UX for mutation/dashboard surfaces where appropriate.
- Do not apply to production DB. Migration file only.
- Add SQL/tests or code tests where practical; at minimum document exact SQL verification queries in final report.

### #42 — open group shared discussion
- Implement request-level group thread using existing `thread_subject='request'` scaffolding where possible.
- Extend RLS/access so request owner + joined members (+ intended guide audience per safest MVP) can read/write; non-members cannot; suspended users cannot write.
- Do not expose private per-offer QA as the default.
- Add UI to request detail/member/owner surface for group messages.
- Add tests for access/rendering where practical.

### #43/#47 — admin moderation/listings clarity
- Merge duplicate Admin Listings queue into Moderation center, or implement the equivalent lowest-risk version of F1.
- Redirect `/admin/listings` to `/admin/moderation` if the page is removed.
- Update navigation labels/counts accordingly.
- Preserve approval/rejection workflows.

### #44 — admin pre-booking pipeline
- Add a clear admin surface/tab for pending requests/offers before a booking exists.
- Use existing tables/functions where possible; no unnecessary DB view unless simpler/safer.
- Keep Bookings page as confirmed booking ledger.
- Use existing money/date helpers for display.

## Verification gates

Run as much as possible, and be explicit about any gate that cannot run due missing credentials/local DB:

1. `bun install --frozen-lockfile` if dependencies missing.
2. `bun run typecheck`
3. `bun run lint`
4. targeted tests for changed areas (Vitest/RTL/SQL as available)
5. `bun run test:run` if feasible
6. `bun run build`
7. Browser/Playwright screenshots for public routes at desktop + mobile:
   - guide profile sample from evidence
   - request detail sample from evidence
8. Auth-gated QA notes for admin/guide/traveler/suspended flows. If credentials are unavailable, produce a precise manual QA checklist and do not claim live-auth verification.

## Commit/report contract

Commit locally if verification reaches a coherent checkpoint. Prefer one or a small number of human-written commits. Do not push.

Write:
- `docs/qa/open-issues-20260708/OPUS_EXECUTION_REPORT.md`
- update `docs/qa/open-issues-20260708/LEDGER.md`

The report must include:
- issue-by-issue status: fixed / partially fixed / blocked;
- changed files by issue;
- DB migration files and whether applied locally/prod (should be prod: no);
- Context7 evidence or explicit “not needed” per issue;
- Ponytail notes: what overbuild was avoided;
- verification commands with exit codes and meaningful output summary;
- browser/screenshots generated;
- local commit hash(es), if any;
- final branch and `git status --short`;
- exact blockers for anything not fully verified.

Definition of done: every issue is either implemented and locally verified, or has a concrete blocker recorded with the next exact action. Do not stop at a plan.