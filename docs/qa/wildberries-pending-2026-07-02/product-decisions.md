# Wildberries pending — owner decisions & infra items (2026-07-02)

These items are **not** safe to implement as code from the audit alone. They need a
product/legal decision or an infrastructure/DB action. No fake fixes were made.

---

## 1. `/guide/settings/contact-visibility` — feature decision (Badma)

**Audit row:** «Это такая поощрительная фишка для гидов? Бадма, надо вводить?»

**Status:** Decision required — not a bug.

The page exists as a guide-facing toggle for how contact details are surfaced.
Whether it stays as an incentive/gating feature is a **product call for Badma**, not an
engineering fix. No code change was made.

**Options to decide:**
- Keep as-is (guide controls contact visibility).
- Gate behind verification / plan tier as an incentive.
- Remove if it duplicates the existing offer-accept flow (contacts revealed only after an
  accepted offer).

---

## 2. `/guides` catalog error «Не удалось загрузить гидов» — infra / DB sync

**Audit row:** guides page errors on `vps.provodnik.app` although active guide accounts
exist; guides also missing from admin.

**Root cause (confirmed in code):** this is **not** an application-code bug.
- The `/guides` page already renders a clean empty state when zero guides match; the red
  error only appears when the data call *throws*.
- The data path calls the `search_guides` RPC and reads the `v_guide_public_profile`
  view. Both are defined in `supabase/migrations/` (e.g. `20260516000001_search_guides_rpc.sql`,
  `20260624000000_refreeze_search_guides_rowtype.sql`, `20260618130000_guide_public_profile_card_fields.sql`).
- A hard error there means, on the VPS database, one of: the RPC/view is **missing or
  stale** (migrations not fully applied), the RPC **composite rowtype is stale** after a
  column change (note the repeated `fix/refreeze_search_guides_rowtype` migrations), or
  **RLS/grants** deny anon execution/read.

**Owner/infra action (no code fix fabricated):**
1. Apply all `supabase/migrations/` to the VPS DB and confirm `search_guides` +
   `v_guide_public_profile` exist with the current signatures.
2. If the RPC exists but errors, re-run the latest `refreeze_search_guides_rowtype`
   migration (Postgres caches composite rowtypes; a column change invalidates the RPC
   until refrozen).
3. Verify `EXECUTE` grant on `search_guides` and `SELECT` on `v_guide_public_profile`
   for the anon/public role used by the site.

The same missing-data condition explains guides being absent from `/admin/guides`
(review queue only shows `submitted`) — see the code note: approved/active guides are
browsed via **`/admin/users`**, not the review queue.

---

## 3. Account deletion / blocking admin tool — verified, no change needed

**Audit row:** «Какой админский аккаунт может удалять аккаунты? Не нашёл tool.»

**Status:** Already implemented on this branch (`/admin/users`), verified safe.
- Account **suspend / archive** and **role change** exist with required reason
  (`/admin/users/[id]` → account actions).
- **Hard delete is demo-only**: guarded, requires typing `УДАЛИТЬ` + a reason, and is
  restricted to demo accounts — real users cannot be hard-deleted from the UI.
- The console is reachable from the admin sidebar → **«Пользователи»**.

No destructive real-user delete was added, per constraints. If the owner wants a
documented "safe to delete" account list, that remains an operator/data task, not a UI
change.
