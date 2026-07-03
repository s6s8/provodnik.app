-- Counter-offer flow marks the original offer as `counter_offered` and inserts a
-- replacement pending offer for the same guide/request. Treating
-- `counter_offered` as active in this uniqueness index blocks that valid flow.

drop index if exists public.guide_offers_one_active_per_guide_request;

create unique index guide_offers_one_active_per_guide_request
  on public.guide_offers (request_id, guide_id)
  where status = any (array[
    'pending'::public.offer_status,
    'bid_sent'::public.offer_status,
    'accepted'::public.offer_status,
    'confirmed'::public.offer_status,
    'active'::public.offer_status
  ]);
