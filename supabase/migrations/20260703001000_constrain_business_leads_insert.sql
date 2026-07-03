-- R-07 — `business_leads` anonymous insert was `WITH CHECK (true)`: any anon caller
-- could insert unbounded rows through PostgREST (spam / storage-pollution vector).
-- No application code inserts into this table (the /for-business page is static), so
-- tightening the shape cannot break a product flow — it only closes the abuse path.
--
-- Fix: replace the unconstrained policy with one that bounds every column to a sane
-- size and requires a non-trivial contact. Lead capture (anon or authenticated) still
-- works for well-formed submissions; there is still no SELECT policy, so the table
-- stays write-only for non-admins.

drop policy if exists "business_leads_insert_any" on "public"."business_leads";

create policy "business_leads_insert_constrained"
  on "public"."business_leads"
  for insert
  to "authenticated", "anon"
  with check (
    length(coalesce("contact", '')) between 3 and 200
    and ("company" is null or length("company") <= 200)
    and ("city" is null or length("city") <= 120)
    and ("dates" is null or length("dates") <= 120)
    and ("note" is null or length("note") <= 2000)
    and ("headcount" is null or ("headcount" >= 0 and "headcount" <= 100000))
  );
