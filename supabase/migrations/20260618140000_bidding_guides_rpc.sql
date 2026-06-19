-- Read-only, privacy-scoped social proof for the public visitor view: which
-- approved guides have a live (pending) bid on an OPEN/сборная request.
-- Returns only already-public profile fields; no offer contents. SECURITY DEFINER
-- because non-owners are RLS-blocked from reading guide_offers directly.
create or replace function public.get_bidding_guides_for_request(p_request_id uuid)
returns table (
  user_id uuid, full_name text, avatar_url text,
  average_rating numeric, review_count integer, slug text
)
language sql stable security definer set search_path = public
as $$
  select distinct on (gp.user_id)
    gp.user_id, p.full_name, p.avatar_url, gp.average_rating, gp.review_count, gp.slug
  from public.guide_offers o
  join public.guide_profiles gp on gp.user_id = o.guide_id
  left join public.profiles p on p.id = gp.user_id
  join public.traveler_requests tr on tr.id = o.request_id
  where o.request_id = p_request_id
    and o.status = 'pending'::public.offer_status
    and gp.verification_status = 'approved'
    and tr.open_to_join = true
  order by gp.user_id, gp.average_rating desc nulls last;
$$;

revoke all on function public.get_bidding_guides_for_request(uuid) from public;
grant execute on function public.get_bidding_guides_for_request(uuid) to anon, authenticated;
