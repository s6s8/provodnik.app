# Opus Report — Admin User Management Console v1

**Date:** 2026-07-01 (UTC+3)
**Branch:** `feat/admin-user-management-opus`
**Worktree:** `/Users/idev/provodnik/.claude/worktrees/opus-fix-2026-07-01`
**Status:** ✅ Implemented, verified, committed. No unresolved blockers.

---

## Summary

Built a production-grade **Admin User Management Console** at `/admin/users` (+ `/admin/users/[id]`).
Admins can search/filter users, view a masked detail card, change account status
(suspend / reactivate / archive), change roles safely, verify/reject guides (reusing the
existing moderation pipeline), run bulk status actions with a confirmation modal, and
hard-delete demo-only accounts with typed confirmation. Every privileged mutation is guarded
in three layers (UI → server action → database) and written to an append-only audit log.

Design follows the Provodnik "clean ops console" system: shadcn/Tailwind primitives only, no
custom CSS, calm high-trust layout, visible state badges, masked PII. Verified at 1280px and
375px with a clean console.

---

## Files changed

**New — DB migration**
- `supabase/migrations/20260701120000_admin_user_management.sql`

**New — data layer (client-safe, `src/data/admin-users/`)**
- `schema.ts` — enums, labels, zod input/filter schemas, action-result types
- `guards.ts` — pure safety helpers (demo detection, status/role guards, PII masking)
- `guards.test.ts` — 24 unit tests
- `index.ts` — barrel

**New — server-only data + actions**
- `src/lib/supabase/admin-users.ts` — list/detail/audit reads, guard counts, audit writer
- `src/app/(protected)/admin/users/actions.ts` — status/role/delete/guide/bulk server actions
- `src/app/(protected)/admin/users/actions.test.ts` — 5 guard-wiring tests

**New — UI**
- `src/app/(protected)/admin/users/page.tsx` — list (server component)
- `src/app/(protected)/admin/users/_components/users-console.tsx` — interactive table, filters, bulk toolbar + modal, pagination
- `src/app/(protected)/admin/users/_components/user-badges.tsx` — status/role/guide badges
- `src/app/(protected)/admin/users/[id]/page.tsx` — detail (server component)
- `src/app/(protected)/admin/users/[id]/_components/account-actions.tsx` — status/role/guide/delete client islands

**Modified**
- `src/lib/navigation.ts` — added `/admin/users` route to the admin sidebar/mobile nav
- `src/lib/navigation.test.ts` — updated nav snapshot for the new entry
- `src/lib/supabase/database.types.ts` — additive types only (account_status enum, profiles
  lifecycle columns, admin_audit_log table, admin_set_account_status RPC). 60-line additive
  diff — a full regen was rejected because the committed types are a stale hand-maintained
  snapshot (would have produced a 1100-line off-scope diff / migration-drift landmine).

**Screenshots**
- `docs/qa/screenshots/admin-users/admin-users-list-1280.png`
- `docs/qa/screenshots/admin-users/admin-users-list-375.png`
- `docs/qa/screenshots/admin-users/admin-user-detail-1280.png`
- `docs/qa/screenshots/admin-users/admin-user-detail-375.png`
- `docs/qa/screenshots/admin-users/admin-users-bulk-modal-1280.png`

---

## Migration applied + DB objects verified

