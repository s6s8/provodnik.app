# Provodnik — Operator Runbook

Internal reference for day-to-day production operations.

---

## 1. Ban a User

**Via Supabase Auth dashboard (preferred):**

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user by email or UUID
3. Click the user → "Ban User" → set ban duration (use a far-future date for permanent ban)

This sets `ban_until` on the Auth record. GoTrue will reject all token exchanges for that user immediately.

**How to find user UUID:**
Supabase Dashboard → Authentication → Users tab → copy the UUID from the user row.

**Note:** The `profiles` table has no `status` column. Do not attempt `UPDATE profiles SET status = 'banned'` — that column does not exist. The ban is enforced entirely at the Auth layer via `ban_until`.

---

## 2. Remove a Listing

**Via admin panel:**

1. Go to `/admin/listings`
2. Find the listing
3. Click Reject

**Direct SQL:**

```sql
UPDATE listings SET status = 'rejected' WHERE id = '<uuid>';
```

This is a soft delete — the listing row remains in the database but is invisible to the public (`listing_status` enum: `draft`, `published`, `paused`, `rejected`). No data is lost.

---

## 3. Approve a Guide

**Via admin panel:**

1. Go to `/admin/guides`
2. Find the guide
3. Click Approve

**Direct SQL:**

```sql
-- 1. Approve the guide profile
UPDATE guide_profiles
SET verification_status = 'approved'
WHERE user_id = '<uuid>';

-- 2. Record the moderation action (find the moderation_case id first)
INSERT INTO moderation_actions (case_id, admin_id, decision, note)
VALUES (
  '<moderation_case_uuid>',
  '<admin_user_uuid>',
  'approved',
  'Approved via direct SQL by operator'
);
```

To find the relevant `moderation_cases` id:

```sql
SELECT id, status FROM moderation_cases
WHERE subject_id = '<guide_user_uuid>'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 4. Resolve a Dispute

**Via admin panel:**

1. Go to `/admin/disputes`
2. Open the dispute
3. Add a resolution note
4. Mark as resolved

**State machine:** `open` → `under_review` → `resolved` / `closed`

**Direct SQL:**

```sql
UPDATE disputes
SET
  status = 'resolved',
  resolution_summary = '<resolution text>',
  resolved_at = now()
WHERE id = '<uuid>';
```

Note: The column is `resolution_summary`, not `resolution`.

---

## 5. Run a Production DB Migration

1. Open Supabase Dashboard → SQL Editor
2. Open the migration file from `supabase/migrations/<filename>.sql` in this repo
3. Paste the SQL into the editor
4. Click Run

**DO NOT use `supabase db push` in production.** That command requires CLI authentication against the hosted project and is error-prone in CI/CD contexts. Always use the SQL Editor directly.

Migration files are numbered by timestamp and apply in order. If running multiple migrations, apply them one at a time in chronological order and verify each succeeds before proceeding.

---

## 6. Roll Back a Bad Vercel Deploy

1. Go to Vercel Dashboard → your project → Deployments tab
2. Find the last known-good deployment (look for the one before the bad deploy)
3. Click the three-dot menu → "Promote to Production"

No code changes are needed. Vercel will re-route traffic to the previous build instantly. The bad deployment remains in history but is no longer serving traffic.

---

## 7. Environment Variables Reference

These vars must be set in Vercel project settings (Production, Preview, Development environments as appropriate).

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public Supabase project URL. Used by client-side and server-side Supabase clients. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable key. Safe to expose to the browser. RLS enforces access control. Also accepted as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy alias). |
| `SUPABASE_SECRET_KEY` | Yes | Supabase service role key. Bypasses RLS — used only in server actions and admin routes. Never expose to the browser. Also accepted as `SUPABASE_SERVICE_ROLE_KEY` (legacy alias). |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST endpoint. Used for rate limiting middleware. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis auth token. Pairs with `UPSTASH_REDIS_REST_URL`. |
| `RESEND_API_KEY` | Yes (when email active) | Resend API key for transactional email. Required for booking confirmations, dispute notifications, etc. |
| `RESEND_FROM_EMAIL` | Yes (when email active) | Sender address for outgoing email (e.g. `noreply@provodnik.app`). Must be a verified domain in Resend. |
| `SENTRY_DSN` | Yes (production) | Sentry Data Source Name. Enables error tracking and performance monitoring. |
| `SENTRY_AUTH_TOKEN` | Yes (build only) | Sentry auth token for source map uploads during `bun run build`. Not needed at runtime. |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical app URL (e.g. `https://provodnik.app`). Used for generating absolute URLs in emails and metadata. |

---

## 8. Seed Account Credentials

These accounts are created by `supabase/migrations/20260401000002_seed.sql` and exist in all local and staging environments.

### Primary test accounts

| Email | Password | Role |
|---|---|---|
| `admin@provodnik.test` | `Admin1234!` | admin |
| `traveler@provodnik.test` | `Travel1234!` | traveler |
| `guide@provodnik.test` | `Guide1234!` | guide (slug: dmitriy-kozlov) |

### Demo accounts

| Email | Password | Role |
|---|---|---|
| `admin@provodnik.app` | `Demo1234!` | admin |
| `guide@provodnik.app` | `Demo1234!` | guide (slug: alexei-sokolov) |
| `traveler@provodnik.app` | `Demo1234!` | traveler |

### Seed data accounts (5 guides, 8 travelers)

All use password: `SeedPass1!`

**Guides:**
- `guide.elista@example.com` — Елена Воронина
- `guide.kazan@example.com` — Тимур Сафин
- `guide.spb@example.com` — Анна Белова
- `guide.sochi@example.com` — Максим Королёв
- `guide.baikal@example.com` — Мария Гречко

**Travelers:**
- `traveler.anna@example.com` — Анна Пахомова
- `traveler.dmitry@example.com` — Дмитрий Лазарев
- `traveler.olga@example.com` — Ольга Мельникова
- `traveler.sergey@example.com` — Сергей Тарасов
- `traveler.irina@example.com` — Ирина Власова
- `traveler.maksim@example.com` — Максим Кудрявцев
- `traveler.svetlana@example.com` — Светлана Никитина
- `traveler.pavel@example.com` — Павел Романов

**Note:** Passwords shown above are seeded via `extensions.crypt()` in the migration. In production, accounts are created via Supabase Auth dashboard. Passwords for production accounts are set through "Reset password" in the Auth dashboard — they are not in any file.

---

## 9. Daily Ops Checklist

Run through this each business day:

- [ ] Check [Sentry](https://sentry.io) for new unhandled errors or performance regressions. Triage and assign any new issues.
- [ ] Check moderation queue at `/admin` — approve or reject pending guide verifications and listings. Target: clear the queue same day.
- [ ] Check open disputes at `/admin/disputes` — move any `open` disputes to `under_review`, and resolve any that have enough information.
- [ ] Verify last Vercel deployment succeeded (Vercel Dashboard → Deployments — no red builds).
- [ ] If a migration was run: confirm schema changes are reflected in `supabase gen types` output and that `src/types/supabase.ts` is up to date.
