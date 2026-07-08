-- Restore profiles.phone from the 2026-07-01 backup. The off-platform handoff on
-- confirmed bookings reads profiles.phone directly; it was left null after an
-- out-of-band backup into _bak_profiles_phone_20260701. Idempotent: only fills
-- rows whose phone is currently null so we never clobber a newer value.
update public.profiles p
set phone = b.phone
from public._bak_profiles_phone_20260701 b
where b.id = p.id
  and p.phone is null
  and b.phone is not null;
