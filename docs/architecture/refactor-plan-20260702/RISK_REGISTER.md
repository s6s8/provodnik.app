# RISK_REGISTER.md — architectural risks for the Provodnik refactor

Likelihood (L) / Impact (I): Low / Med / High. Ordered by L×I. "Detection" = how you'd catch it;
"Mitigation" = the plan's control. IDs referenced from `REFACTOR_PLAN.md` / `EXECUTOR_GOALS.md`.

---

### R-01 — No refactor safety net (skip-by-default E2E, zero RLS tests)
**L: High · I: High.** The core lifecycle suite (`tripster-v1/01–06`) is `test.skip(!E2E_READY)` and
green-by-construction; RLS has no tests. Any code motion could silently break request→offer→booking→
review→dispute or a security boundary with **no failing test**.
**Detection:** `grep -r "test.skip\|E2E_READY"` in `tests/`; run suite and count skipped; no `supabase/tests`.
**Mitigation:** Phase 0 is blocking — **G0** (un-skip role-based lifecycle E2E) + **G1** (RLS harness) must
be green before any Phase 2+ move. CI must fail if these are skipped.

### R-02 — Data-layer triple-drift (72% of table access outside the service layer)
**L: High · I: High.** 311/430 `.from()` calls live outside `src/lib/supabase`; 8 I/O modules sit in the
static `src/data` layer; reviews/notifications/requests are triple-layered; **no lint gate** exists.
Consolidation touches many callsites at once — high regression surface.
**Detection:** `grep -rc "\.from(" src/data src/components src/features src/app`; count vs `src/lib/supabase`.
**Mitigation:** **G3** lint gate (ratcheted) first so no new drift; then **G6** strangler per-domain with
re-export shims + parity tests. Never bulk-move.

### R-03 — Public `traveler_requests` PII exposure
**L: High · I: High.** `traveler_requests_select` exposes all open requests (traveler_id, budget, dates,
notes) to anon/public via `/requests`. Violates the "identity hidden until offer accepted" invariant.
**Detection:** G1 RLS test: anon SELECT returns PII columns.
**Mitigation:** **G7** — PII-safe view/policy for anon (non-PII cards), full row only to authed members/
bidders; additive migration verified by RLS tests. Regression-guarded by the §9 checklist.

### R-04 — Admin authorization is app-layer-only (no DB backstop)
**L: Med · I: High.** Proxy is soft for admin (allow-through to layout) and admin data uses a service-role
client that **bypasses RLS**. A layout regression or a new admin fetch without the layout = unguarded
privileged data.
**Detection:** G1 test: non-admin reaching admin-scoped data; code review of `admin/layout.tsx` coupling.
**Mitigation:** **G9** — `is_admin()` RLS read-backstop; keep service-role only for legitimate bypass writes.
Do **not** touch `proxy.ts`/layout without G0+G1 (DANGEROUS class).

### R-05 — Client-side direct table writes (browser trust boundary)
**L: Med · I: High.** `data/guide-templates/supabase-client.ts` (`'use client'`) performs 3 direct table
**writes** from the browser; `guide-assets` reads similarly. Writes trust the client and depend entirely on
RLS being airtight.
**Detection:** `grep -rn "'use client'" src/data` cross-referenced with `.insert/.update/.delete`.
**Mitigation:** **ADAPTER-REWRITE** — move writes to server actions + presigned pattern (per **G6**), behind
parity tests; confirm RLS covers the table (G1) before/after.

### R-06 — Unauthenticated LLM endpoint `/api/requests/parse`
**L: Med · I: Med.** Public POST invoking OpenRouter, guarded only by IP rate-limit + global budget. Cost/DoS
if the rate-limit backend (Upstash) is unavailable or bypassed.
**Detection:** route review; load/abuse test against rate-limit.
**Mitigation:** **G8** — add auth/signed-token, keep rate + budget caps; alert on budget burn.

### R-07 — `business_leads` anon `WITH CHECK (true)` insert
**L: Med · I: Med.** Unauthenticated arbitrary inserts — spam/pollution vector.
**Detection:** G1 test: anon insert succeeds unconstrained.
**Mitigation:** **G8** — constrain columns/rate or route via authenticated RPC.

### R-08 — Storage bucket publicness is environment-drift-prone
**L: Med · I: Med.** guide-portfolio/avatars/listing-media are world-readable and **not seeded in
migrations**; private buckets rely on a uid-prefix convention. Publicness can differ per environment.
**Detection:** compare bucket policies across envs; no bucket config in `supabase/migrations`.
**Mitigation:** **G8** — declare buckets + policies in migrations so it is reproducible and reviewable.

### R-09 — SECURITY DEFINER write surface (31/46 functions)
**L: Low · I: High.** Large set of RLS-bypassing definer functions (`accept_offer`, `open_dispute`,
`admin_set_account_status`, …) whose authz is in-function only. A logic slip inside one bypasses RLS.
**Detection:** audit each definer function's internal guard; G1 tests around `accept_offer`/`open_dispute`.
**Mitigation:** Treat as **DANGEROUS** — no edits without G1 coverage; keep `search_path=public` (already
set); add per-function authz tests before any change.

### R-10 — `ActionResult` migration breaks callers (0% adoption, 3 return shapes)
**L: Med · I: Med.** 51 actions use `{ok,error}` / `{success,error}` / ad-hoc shapes; callers read ad-hoc
keys. A blanket migration would break consumers and untested error branches.
**Detection:** `grep` return-shape variants; call-site inspection.
**Mitigation:** **G2** contract tests first, then **G10** per-feature migration keeping old signatures until
callers move. Never global-rename.

### R-11 — Terminology unification breaks routes/links/SEO
**L: Med · I: Med.** 4 nouns for the sellable unit and `/requests`↔`/trips` overlap; a rename could break
inbound links, bookmarks, and SEO.
**Detection:** link-check; grep route references.
**Mitigation:** **G13** copy-only sweep after owner glossary decision; **redirects for any route rename**;
flag-guard.

### R-12 — God-component decomposition causes visual/behavioral regressions
**L: Med · I: Med.** request-detail (1013) / booking-detail (984) / bid-form (639) carry dense logic; splitting
risks subtle regressions.
**Detection:** component tests + visual walkthrough at 1280px & 375px.
**Mitigation:** **G12** behind existing component tests; decompose incrementally, verify each split.

### R-13 — Losing the request-first model or role boundaries during cleanup
**L: Low · I: High.** Over-eager consolidation could merge role surfaces or bypass the request→offer→accept
flow.
**Detection:** §9 "do not lose functionality" checklist; role-denial E2E (G0).
**Mitigation:** Hard guardrails in `REFINED_PROMPT.md`/`REFACTOR_PLAN.md`; every phase re-runs the checklist;
strangler dual-path keeps old behavior until parity proven.

### R-14 — Schema↔code naming divergence causes wrong-table edits
**L: Low · I: Med.** Code says `open-requests`/`offers`/`negotiations`; schema says `traveler_requests`/
`guide_offers` and has no `negotiations` table. Easy to edit the wrong abstraction.
**Detection:** map code module names to actual tables (done in `_scan/`).
**Mitigation:** Fold a naming reconciliation into the **G6** per-domain moves; document the mapping in each
service module header.

---

### Risk heat summary
- **Must-fix-before-motion (High×High):** R-01, R-02, R-03.
- **Security hardening (High impact):** R-04, R-05, R-09.
- **Bounded, test-gated:** R-06, R-07, R-08, R-10, R-11, R-12, R-14.
- **Guardrail-protected:** R-13.
