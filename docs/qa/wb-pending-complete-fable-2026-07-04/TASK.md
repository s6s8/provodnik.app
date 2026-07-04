# Fable task packet — complete Wildberries pending items

## Operator approval
CarbonS8 gave full explicit approval to complete all pending tasks from the Wildberries Excel pending plan. Do not ask the operator questions. If a product decision is missing, consult the project-manager role yourself: make the safest MVP decision, record it, and continue. Prefer completing user-visible behavior over leaving open questions.

## Workspace
You are working in this isolated worktree:
`/Users/idev/provodnik/.claude/worktrees/wb-pending-complete-fable-20260704-055913`

Base commit: `0b077fba` (`origin/main`, PR #260 already deployed to VPS before this task).

Read first:
- `AGENTS.md`
- `.claude/CLAUDE.md`
- `.claude/sot/HOT.md`
- `.claude/sot/INDEX.md`
- `/Users/idev/.claude/plans/federated-tinkering-abelson.md`

## Required tools / stance
- Use Fable 5.
- Use Context7 for Next.js / React / Supabase APIs when implementation details matter; include the library id and relevant signature/version in your final report.
- Use Ponytail (`ponytail-review` / senior minimalism mindset): smallest safe changes, no overengineering, no unrelated refactors.
- Use Playwright/browser checks for live UI where possible.
- Follow Provodnik rules: bun only, Tailwind/shadcn only, no custom CSS classes, RLS is boundary, no secrets printed.

## Scope: complete all pending plan items
Source plan summary from `federated-tinkering-abelson.md`:

### Retest / close if already fixed by PR #260
- №14: account/profile completion + checkmark. Verify current behavior and document proof.
- №24: guide detail no longer 404; anonymous/PU guide photo visible. Verify current behavior and document proof.
- №29/№30: admin guide page photo/header. Retest current deploy/local production. Fix only if reproducible.
- №31: traveler trips/account route break from old deployed baseline. Retest current build; add narrow resilience if still brittle.
- №12: marked remove / not reproduced. Verify no engineering action needed.
- №19: route answer `/account` = Profile; document as manual-answer item, no code unless evidence says otherwise.

### Engineering fixes to implement
- №25: remove duplicated guide bio/headline on public guide detail.
- №27: show guide base city as well as region. Add/update Supabase RPC/mapping/types/UI as needed.
- №26: show guide topics/categories. At minimum map and render guide `specializations`; if listing category data is available, include it without broad refactor.
- №32: request owner must not see active “Присоединиться” on `/requests`; show “Это ваша группа” or disabled equivalent. Detail page/server action already gates — keep both.
- №28: “Запросить этого гида” currently sends dead `?guide=<slug>`. CarbonS8 approved completion. Implement minimal MVP: preserve preferred guide slug from guide CTA into request creation data using the existing safest storage path. If a schema field is necessary, add a migration and types; otherwise use an existing metadata/json field if present. The UI should make it clear the guide is preselected/attached.

### Manual/data items
- №3, №4, №17, №18: Badma copy/manual text items. If the exact copy exists in Excel/plan/source notes, apply it. If exact copy is not available, create a short Russian PM-ready copy proposal and wire no speculative code. Mark the item as needing owner copy only if the source text truly cannot be recovered.
- №22: delete test requests. With approval, remove only clearly seeded/demo/test requests, never real user data. Prefer existing admin/tooling with demo guards. If no safe target list exists, create a guarded admin capability/report instead of blind deletion.
- №23: delete accounts. Use existing guarded demo-account tool for `example.com` / `provodnik.test`. Do not delete Alex/Badma/manual real accounts unless a verified exact list exists. If missing, deliver the guarded flow/report.

## Required implementation behavior
- Keep changes focused and production-safe.
- Add/update tests for mapper/UI/action behavior where practical.
- Add migrations only when needed.
- Regenerate Supabase types if schema/RPC changes require it.
- No raw tokens, phone numbers, emails, or secrets in final report.
- No automation attribution in commits.

## Required verification
Run as much of the full gate as possible and record exact outputs:
- `bun run typecheck`
- `bun run lint`
- `bun run test:run`
- `bun run build`
- Focused Playwright/browser smoke for: public guide detail, `/requests` as owner, `/account`, `/trips`, admin guide page if QA auth is available.

If QA credentials/env are missing, say exactly what was blocked and still run local/static/component-level verification. Do not fake live proof.

## Git / deploy target
If all local gates pass:
1. Commit the focused changes with a human commit message.
2. Push a work branch.
3. Open PR.
4. Watch checks.
5. Merge PR if checks pass.
6. Update VPS `/opt/provodnik` to merged `origin/main`, install/build/restart as needed.
7. Verify: GitHub main contains commit, VPS HEAD matches, `provodnik.service` active, Caddy active, public `https://vps.provodnik.app` HTTP 200 and key routes/body checks.

If a gate blocks, fix it. If truly blocked externally, commit only safe completed work and produce a precise blocker report.

## Final report contract
Write and print a final report at:
`docs/qa/wb-pending-complete-fable-2026-07-04/FINAL.md`

Final report must include:
1. Completed items table for №3,4,12,14,17,18,19,22,23,24,25,26,27,28,29,30,31,32.
2. Files changed and migration IDs.
3. Context7 evidence used.
4. Ponytail/minimalism review notes.
5. Exact verification command outputs/statuses.
6. GitHub PR/merge/deploy proof if completed.
7. Honest blockers, if any.
