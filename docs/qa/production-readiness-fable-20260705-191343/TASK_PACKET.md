# Fable 5 mission — Provodnik production-readiness audit

You are running as Fable 5 because this is a high-leverage whole-site production-readiness audit. The owner is tired of manually hunting issues. Your job is to produce the fullest useful issue list possible, not to implement fixes.

## Workspace

Work in this repository only: `/Users/idev/provodnik`.

## Hard goal

Create a comprehensive production-readiness backlog for the Provodnik site, excluding the payment system entirely.

Do **not** stop until you have produced these artifacts:

1. `/Users/idev/provodnik/docs/qa/production-readiness-fable-20260705-191343/ISSUES.md` — owner-facing full issues list in Markdown.
2. `/Users/idev/provodnik/docs/qa/production-readiness-fable-20260705-191343/issues.json` — machine-readable issue list.
3. `/Users/idev/provodnik/docs/qa/production-readiness-fable-20260705-191343/COVERAGE.md` — route/flow coverage matrix: checked / partially checked / blocked / skipped.
4. Screenshot/evidence files under `/Users/idev/provodnik/docs/qa/production-readiness-fable-20260705-191343/screenshots/` where useful.

If a gate is blocked, record the blocker and continue with other checks. Do not let one broken area stop the audit.

## Non-goals / hard exclusions

- Do not implement fixes.
- Do not edit product code.
- Do not commit.
- Do not push.
- Do not modify database state except safe QA/login/session actions needed for audit.
- Do not test, design, scope, or recommend the payment system. Payment-related items are explicitly out of scope.
- Do not print or copy secrets, passwords, tokens, keys, or raw env values into artifacts/logs.

## Must-read context first

Read these before auditing:

- `AGENTS.md`
- `.claude/CLAUDE.md`
- `.claude/sot/INDEX.md`
- `.claude/sot/KODEX.md`
- `.claude/sot/HOT.md` if present
- `.claude/sot/ERRORS.md` if present
- `.claude/sot/DECISIONS.md` if present
- `package.json`
- route tree under `src/app`
- flag registry under `src/lib/flags.ts` if present

Use Superpowers for disciplined workflow, Ponytail for ruthless prioritization/review, Context7 for any library/API-specific uncertainty, and Playwright/browser checks for user-visible evidence. In your final audit artifact, state briefly how each was used.

## Audit scope

Audit every meaningful site surface except payments:

### Public surfaces

- Home / request-first entry points.
- Guides catalog and representative guide details.
- Ready-made excursions/listings and representative details.
- Requests catalog and representative request details.
- Destination pages and representative details.
- Marketing/help/trust/business/become-a-guide/legal pages.
- Header/footer/nav/sidebar links.
- 404/not-found behavior and linked-but-missing routes.

### Auth and protected surfaces

Use sanctioned local/dev QA credentials if available in ignored env/config files. Never print secret values.

- Auth pages and validation.
- Traveler dashboard/account/trips/favorites/messages/notifications/bookings/reviews/disputes where reachable.
- Guide dashboard/profile/listings/bookings/calendar/inbox/stats/reviews/settings where reachable.
- Admin dashboard/guides/listings/bookings/moderation/users/audit/disputes where reachable.
- Role redirects and unauthorized access behavior.

### Core product flows, excluding payments

- Traveler creates a request: empty form, invalid form, minimal valid draft/submission where safe.
- Guides/listings/requests discovery and detail pages.
- Guide profile submission/admin review path if reachable.
- Offers/bookings/disputes/reviews/messages flows where reachable without payment.
- Account status / blocked / suspended / draft/submitted/approved states if represented in code/data.
- File/document upload surfaces as product readiness risk if present.

## Required checks

Run as many as feasible and cite results in artifacts:

