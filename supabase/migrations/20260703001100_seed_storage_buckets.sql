-- R-08 — storage buckets were created out-of-band (dashboard), so their `public`
-- flag was environment-drift-prone: a bucket meant to be private could be world-
-- readable in one environment and not another, with nothing in version control to
-- catch it. The object-level RLS policies live in migrations; the bucket rows did not.
--
-- Fix: declare every bucket + its publicness in a migration. Source of truth is
-- src/lib/storage/buckets.ts (public flag + size/mime), plus `guide-portfolio`
-- (public per the `guide_portfolio_public_read` storage policy). Idempotent:
-- on conflict we reconcile ONLY the `public` flag (the drift-prone field) and leave
-- any ops-tuned size/mime limits on existing buckets untouched.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('guide-avatars',    'guide-avatars',    true,   2097152, array['image/jpeg','image/png','image/webp']),
  ('traveler-avatars', 'traveler-avatars', true,   2097152, array['image/jpeg','image/png','image/webp']),
  ('listing-media',    'listing-media',    true,   5242880, array['image/jpeg','image/png','image/webp']),
  ('guide-portfolio',  'guide-portfolio',  true,   5242880, array['image/jpeg','image/png','image/webp']),
  ('guide-documents',  'guide-documents',  false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('dispute-evidence', 'dispute-evidence', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update
  set public = excluded.public;
