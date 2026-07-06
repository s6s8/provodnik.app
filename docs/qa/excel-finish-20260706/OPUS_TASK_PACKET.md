# Opus task packet — Provodnik Excel pending rows completion

Working directory: `/private/tmp/provodnik-excel-finish-20260706`.

## Goal
Complete the remaining pending rows from the Telegram Excel file `Provodnik_05.07.26 - open tasks.xlsx` and leave the repository ready for Hermes final verification, commit, push, production deploy, and sanitized Russian Excel report.

## Source of truth
The Excel attachment from Telegram message 157 contains these open items:

| Row | URL | Issue | Starting status |
| --- | --- | --- | --- |
| 24 | `/guides/жюль-верников-69f18040` | On guide detail, when viewed as traveler/admin, guide photos are replaced by initials. Need design decision or remove initials block. | not fixed |
| 33 | same guide detail | Guide description text is centered; should be left aligned. | new |
| 34 | `/requests/...` | After creating request while logged in as traveler, login form appears again. | already fixed in prior PR; preserve behavior |
| 35 | `/requests/...` | Blocked user can still create/send excursion requests. | already fixed in prior PR; preserve behavior |
| 36 | global | Text in containers/badges/navigation starts further right than non-container text; visually misaligned site-wide. | pending |
| 37 | signup | New traveler signup shows critical error after form submit although account becomes active. | already fixed/hardened in prior PR; preserve behavior |
| 38 | `/admin/users/...` | Admin cannot see full user addresses/contacts because they are masked. | already fixed in prior PR; preserve behavior |
| 39 | `/account` | Avatar image below 2 MB does not upload; initials remain. | already fixed in prior PR; preserve behavior |
| 40 | `/guide/inbox` | Guide inbox does not show matching requests; shows load error. | already fixed in prior PR; preserve behavior |

Current branch starts from merged PR #267 (`f7bb46c1`). Rows 34,35,37,38,39,40 should already be implemented; do not regress them. Focus on rows 24,33,36.

## Required implementation
1. **Row 24:** On public guide detail page, remove the giant initials hero/placeholder block as visual content. If no real avatar/photo exists, do not show a huge initials replacement. Prefer clean typography/background; real uploaded avatar should remain bounded, not full-bleed.
2. **Row 33:** Make guide bio/description left-to-right/left-aligned, not centered. Preserve mobile readability.
3. **Row 36:** Fix the obvious global alignment mismatch for container/badge/nav text vs normal text. Keep brand style; do not broad-rewrite the design system. Prefer adjusting spacing/text alignment in the affected public guide detail and shared nav/badge primitives only when evidence shows mismatch.
4. Add/update focused regression tests where reasonable.
5. Create a sanitized Russian status workbook source if easy, but Hermes may generate final `.xlsx`; do not include tool names, local paths, secrets, raw emails/phones, or internal implementation runners in user-facing Russian text.

## Constraints
- Read `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md` if present before editing.
- Use Context7 for relevant Next/React/Tailwind behavior if needed.
- Use Superpowers/Ponytail if available in this Claude session.
- Touch only files relevant to Excel rows and tests/docs/report artifacts.
- Do not push, merge, deploy, or run destructive DB changes.
- No secrets in output.

## Verification gates
Run and report results:
- `bun run typecheck`
- `bun run lint`
- focused tests for touched components
- `bun run build`

If browser verification is practical, run local production smoke for the guide detail page and check that:
- no giant initials hero/placeholder is rendered;
- guide description is left-aligned;
- page body does not show a not-found body for the real guide slug if seed/live data exists locally.

## Return contract
Write a concise final report to `docs/qa/excel-finish-20260706/OPUS_RESULT.md` with:
- files changed;
- row-by-row status 24/33/36 and preserved 34/35/37/38/39/40;
- exact commands run and results;
- blockers, if any.
