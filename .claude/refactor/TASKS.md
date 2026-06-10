# Provodnik Refactor — TASKS

> Driver: `.claude/refactor/run.mjs`. Integration branch: `refactor/full-2026-06`. **No push to origin/main without user approval.**
> Legend: ⬜ pending · 🔄 in-progress · 🟡 gates-passed · ✅ integrated · ❌ failed · 🛑 blocked

## Phase 1 — Security & Correctness

| | id | task | exec | attempts | deps |
|---|---|---|---|---|---|
| ⬜ | `1.1-llm-budget` | Daily global budget cap on /api/requests/parse | cursor | 0/3 | — |
| ⬜ | `1.2-favorites-ownership` | Explicit ownership assertions in favorites folder mutations | cursor | 0/3 | — |
| ⬜ | `1.3a-zod-submitRequest` | Zod schema for submitRequest action | cursor | 0/3 | — |
| ⬜ | `1.3b-zod-completeOnboarding` | Zod schema for completeOnboarding action | cursor | 0/3 | — |
| ⬜ | `1.3c-zod-updatePersonalSettings` | Zod schema for updatePersonalSettings action | cursor | 0/3 | — |
| ⬜ | `1.3d-zod-submitReply` | Zod schema for review submitReply action | cursor | 0/3 | — |
| ⬜ | `1.3e-zod-counterOffer` | Zod schema for counterOffer action | cursor | 0/3 | — |
| ⬜ | `1.4-offer-idempotency` | Idempotent offer submission (partial unique index + in-flight guard) | cursor | 0/3 | — |
| ⬜ | `1.5a-supabase-errors-pages` | Surface swallowed Supabase errors (pages) | cursor | 0/3 | — |
| ⬜ | `1.5b-supabase-errors-lib` | Surface swallowed Supabase errors (inbox + triggers + members) | cursor | 0/3 | — |

## Phase 2 — Dead Weight

| | id | task | exec | attempts | deps |
|---|---|---|---|---|---|
| ⬜ | `2.1-delete-formx` | Delete byte-identical formx route | orchestrator | 0/3 | — |
| ⬜ | `2.2-deps-prune` | Remove unused framer-motion/motion; shadcn -> devDep | orchestrator | 0/3 | — |
| ⬜ | `2.3-delete-orphan-data` | Delete orphaned src/data modules | orchestrator | 0/3 | — |
| ⬜ | `2.4-untrack-junk` | Untrack playwright artifacts + screenshots, archive competitor dumps | orchestrator | 0/3 | — |

## Phase 3 — Error/Observability

| | id | task | exec | attempts | deps |
|---|---|---|---|---|---|
| ⬜ | `3.1-create-action` | createAction wrapper (result contract + Sentry) | cursor | 0/3 | — |
| ⬜ | `3.2-error-boundaries` | error.tsx for (home)/(public)/(auth) + Sentry in existing | cursor | 0/3 | — |
| ⬜ | `3.3-logger` | logError logger + replace console.* (batched) | cursor | 0/3 | 3.1-create-action |
| ⬜ | `3.4-sentry-hardening` | Sentry tunnelRoute + tracesSampler | cursor | 0/3 | — |

## Phase 4 — Architecture

| | id | task | exec | attempts | deps |
|---|---|---|---|---|---|
| ⬜ | `4.1-traveler-profile-type` | Extract TravelerProfile to lib; forbid lib->features imports | cursor | 0/3 | — |
| ⬜ | `4.2-route-groups` | Collapse (public) into (site); fold (guide) into (protected) | mixed | 0/3 | — |
| ⬜ | `4.3-homepage-rename` | homepage3 -> homepage; old homepage -> homepage-classic | mixed | 0/3 | — |
| ⬜ | `4.4-merge-booking` | Merge features/booking into features/bookings | mixed | 0/3 | 1.3a-zod-submitRequest |
| ⬜ | `4.5-data-layer` | Canonical data layer: I/O in lib/supabase, src/data static-only | mixed | 0/3 | 2.3-delete-orphan-data |
| ⬜ | `4.6-bookings-n1` | Batch-load bookings related rows (fix N+1) | cursor | 0/3 | — |
| ⬜ | `4.7-query-keys` | Query-key factory + typed messages api module | cursor | 0/3 | — |
| ⬜ | `4.8-feature-structure-doc` | Feature structure standard + cross-feature import rule | orchestrator | 0/3 | — |

## Phase 5 — UI Quality

| | id | task | exec | attempts | deps |
|---|---|---|---|---|---|
| ⬜ | `5.1-merge-homepage-forms` | Single form-logic hook behind two homepage layouts | cursor | 0/3 | 4.3-homepage-rename |
| ⬜ | `5.2-media-card` | Shared MediaCard primitive for 5 card variants | cursor | 0/3 | — |
| ⬜ | `5.3-decompose-bid-form` | Decompose bid-form-panel (607 lines) | cursor | 0/3 | 1.4-offer-idempotency |
| ⬜ | `5.4-excursions-rhf` | guide-excursions-screen -> react-hook-form | cursor | 0/3 | — |
| ⬜ | `5.5-styles-copy` | Shared style constants + copy.ts consolidation | cursor | 0/3 | — |
| ⬜ | `5.6-a11y` | Accessibility: real buttons, image alts, labeled selects | cursor | 0/3 | — |
| ⬜ | `5.7-next-image` | Replace raw <img> with next/image (3 files) | cursor | 0/3 | — |

## Phase 6 — Performance

| | id | task | exec | attempts | deps |
|---|---|---|---|---|---|
| ⬜ | `6.1-lazy-panels` | Lazy-load bid form panel (client wrapper for ssr:false) | cursor | 0/3 | 5.3-decompose-bid-form |
| ⬜ | `6.2-cache-semantics` | Explicit dynamic/revalidate per public page | cursor | 0/3 | 4.2-route-groups |
| ⬜ | `6.3-loading-states` | Loading skeletons for search + listing detail | cursor | 0/3 | 4.2-route-groups |

## Phase 7 — Tests/Docs

| | id | task | exec | attempts | deps |
|---|---|---|---|---|---|
| ⬜ | `7.1-revive-e2e` | Shared e2e user fixtures; unskip tripster-v1 (ERR-059) | cursor | 0/3 | — |
| ⬜ | `7.2-coverage-gaps` | Messaging thread mapping + request lifecycle tests | cursor | 0/3 | — |
| ⬜ | `7.3-docs-consolidation` | Archive stale docs; de-duplicate product canon | orchestrator | 0/3 | — |
| ⬜ | `7.4-final-merge` | Final sweep, code-review, merge gate (USER APPROVAL REQUIRED) | orchestrator | 0/3 | — |

