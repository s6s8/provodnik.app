# Public catalog pre-flight (Task C1, item 7)

**Status: the code is ready and merged; the catalog is still OFF in every environment.**
Turning it on is an operator env change, deliberately not done by this run.

## What the code change did

`/listings` now has a nav entry, «Готовые экскурсии», registered in `NAV_FLAG_BY_HREF` against
`FEATURE_PUBLIC_CATALOG`. The flag is the single switch:

| `FEATURE_PUBLIC_CATALOG` | Nav entry | `/listings` |
|---|---|---|
| `1` | visible | renders the catalog |
| unset / `0` | **hidden** | redirects to `/guides` |

No change to the route's own logic. Pinned by `src/lib/navigation.test.ts`.

## Before flipping the flag — content check, not a code check

The catalog is only worth opening if what it shows is real. **Run this on production and read
the output before setting the flag.** If `would_render` is under 3, do not flip: an
almost-empty catalog is worse than no catalog, and the homepage block (C2) will stay collapsed
anyway by its own ≥3 gate.

```sql
-- Everything currently marked published:
select count(*) from public.listings where status = 'published';

-- What a real visitor would actually see: published, real (non-demo) owner,
-- non-QA slug, and carrying the minimum content to look like a product.
select count(*) as would_render
from public.listings l
join public.profiles p       on p.id = l.guide_id
join public.guide_profiles gp on gp.user_id = l.guide_id
where l.status = 'published'
  and p.email not ilike '%@example.com'
  and p.email not ilike '%@provodnik.test'
  and coalesce(gp.slug, '') not like 'qa-%'
  and coalesce(l.title, '')  <> ''
  and coalesce(l.region, '') <> '';

-- The rows that would render, to eyeball before going live:
select l.id, l.title, l.region, gp.slug as guide_slug
from public.listings l
join public.profiles p       on p.id = l.guide_id
join public.guide_profiles gp on gp.user_id = l.guide_id
where l.status = 'published'
  and p.email not ilike '%@example.com'
  and p.email not ilike '%@provodnik.test'
  and coalesce(gp.slug, '') not like 'qa-%'
order by l.created_at desc;

-- Demo/QA rows that are published and WOULD leak into the catalog. Unpublish these first.
select l.id, l.title, p.email, gp.slug
from public.listings l
join public.profiles p       on p.id = l.guide_id
join public.guide_profiles gp on gp.user_id = l.guide_id
where l.status = 'published'
  and (p.email ilike '%@example.com'
    or p.email ilike '%@provodnik.test'
    or coalesce(gp.slug, '') like 'qa-%');
```

Validated against the real schema on a local Postgres (`supabase db reset` from
`supabase/migrations/`); the local DB has no listings, so it returned 0/0. The **production**
numbers are the ones that decide.

## Ordering — B3 must land first

B3 (`active` → `published`) must be deployed **and** its data migration applied before the flag
flips. Otherwise queue-approved excursions still carry `status='active'`, which the catalog
does not read, and the catalog opens with a hole in it exactly where the moderators have been
working.

```
B3 code → B3 data migration → post-check (0 rows with status='active') → THEN flip the flag
```

## Flip the flag on all three environments, or not at all

`FEATURE_PUBLIC_CATALOG=1` on **Vercel production, Vercel preview, and the Mac mini staging
box**. Env drift across environments is a named risk in the plan and is the most likely cause
of "it works on preview but not on prod" reports. The flag is now documented in `.env.example`
— it was not before.

## After flipping

1. `/` and `/listings` at **1280px and 375px**, clean console (SHIP_GATE).
2. Header shows «Готовые экскурсии» next to «Запросы».
3. Anonymous window — the catalog is a public surface and RLS behaves differently for a
   logged-in admin.
4. Confirm no demo/QA excursion appears (re-run the last query above; expect zero rows).

## Rollback

Unset `FEATURE_PUBLIC_CATALOG`. The nav entry disappears and `/listings` redirects to
`/guides` again. No code revert, no data change.
