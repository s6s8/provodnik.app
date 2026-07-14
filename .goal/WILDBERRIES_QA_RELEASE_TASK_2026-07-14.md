# Wildberries Group — autonomous verification, repair, and evidence release

## Mission
The operator authorized the full path: verify every numbered request from the Wildberries Telegram group against the committed implementation, exercise the actual website, capture honest visual proof, repair any reproducible defect, commit every repair, then prepare a release-ready evidence package.

Work only in this isolated worktree and branch: `work/wildberries-full-execution-20260713`, currently based on `cbcffe67` and containing the 19 Wildberries commits through `88df693e`.

## Sources of truth (read first)
1. `docs/planning/wildberries-2026-07-13/01_MESSAGES_AND_MEDIA.md` — exact 56-message group export and screenshot evidence. The numbered product requests are items **1–18**.
2. `docs/planning/wildberries-2026-07-13/06_FABLE_EXECUTION_PLAN.md` — execution acceptance matrix, release gates, and risks.
3. `.goal/STATE.md`, `.goal/DECISIONS.md`, `.goal/FAILURES.md`, `.goal/PLAYBOOK.md` — prior executor state. Treat prior claims as untrusted until rechecked.
4. The committed range `cbcffe67..HEAD`.
5. `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, relevant SOT/checklists.

## Exact numbered scope
Verify and report in this exact order—do not renumber:
1. Admin guide filtering by region/base city.
2. Detailed admin analytics.
3. Admin status-change/button feedback and latency.
4. Homepage budget-per-person hint.
5. Homepage information blocks under “Как это работает”.
6. Homepage destination live search.
7. “Готовые экскурсии” entry and catalog.
8. Email notifications.
9. Footer/support/project/social links.
10. Anonymous traveler request recap and continuity through registration.
11. Guide-specific listings and status counts in admin.
12. Moderated ready excursions on the homepage.
13. Public guide-name standard plus private/admin full-name editing.
14. Moderation terminology and unified approved listing status.
15. Admin action latency / audit button responsiveness.
16. Compact request-page hero.
17. Correct Russian grammatical cases.
18. Phone integrity for guides and the prior role-change bypass.

Audioguides/transfers/flights are explicitly future backlog, not scope.

## Mandatory specialist method
- **Context7:** use it, not just claim it. Resolve and query authoritative documentation for the relevant current API before any uncertain Next.js 16 / `@supabase/ssr` / Playwright fix. Record the exact library and finding in the evidence ledger.
- **Ponytail full:** trace the current read/write/render flow before editing; run callers/blast-radius evidence before changing a function; use existing components/utilities; choose the smallest root-cause diff; do not add abstractions or duplicate flows; leave a focused runnable regression check.
- **Superpowers:** use the available planning, TDD, and verification workflows.
- **Design:** invoke `frontend-design:frontend-design` and `ui-ux-pro-max:ui-ux-pro-max` for the final evidence report and any visual repair. The report must be mobile-first, polished, readable, and bright steel-blue—not a generic dashboard.
- **Playwright:** use it for every browser assertion and screenshot. Do not treat route HTTP 200, a login redirect, or a source assertion as UI proof.

## Guardrails
- Do not touch unrelated refactor/dirty-root work.
- Do not use production Supabase SQL, do not run `supabase db push`, and do not edit production data. For A2, evaluate/runbook only and label it `BLOCKED: production data repair requires a reviewed, separately authorized SQL run`.
- Do not enable production feature flags or change external email configuration. Record a clearly scoped release requirement instead.
- Never expose keys, tokens, passwords, PII, raw full emails/phones, or magic links in logs, screenshots, commits, or reports.
- For local deterministic browser fixtures: snapshot exact fields, mutate only local Supabase, capture proof, restore, independently confirm rollback, then remove the snapshot.
- Do not `git push`, deploy, or restart the VPS. Hermes owns the post-review release step under the operator’s authorization.
- Before changing any function, run the code blast/caller evidence required by project rules; include the result in your ledger.
- If a check fails, do not rerun the identical failure blindly: inspect root cause, apply one smallest repair, rerun the focused check, then the relevant broader gate.

## Required evidence package
Create `docs/qa/wildberries-2026-07-14/` with:

1. `LEDGER.md` — one entry per item **1–18** in order with:
   - exact group request summary;
   - commit(s) and files that implement it;
   - source/code check;
   - actual browser route + viewport + authenticated role if any;
   - screenshot path(s) or precise blocker;
   - verdict: `VERIFIED`, `FIXED_AND_VERIFIED`, `RELEASE_GATE`, or `BLOCKED`;
   - any release/data/config dependency;
   - no secrets/PII.
2. `screenshots/` — clear 1440px desktop and 375px mobile screenshots for every UI-verifiable task. File names must begin with the matching task number, e.g. `01-admin-region-city-desktop.png`, `01-admin-region-city-mobile.png`. Include only credible screenshots: expected control/input plus expected result, no login screen/skeleton/error state.
3. `TEST_RESULTS.md` — focused commands/results per task and final full chain output summary.
4. `RELEASE_GATES.md` — production-only requirements separated from code completion: data repair, env flags, email delivery, authenticated production proof, etc.
5. `report.html` — a portable, mobile-first evidence report containing all 18 numbered tasks in order. Bright steel-blue visual system, strong hierarchy, compact status cards, responsive at 375px, no horizontal overflow. Embed the selected proof pictures as `data:` images so this one HTML file is self-contained. Include a truthful environment badge on every item (`local verified`, `production verified`, or `release gate`) and no invented production claims.

The HTML report must include:
- title, audit date, baseline/branch information sanitized for an operator;
- executive count of each verdict;
- 18 numbered task cards, same order as the group;
- embedded screenshots with accessible captions;
- findings/fixes linked to their task number;
- release-gate section;
- an honest limitations section;
- footer stating screenshots are evidence from the stated environment.

## Verification and repair flow
1. Build a commit-to-task map first. A commit alone is never a pass.
2. Independently inspect diffs and unit/component tests.
3. Start the intended local website against **local** Supabase only. Authenticate with an approved short-lived local QA route without exposing credentials. Never send a password or magic link into logs.
4. Verify each UI task at 1440 and 375px. For non-UI tasks use the direct observable proof (test, inspectable data state, or configuration matrix) and say exactly why screenshot is not applicable.
5. If a behavior is missing/broken, trace the root cause, repair it, add/extend a focused regression test, run Context7 before uncertain API usage, capture before/after or after proof, and commit an atomic conventional commit.
6. Run the final chain: `bun run typecheck && bun run lint && bun run test:run && bun run playwright && bun run build`.
7. Run both `git diff --check` and `git diff --check cbcffe67..HEAD`.
8. Commit the evidence package and each repair with human conventional messages. End clean.

## Completion contract
Do not stop until the evidence package exists and the final agent output prints:
- all 18 numbered verdicts in order;
- repair commit hashes, if any;
- screenshot count and the `report.html` path;
- exact final verification commands and result summaries;
- exact production release gates;
- Context7 evidence and how it affected work;
- Ponytail evidence and the root-cause principle used;
- a candid blockers/limitations section.
Do not ask the operator questions: choose safe PM defaults and continue. If an external dependency genuinely prevents verification, record the exact blocker and complete all other work.
