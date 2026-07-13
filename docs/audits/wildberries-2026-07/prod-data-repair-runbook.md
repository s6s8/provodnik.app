# Production data-repair runbook (Task A2)

**Status: PREPARED, NOT APPLIED.** Nothing in this document has been run against production.
Applying it is an operator action behind an external gate.

## Preconditions (all must hold before step 1)

1. **A1 is deployed to production.** Commit `[A1] fix(admin): preserve guide identity across
   role changes`. Repairing rows while the clobbering write is still live re-corrupts them —
   this ordering is not optional.
2. Applied via the Supabase SQL editor or `psql` with the service role.
3. **Never `supabase db push`.** The prod migration ledger is truncated (known landmine).
   Every statement here is targeted SQL; record each applied statement in a ledger-repair note.
4. Every step is idempotent and safe to re-run top to bottom.

## Rehearsal evidence (this is not theory)

The full runbook below was executed against a local Postgres running the **real schema**
(`supabase db reset` from `supabase/migrations/`), inside a transaction that was rolled back.
Fixtures covered the four cases that matter:

| Fixture | Setup | Required outcome | Result |
|---|---|---|---|
| Corrupted guide | `display_name='ivan.petrov'`, `full_name='Иван Петров'` | repaired | ✅ → «Иван Петров» |
| **False-positive trap** | `display_name='shepard'`, `full_name='shepard'` — genuinely named like their email | **untouched** | ✅ unchanged, still `approved` |
| Demo/QA account | `qa.bot@example.com`, also corrupted | **excluded** | ✅ unchanged |
| Un-verified by the flip | `draft` now, but moderation history proves a prior `approve` | restored | ✅ → `approved`, `is_available=true` |

Post-check returned `remaining_corrupted=0`. The §5 rollback restored every row to its exact
pre-image. Backup captured 2 rows = 2 rows repaired.

### Schema verified against the live database, not inferred from app code

The plan required confirming column names before running. Done — all present:

- `moderation_cases`: `id, subject_type, guide_id, listing_id, review_id, opened_by,
  assigned_admin_id, status, queue_reason, risk_flags, created_at, updated_at`
- `moderation_actions`: `id, case_id, admin_id, decision, note, created_at`
- `subject_type` enum: `guide_profile, listing, review` → `'guide_profile'` is correct
- `decision` enum: `approve, reject, request_changes, hide, restore` → `'approve'` is correct
- `moderation_cases.queue_reason` is **NOT NULL** (caught during rehearsal)

No predicate adjustment was needed. The intent below is unchanged from the plan.

---

## 1. Pre-image backup (idempotent — run first)

```sql
create table if not exists public.repair_20260713_display_name_preimage as
select gp.user_id, gp.display_name, gp.verification_status, gp.is_available,
       p.full_name, now() as captured_at
from public.guide_profiles gp
join public.profiles p on p.id = gp.user_id
where gp.display_name = split_part(p.email, '@', 1)
  and coalesce(p.full_name, '') <> ''
  and p.full_name is distinct from gp.display_name
  and p.email not ilike '%@example.com'
  and p.email not ilike '%@provodnik.test';

select count(*) from public.repair_20260713_display_name_preimage;
```

Record that count. It must equal the number of rows step 3 reports as updated.

## 2. Dry run — review EVERY row before proceeding

```sql
select gp.user_id, gp.display_name as corrupted, p.full_name as repair_to,
       gp.verification_status, gp.is_available
from public.guide_profiles gp
join public.profiles p on p.id = gp.user_id
where gp.display_name = split_part(p.email, '@', 1)
  and coalesce(p.full_name, '') <> ''
  and p.full_name is distinct from gp.display_name
  and p.email not ilike '%@example.com'
  and p.email not ilike '%@provodnik.test';
```

**The anti-false-positive criterion:** the predicate requires a *distinct, non-empty*
`full_name`. Somebody legitimately named like their email local-part has
`full_name == display_name` and is therefore excluded by construction. The rehearsal proves it.

The guides from the msgs 544–593 thread must appear in this output. **Any row you do not
recognise gets confirmed individually before step 3.** Do not batch-approve a surprise.

## 3. Display-name repair

