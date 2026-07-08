select
  exists(select 1 from supabase_migrations.schema_migrations where version='20260708170000') as migration_applied,
  to_regclass('public.guide_availability_blocks') is not null as table_exists,
  exists(
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='guide_interval_blocked'
  ) as function_exists;
