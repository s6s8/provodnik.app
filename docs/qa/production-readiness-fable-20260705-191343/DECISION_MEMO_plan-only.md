# Plan-only items — owner decisions (not executed)

These require a live-DB mutation, prod-env access, or a product decision and were
deliberately NOT executed per the dispatch safety rules. Each has an exact next action.

---

## PRD-004 — Migration ledger drift (repo ≠ live DB)
**Why owner:** needs a maintenance window + backup; touches guide-name source of truth.

The repo has at least two never-applied migrations, and the tracking table is
unreliable (migrations were applied ad-hoc via SQL editor). A blind
`supabase db push` would run `20260528154254_drop_guide_display_name.sql`, which
drops `guide_profiles.display_name` — the column live guide names still fall back
to (`queries/core.ts`, `listings/[id]/page.tsx`). That blanks guide names and
breaks listing-detail.

**Safe ordering:**
1. Introspect the live schema (never the migration list): `information_schema.columns`,
   `pg_proc`, `pg_policies`, `pg_indexes`. Diff against `supabase/migrations/*` to
   build the true applied/unapplied inventory.
2. Apply the safe pending policies by hand (e.g. PRD-002 — see `prd-002-anon-rls/`).
3. Reconcile the ledger with `supabase migration repair --status applied <version>`
   for each already-applied file. Never raw-INSERT into `supabase_migrations`.
4. **Before** applying `drop_guide_display_name`: migrate every name read to
   `v_guide_public_profile.full_name`, verify anon can read it, then drop.
5. Only after the ledger matches the live schema is `supabase db push` safe again.

---

## PRD-005 — Live catalog shows only test guides
**Why owner:** decide the test-data-on-prod policy and whether real guides launch first.

The live `/guides` shows two seeded test guides (QA Guide Test, «Жюль Верников»
with a Jules-Verne photo). Options: (a) unpublish them (`is_available=false` on
those two rows) until real guides exist, or (b) hide the catalog until seeded with
real guides. Both are live-data mutations — not executed. Recommend (a) as a
one-off targeted `update` on the two known user_ids, gated on a decision about
whether any real guides exist to show.

---

## PRD-021 — Empty public catalogs reachable by direct URL (/listings, /destinations)
**Why owner:** seed real content vs. redirect until populated.

After the 2026-06-30 section hide, `/listings` and `/destinations` are still
reachable (and `/tours`, `/search` redirect into them) but show "0 экскурсий" /
"нет направлений". Decision: seed real content, or redirect these routes to `/`
until populated. Redirect is a small code change (middleware/route redirect) once
the decision is made; seeding is a content task. Not executed pending the call.

---

## PRD-024 — Rate-limiting fails open without Redis env
**Why owner:** requires checking prod Vercel env (no audit access).

`src/lib/rate-limit.ts` returns success for every call when
`STORAGE_KV_REST_API_URL/TOKEN` are unset/erroring. Local `.env.local` lacks them;
prod presence is unverified. Action: confirm the Redis vars exist on prod Vercel.
For the LLM endpoint (`/api/requests/parse`) specifically, decide fail-closed vs.
an in-memory fallback so a lost Redis var can't uncap OpenRouter spend. The new
signup limiter (PRD-009) inherits this same dependency — same fix covers both.

---

## PRD-009 (email-ownership half) — replace `email_confirm: true` with a verified-ownership flow
**Why owner:** conflicts with a documented landmine and is a full onboarding redesign.

The rate-limit + zod hardening shipped. The remaining squatting vector
(`admin.createUser({ email_confirm: true })` lets anyone create a confirmed
account on an email they don't own) is NOT a safe drop-in flip:

- Landmine **ADR-014/ERR-029** mandates `email_confirm: true` specifically to avoid
  a JWT-race white-screen, and the action's immediate `signInWithPassword` depends
  on the account being confirmed.
- A real verified-ownership flow means: create the account unconfirmed, send a
  verification email (new template + `/auth/confirm` handling), and defer the
  session until the link is clicked — a different UX, new routes, and a revisit of
  the race the landmine documents.

**Recommendation:** treat as a scoped onboarding project with a HOT-entry update,
not a hotfix. Interim mitigation (already shipped) is the IP+email rate limiter,
which throttles mass-squatting. Do NOT flip `email_confirm` in isolation.
