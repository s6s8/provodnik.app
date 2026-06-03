comment on policy "review_ratings_breakdown_select"
  on public.review_ratings_breakdown
  is 'Deliberate public read: review rating breakdowns are exposed with published review content.';

comment on policy "help_articles_select"
  on public.help_articles
  is 'Deliberate public read: published help center articles are available without authentication.';

comment on policy "quality_snapshots_public_read"
  on public.quality_snapshots
  is 'Deliberate public read: catalog quality snapshots are visible to anonymous marketplace visitors.';

comment on policy "destinations_public_read"
  on public.destinations
  is 'Deliberate public read: destination catalog metadata is visible to anonymous marketplace visitors.';

comment on policy "profiles_select_auth_admin_hook"
  on public.profiles
  is 'Deliberate hook-only read: supabase_auth_admin needs profile roles while issuing custom access tokens.';