Migration `20260701120000_admin_user_management.sql` was **applied to the local Supabase stack**
(the running dev DB) and introspected directly — the migration tracker was NOT trusted
(migration-drift landmine confirmed: the tracker's latest was weeks behind the actual schema).

Verified via `information_schema` / `pg_policies` / `pg_proc`:

- **enum** `account_status` = `active | suspended | archived` ✓
- **profiles columns** `account_status` (NOT NULL default `active`), `status_reason`,
  `status_changed_at`, `status_changed_by` — all present; all 23 existing rows backfilled to `active` ✓
- **`profiles_update` WITH CHECK** now includes both the existing role guard
  (`role = profile_role_for(id)`) AND a new `account_status = profile_account_status_for(id)`
  guard — status is frozen for ordinary UPDATEs ✓ (role guard NOT regressed)
- **`admin_audit_log`** table + RLS: `SELECT`/`INSERT` policies for admins only; no UPDATE/DELETE
  policy → append-only by construction ✓
- **functions** `profile_account_status_for` (SECURITY DEFINER) and `admin_set_account_status`
  (SECURITY DEFINER, transactional) ✓

**RPC functionally verified against the live local DB** (inside rolled-back transactions):
- happy path suspends a user AND writes the audit row atomically ✓
- self-guard raises `forbidden: administrators cannot change their own account status` ✓
- non-admin caller raises `forbidden: admin role required` ✓

**Production:** the migration file is committed but **NOT yet applied to prod** — pending an
operator DB push. It is additive and backward-compatible. See "Pending" below.

---

## Actions implemented

| Action | Path | Guards |
|---|---|---|
| Suspend / reactivate / archive | `admin_set_account_status` RPC via user client | self, no-op, last-active-admin (SQL + TS) |
| Role change | admin API `app_metadata` + `profiles.role` + audit | self, no-op, last-active-admin; keeps both role sources in sync (ERR-096) |
| Guide approve / reject | reuses `ensureOpenModerationCase` + `performModerationAction` | existing moderation pipeline + audit row |
| Bulk approve / suspend / reactivate / archive | per-item, eligibility-filtered | applies eligible, skips protected, returns applied/skipped summary |
| Hard delete (demo only) | admin API `deleteUser` + audit-before-delete | demo-domain rule, non-admin, non-self, typed confirmation, reason required |

Demo detection is a **server-side domain allowlist** (`example.com`, `provodnik.test`);
`provodnik.app` is treated as real staff and is never deletable. Every mutation writes an
`admin_audit_log` row; no raw PII is stored in metadata (reason text is admin-authored).

---

## Safety guards (tested)

Pure guards unit-tested (`guards.test.ts`, 24 tests) and re-checked at the action layer
(`actions.test.ts`, 5 tests) and again in SQL:
- self-suspend / self-delete / self-demote blocked
- last-active-admin suspend/archive/demote blocked
- real (non-demo) users never hard-deletable; admins never hard-deletable
- hard delete requires the exact confirmation token + a reason
- email/phone masked in every list/detail surface (PII-012)

---

## Commands run

| Command | Result |
|---|---|
| `bun run typecheck` | ✅ 0 errors |
| `bun run lint` | ✅ 0 errors/warnings |
| `bun run test:run` | ✅ 1104 passed / 224 files (incl. 29 new admin-users tests) |
| `bun run build` | ✅ compiled; `/admin/users` + `/admin/users/[id]` routes built |
| `bun run playwright` (full e2e) | ⚠️ 1 passed, 6 skipped, **5 failed — all pre-existing & unrelated** (homepage-spacing pixel checks + guest request-first form; none touch admin/users, none depend on this diff) |

`lint:gid` has 3 pre-existing hits in unrelated files (disputes/bookings) — not introduced here.

### Focused browser verification (Playwright MCP, against local stack)
Per the task's sanctioned fallback for the flaky full suite:
- Admin login → `/admin/users` renders at **1280px** and **375px**; console clean (0 errors/warnings)
- Detail page renders at **1280px** and **375px**; console clean
- Filters (role/status/guide-status/guide-type/demo) + search present and wired to the URL
- Bulk selection → toolbar → **confirmation modal** opens with required reason
- **Bulk suspend executed end-to-end**: target moved to `suspended` with reason + `status_changed_by`,
  atomic audit row written; reactivate round-trip returned it to `active` (both audit rows present)
- Detail status controls, role controls (disabled until changed), guide section, and demo-only
  danger zone all render with correct contextual state; self-account shows "cannot act on self"
- Emails/phones masked everywhere (`g•••@example.com`, `··· NN`) — no raw PII in any screenshot

---

## Landmines observed

- **AP-014**: client islands import only `import type` from server-only modules; all shared
  constants/result types live in the client-safe `src/data/admin-users/` module.
- **ERR-096**: role change updates Auth `app_metadata.role` and `profiles.role`, reverting Auth
  if the profile write fails.
- **PII-012**: contact data masked at the display layer; audit metadata carries no raw PII.
- **Migration drift**: introspected live schema (`information_schema`/`pg_proc`/`pg_policies`)
  instead of trusting the tracker; regenerated types were rejected in favor of a focused additive diff.
- **Z-index / custom CSS**: used shadcn Dialog/AlertDialog (correct overlay tier); no custom CSS classes.

## One bug found & fixed during verification
The bulk confirmation button initially closed the dialog in its `onClick`, which unmounted the
form and cancelled the submit (nothing applied). Fixed: the modal now closes from the action
reducer after submission completes, with an "Применяем…" pending state. Re-verified end-to-end.

## Independent Codex review and Hermes fixes
Codex reviewed the committed diff plus screenshots and found one blocker and two high-severity
issues. Hermes patched them before final reporting:

- **Fixed blocker:** suspended/archived admins no longer pass admin layout/action guards. The
  auth context now reads `account_status`; admin layout and `requireAdminSession()` require
  `active`; the migration also updates `is_admin()` / `current_profile_role()` so admin RLS is
  lifecycle-aware.
- **Fixed high:** mobile admin nav is no longer fixed over the table; the mobile action column is
  hidden because the user name already deep-links to detail, removing the clipped `Открыть`
  button on 375px.
- **Fixed high:** user search now sanitizes PostgREST `.or()` search text before interpolation
  so punctuation cannot alter filter syntax.
- **Fixed medium:** admin-entered reasons are scrubbed for email/phone patterns before audit
  metadata / moderation notes are stored.

Hermes re-ran `bun run typecheck`, `bun run lint`, focused admin/nav tests, and `bun run build`
after these fixes; all passed.

---

## Pending / follow-ups (non-blocking)

1. **Apply the migration to production** via an operator `supabase db push` (or SQL editor) —
   it is additive/backward-compatible; the console will render but status/role writes need the
   `account_status` columns + RPC live before use.
2. **Regenerate `database.types.ts` from prod** once the migration is applied there, to close
   the pre-existing hand-maintained-snapshot drift (out of scope for this task; the additive
   entries added here are correct for the new objects).
3. The full Playwright e2e suite has 5 pre-existing failures unrelated to this work
   (homepage spacing + guest request form); worth a separate cleanup ticket.

---

## Commit

- **Branch:** `feat/admin-user-management-opus`
- **Message:** `feat(admin): add user management console`
- **Exact hash:** the HEAD of the branch (`git rev-parse HEAD`) — reported in the delivery
  message; not hardcoded here to avoid a self-referential mismatch after amend.
- Pre-commit hook passed (typecheck, lint-ratchet: 0 errors / −2 warnings vs baseline, 1104 tests).
- **Not pushed** (per policy — awaiting operator push).
