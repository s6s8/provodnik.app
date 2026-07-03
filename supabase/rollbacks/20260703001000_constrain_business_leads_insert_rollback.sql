-- Rollback for 20260703001000_constrain_business_leads_insert.sql.
-- Restores the original permissive anon/authenticated insert policy.

begin;

drop policy if exists "business_leads_insert_constrained" on "public"."business_leads";

create policy "business_leads_insert_any"
  on "public"."business_leads"
  for insert
  to "authenticated", "anon"
  with check (true);

commit;
