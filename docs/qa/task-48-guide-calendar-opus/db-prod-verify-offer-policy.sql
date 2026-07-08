select policyname,
       with_check like '%guide_interval_blocked%' as has_calendar_gate,
       with_check like '%profile_account_status_for%' as has_account_gate,
       with_check like '%is_available%' as has_master_switch_gate,
       with_check like '%is_admin%' as has_admin_escape
from pg_policies
where schemaname='public'
  and tablename='guide_offers'
  and policyname='guide_offers_insert';