- Route inventory from `src/app` and visible links.
- Production build if feasible.
- Typecheck, lint, tests, Playwright/e2e if scripts exist. Treat skipped e2e suites as a finding, not a green pass.
- Production-mode browser/Playwright smoke where feasible, desktop and mobile widths.
- Console errors, page errors, broken images, horizontal overflow, visible 404 behind HTTP 200.
- Public list-to-detail consistency: opening real visible items, not just list pages.
- Authenticated role smoke for every seeded role available.
- Supabase/RLS/data-path divergence risks: list works but detail fails, anon joins blocked, app-layer-only filtering.
- Feature flags: disabled route linked from nav/footer/sidebar = issue.
- Product terminology sweep for user-visible forbidden terms: `клиент`, `турист`, `поставщик`, `исполнитель`, `биржа`, `готовые туры`. Report only user-visible violations and suggest canonical terms: `путешественник`, `гид`, `запросы`, `готовые экскурсии`, `сборная группа`.
- Responsive design: 1280px and 375px for key pages.
- Accessibility basics: labels, keyboard focus, contrast obvious failures, form errors.
- SEO/share basics: titles, metadata, empty/placeholder content.
- Security/privacy basics: secrets/internal implementation details visible in UI, unsafe admin/public leakage, unauthorized access paths.

## Issue classification

Every issue must have:

- ID: `PRD-001`, `PRD-002`, ...
- Severity: `P0 launch blocker`, `P1 fix before beta`, `P2 fix before public launch`, `P3 polish/later`.
- Category: functional, data/RLS, auth/roles, UX, visual, responsive, accessibility, content/copy, performance, SEO, QA/infrastructure, security/privacy.
- Surface/route.
- Evidence: screenshot path, command result, console error, source finding, or exact observed text.
- Reproduction steps or inspection method.
- Expected vs actual.
- Suggested fix direction.
- Owner decision needed? yes/no.
- Payment system relation: must be `out of scope` or `not payment-related`; do not include payment issues.

Prioritize ruthless usefulness over politeness. Merge duplicates, but keep cross-surface patterns visible.

## Report structure for `/Users/idev/provodnik/docs/qa/production-readiness-fable-20260705-191343/ISSUES.md`

Use this structure exactly:

1. `# Provodnik production-readiness audit — issues list`
2. `## Executive summary`
   - total issues by severity
   - launch recommendation
   - top 10 fix order
   - explicit note: payment system excluded
3. `## P0 launch blockers`
4. `## P1 fix before beta`
5. `## P2 fix before public launch`
6. `## P3 polish / later`
7. `## Cross-cutting product risks`
8. `## Route and flow coverage`
9. `## Checks run and results`
10. `## Blockers / not fully tested`
11. `## Recommended execution plan`

Keep the report owner-readable: direct, concrete, no raw secrets, no internal provider/model/process chatter. Technical evidence is allowed when it helps fix the issue.

## JSON schema for `/Users/idev/provodnik/docs/qa/production-readiness-fable-20260705-191343/issues.json`

Write an array of objects:

```json
[
  {
    "id": "PRD-001",
    "severity": "P1 fix before beta",
    "category": "functional",
    "title": "Short title",
    "surface": "Route or flow",
    "evidence": ["screenshot or command/source evidence"],
    "steps": ["step 1", "step 2"],
    "expected": "...",
    "actual": "...",
    "suggestedFix": "...",
    "ownerDecisionNeeded": false,
    "paymentRelation": "not payment-related"
  }
]
```

## Completion signal

When finished, print only:

```text
PRODUCTION_READINESS_AUDIT_DONE
REPORT=/Users/idev/provodnik/docs/qa/production-readiness-fable-20260705-191343/ISSUES.md
JSON=/Users/idev/provodnik/docs/qa/production-readiness-fable-20260705-191343/issues.json
COVERAGE=/Users/idev/provodnik/docs/qa/production-readiness-fable-20260705-191343/COVERAGE.md
ISSUES_TOTAL=<number>
P0=<number>
P1=<number>
P2=<number>
P3=<number>
```

If blocked before artifacts exist, print:

```text
PRODUCTION_READINESS_AUDIT_BLOCKED
BLOCKER=<short exact blocker>
PARTIAL_DIR=/Users/idev/provodnik/docs/qa/production-readiness-fable-20260705-191343
```