```sql
update public.guide_profiles gp
set display_name = p.full_name
from public.profiles p
where p.id = gp.user_id
  and gp.display_name = split_part(p.email, '@', 1)
  and coalesce(p.full_name, '') <> ''
  and p.full_name is distinct from gp.display_name
  and p.email not ilike '%@example.com'
  and p.email not ilike '%@provodnik.test';
```

Names repair to `full_name` because, under the pre-A4 single-field signup, `full_name` was
exactly what the guide typed as their public name. After A4 the two fields diverge by design;
this repair only touches pre-A4 corruption.

## 4. Verification restore

The flip also downgraded `verification_status` to `draft`. Restore **only** where moderation
history proves a prior approval — never on the basis of the current state alone.

```sql
-- Dry run first:
select gp.user_id, gp.verification_status
from public.guide_profiles gp
where gp.verification_status = 'draft'
  and exists (
    select 1 from public.moderation_cases mc
    join public.moderation_actions ma on ma.case_id = mc.id
    where mc.subject_type = 'guide_profile'
      and mc.guide_id = gp.user_id
      and ma.decision = 'approve'
  );

-- Then, same predicate:
update public.guide_profiles gp
set verification_status = 'approved',
    is_available = true
where gp.verification_status = 'draft'
  and exists (
    select 1 from public.moderation_cases mc
    join public.moderation_actions ma on ma.case_id = mc.id
    where mc.subject_type = 'guide_profile'
      and mc.guide_id = gp.user_id
      and ma.decision = 'approve'
  );
```

## 5. Rollback (rehearsed, restores exactly)

```sql
update public.guide_profiles gp
set display_name = b.display_name,
    verification_status = b.verification_status,
    is_available = b.is_available
from public.repair_20260713_display_name_preimage b
where b.user_id = gp.user_id;
```

Keep the backup table for 30 days, then drop it via an approved cleanup.

## 6. Post-checks — all must hold

```sql
-- No public guide renders an email local-part:
select count(*) from public.guide_profiles gp
join public.profiles p on p.id = gp.user_id
where gp.display_name = split_part(p.email, '@', 1)
  and coalesce(p.full_name,'') <> ''
  and p.full_name is distinct from gp.display_name
  and p.email not ilike '%@example.com'
  and p.email not ilike '%@provodnik.test';   -- expect 0

-- Backup is non-empty and matches the repaired count:
select count(*) from public.repair_20260713_display_name_preimage;
```

Then open `/guides` in an **anonymous** window at 1280 and 375. Anonymous is the point: RLS
shows an admin `profiles.full_name` while anonymous visitors read
`guide_profiles.display_name`. That asymmetry is exactly what hid this bug for weeks — an
admin session cannot verify this repair.

## 7. Phone-integrity audit (report only — no mutation)

```sql
select count(*)
from public.profiles p
join public.guide_profiles gp on gp.user_id = p.id
where p.role = 'guide' and coalesce(p.phone, '') = '';
```

Attach the **count**, not the rows (PII). These accounts are handled by A5's blocking prompt;
they stay publicly visible in the meantime, deliberately.

## 8. Listing-status straggler migration (Task B3)

`supabase/migrations/20260715000000_listings_active_to_published.sql` runs on dev/local. On
prod, apply its body as targeted SQL + a ledger entry. It takes its own pre-image backup and
carries its own rollback. Post-check:

```sql
select count(*) from public.listings where status = 'active';  -- expect 0
```

**Order matters:** B3's code must be deployed first. Migrating the rows while the queue still
writes `active` re-creates the stragglers.

## 9. Duplicate/test accounts from the debugging thread (msgs 561–590)

That debugging session created blocked duplicates and role-flipped test accounts on prod.
List them (`account_status <> 'active'`, created 2026-07-13), confirm **per account** with the
operator, and archive them **through the admin UI — not with SQL deletes**. Any hard delete
goes through `hardDeleteDemoUserAction`, whose guard permits demo emails only.

## Deploy order (strict)

```
A1 code → §1 backup → §2 dry run (reviewed) → §3 → §4 → §6 post-checks → anon browser check
                                                                              ↓
                                                       then A3 / A4 / A5 may ship
B3 code → §8
```
