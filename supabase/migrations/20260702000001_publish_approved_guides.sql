-- Approved guide profiles must be public-searchable immediately after admin verification.
-- Historical approvals only set verification_status, leaving is_available=false and slug=null;
-- search_guides filters those rows out and slug-null cards cannot resolve to detail pages.

update public.guide_profiles gp
set
  is_available = true,
  slug = coalesce(
    nullif(gp.slug, ''),
    concat(
      coalesce(
        nullif(
          trim(both '-' from lower(regexp_replace(coalesce(gp.display_name, 'guide'), '[^[:alnum:]]+', '-', 'g'))),
          ''
        ),
        'guide'
      ),
      '-',
      left(replace(gp.user_id::text, '-', ''), 8)
    )
  ),
  updated_at = now()
where gp.verification_status = 'approved'
  and (gp.is_available is distinct from true or gp.slug is null or gp.slug = '');
