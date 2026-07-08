-- Restore profiles.phone from the 2026-07-01 production backup when it exists.
-- Local/CI databases do not have the out-of-band backup table, so this migration
-- must be a no-op there. Idempotent: only fills rows whose phone is currently
-- null so we never clobber a newer value.
do $$
begin
  if to_regclass('public._bak_profiles_phone_20260701') is not null then
    update public.profiles p
    set phone = b.phone
    from public._bak_profiles_phone_20260701 b
    where b.id = p.id
      and p.phone is null
      and b.phone is not null;
  end if;
end $$;
