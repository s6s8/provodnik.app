-- Restrict guide-only request metric RPCs from anonymous execution.
-- Baseline default/function grants can leave anon with EXECUTE even though the
-- function body is intended for authenticated guides only.

revoke all on function public.count_competing_offers(uuid) from anon;
revoke all on function public.record_request_view(uuid) from anon;

revoke all on function public.count_competing_offers(uuid) from public;
revoke all on function public.record_request_view(uuid) from public;

grant execute on function public.count_competing_offers(uuid) to authenticated;
grant execute on function public.record_request_view(uuid) to authenticated;

grant execute on function public.count_competing_offers(uuid) to service_role;
grant execute on function public.record_request_view(uuid) to service_role;
