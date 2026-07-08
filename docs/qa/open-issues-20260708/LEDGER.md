# Open Issues Ledger — 2026-07-08

| ID | Area | Status | Evidence | Commit |
|---|---|---|---|---|
| 33 | Public guide profile centering | ✅ fixed (code+build; live visual QA pending deploy) | self-center on avatar/badge/stats; bio/tags/buttons left | 734ac58c |
| 35 | Suspended user restrictions | ✅ fixed (RLS migration + app guard; **not applied to prod**) | new migration extends active-account guard to remaining writes; msg-send app guard | 0837b8d9 |
| 41 | Open group request detail | ✅ fixed (RTL test + build) | «О поездке» brief (notes+interests) for joined members; anon teaser preserved | 734ac58c |
| 42 | Open group shared discussion | ✅ fixed (RLS migration + UI + tests; **not applied to prod**) | request-thread service + forum UI; RLS grants members read/write | 4e6aeb6b |
| 43 | Admin listings purpose | ✅ fixed (build+nav test) | /admin/listings → redirect to /admin/moderation; nav entry removed | 7c843871 |
| 44 | Admin bookings statuses | ✅ fixed (build) | new /admin/pipeline «Заявки и предложения» surface | 7c843871 |
| 45 | Guide listing duplicate buttons | ✅ fixed (RTL test) | one blue «Добавить экскурсию» in header; empty-state dup removed | 734ac58c / d8cfc5dd |
| 46 | Guide listing save button hidden | ✅ fixed (code+build; live visual QA pending deploy) | scrollable sheet body; footer pinned with border-t | 734ac58c |
| 47 | Admin moderation purpose | ✅ fixed (build+nav test) | Moderation center is the single review home (listings tab + review replies) | 7c843871 |

## Mutation log

- 2026-07-08: Created planning ledger from operator message. Product code untouched.
- 2026-07-08 (Opus exec): Implemented all 9 issues across 5 commits on branch
  `fix/open-issues-33-47-opus-20260708`. Verification: `bun run typecheck` ✓,
  `bun run lint` (0 errors, 21 pre-existing warnings) ✓, `bun run test:run`
  (1158 passed) ✓, `bun run build` (compiled) ✓. Two DB migration files written
  (20260708150000, 20260708160000) — **file only, NOT applied to prod**. Not
  pushed. See OPUS_EXECUTION_REPORT.md.
