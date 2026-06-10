# Provodnik Full Audit — 2026-06-11

Six-dimension audit of `~/provodnik` (Next.js 16 + React 19 + Supabase, 601 src files / 60,665 LOC TS/TSX, 77 migrations). Companion to `docs/superpowers/plans/2026-06-11-full-refactor.md` — every finding below maps to a plan task.

**Baseline:** typecheck ✅, eslint ✅ (2 grandfathered warnings), 722 unit tests ✅ / 148 files. E2E tripster-v1 skipped (ERR-059).

## Verified corrections (audit agents flagged these wrongly — do NOT "fix")
- `src/proxy.ts` IS the live middleware (Next 16 renamed `middleware.ts` → `proxy.ts`). It does session refresh + role gating. Not orphaned.
- `.env.local` is NOT tracked in git (`git ls-files` → only `.env.example`). No history scrub needed. Optional: rotate SUPABASE_SECRET_KEY / SENTRY_AUTH_TOKEN / OPENROUTER_API_KEY as hygiene.
- `cmdk`, `react-day-picker` are used. Keep.

## Critical / High (plan Phase 1 + 3)
| # | Finding | Evidence | Plan task |
|---|---|---|---|
| 1 | Public LLM endpoint, no auth — cost-leak via IP rotation | `src/app/api/requests/parse/route.ts:27-74` (20 req/min/IP only) | 1.1 |
| 2 | Favorites folder mutations rely on RLS alone (IDOR if RLS regresses) | `src/features/favorites/actions/favoritesActions.ts:24-54` | 1.2 |
| 3 | 5 server actions without zod validation | submitRequest, completeOnboarding, updatePersonalSettings, submitReply, counterOffer | 1.3 |
| 4 | Double-submit creates duplicate offers (no server-side uniqueness) | `bid-form-panel.tsx:215`; no unique index on guide_offers | 1.4 |
| 5 | 7 call sites swallow Supabase errors → silent empty states | inbox screen, help, triggers.ts, profile, search, guide/[id], request-members | 1.5 |
| 6 | 42 console.* in src; server errors never reach Sentry; throw-vs-return contract chaos | 24 files; `(site)/requests/[requestId]/actions.ts:72` shape mismatch | 3.1–3.3 |
| 7 | 4 route groups lack error.tsx; existing boundaries log to console only | (home), (public), (guide), (auth); `(protected)/error.tsx:15` | 3.2 |
| 8 | N+1 in bookings: 20 bookings → ~60 queries | `src/lib/supabase/bookings.ts:116-151` | 4.6 |
| 9 | lib → features import inversion (TravelerProfile type) | `lib/profile/load-traveler-profile.ts:1` +2 more | 4.1 |
| 10 | Unused deps `framer-motion` + `motion` (0 imports); `shadcn` misfiled as runtime dep | package.json | 2.2 |
| 11 | E2E suite fully skipped — seed/spec credential drift | tests/e2e/tripster-v1, ERR-059 | 7.1 |

## Medium (Phases 2, 4, 5)
- `form` vs `formx` pages byte-identical → delete formx (2.1).
- `homepage` vs `homepage3` parallel implementations; `/` uses homepage3 → rename to homepage / homepage-classic (4.3).
- `features/booking` vs `features/bookings` split domain → merge (4.4).
- 3 parallel data-access conventions; orphaned modules with zero importers (`data/bookings`, `data/conversations`, `data/favorites/supabase-client`) → delete + canonicalize on `lib/supabase/*` (2.3, 4.5).
- `(site)` + `(public)` byte-identical layouts; `(guide)` group holds one page → consolidate (4.2). NOTE: `(public)/listings/[id]` vs `(protected)/listings/[id]` resolve to the same URL — investigate before moving.
- Oversized components: bid-form-panel 607 lines (14 useState), guide-excursions-screen 571 (12 useState, manual field state despite RHF in repo), marketplace screen 517 → decompose (5.3, 5.4).
- 5 near-duplicate card components; duplicated FIELD_CLASS/BADGE_CLASS constants ×3; two 440-line near-identical homepage forms → primitives + shared hook (5.1, 5.2, 5.5).
- Ad-hoc TanStack Query string keys, inline fetch in components, no API layer → query-key factory + typed api module (4.7).
- `.playwright-mcp/` console logs COMMITTED to git; ~30 screenshots + 280KB competitor dumps at repo root → untrack + fence (2.4).
- Zero dynamic() imports — heavy panels always in bundle (6.1). Search page lacks explicit cache semantics (6.2).
- ~10% of copy hardcoded outside copy.ts, `"Поездка завершена"` duplicated ×3 (5.5).
- A11y: 2 div-as-button, 3 missing gallery alts, unlabeled selects; 3 raw `<img>` (5.6, 5.7).
- Messaging + request-lifecycle have near-zero unit coverage (7.2). docs/ 108 files with product-canon duplication vs .claude/sot (7.3).

## Low / informational
- Migration churn 13% fix-rate over 10 weeks — normal hardening; squash post-v1.
- RLS: 25/25 tables enabled; two intentional `USING(true)` public reads (destinations, quality_snapshots) — document in DECISIONS.md.
- Write RPCs all SECURITY DEFINER with explicit permission checks — sound.
- Env fallback aliases (ANON↔PUBLISHABLE, SERVICE_ROLE↔SECRET) confusing; upstash env vars bypass env.ts validation.
- Demo mode correctly gated behind `!hasSupabaseEnv` — zero production risk.
- Storage/upload flow sound: signed URLs + path-ownership assertions + bucket RLS.
- lint-ratchet baseline near-clean (2 warnings) — system works.

## Overall
Foundation is genuinely good (RLS discipline, RHF+zod where adopted, React Compiler on, security headers, green gates). The "sticks and glue" feeling comes from: parallel implementations never retired (homepage3/formx/booking-vs-bookings/3 data layers), no shared contracts (action results, query keys, error handling), and observability that stops at console.error. The refactor plan addresses all of it in 7 stoppable phases.
