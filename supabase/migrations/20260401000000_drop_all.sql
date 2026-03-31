-- =============================================================================
-- Provodnik — DROP ALL
-- Wipes the entire public schema cleanly before rebuild.
-- Safe to run on a fresh DB (all DROP statements use IF EXISTS).
-- =============================================================================

-- Auth trigger
drop trigger if exists on_auth_user_created on auth.users;

-- Tables (CASCADE handles all FKs)
drop table if exists public.moderation_actions        cascade;
drop table if exists public.moderation_cases          cascade;
drop table if exists public.dispute_evidence          cascade;
drop table if exists public.dispute_notes             cascade;
drop table if exists public.disputes                  cascade;
drop table if exists public.messages                  cascade;
drop table if exists public.thread_participants       cascade;
drop table if exists public.conversation_threads      cascade;
drop table if exists public.marketplace_events        cascade;
drop table if exists public.notification_deliveries   cascade;
drop table if exists public.notifications             cascade;
drop table if exists public.favorites                 cascade;
drop table if exists public.reviews                   cascade;
drop table if exists public.bookings                  cascade;
drop table if exists public.guide_offers              cascade;
drop table if exists public.open_request_members      cascade;
drop table if exists public.traveler_requests         cascade;
drop table if exists public.listing_media             cascade;
drop table if exists public.listings                  cascade;
drop table if exists public.guide_documents           cascade;
drop table if exists public.storage_assets            cascade;
drop table if exists public.guide_profiles            cascade;
drop table if exists public.profiles                  cascade;
drop table if exists public.quality_snapshots         cascade;
drop table if exists public.destinations              cascade;

-- Storage buckets (must use Storage API — direct DELETE is blocked by trigger)
do $$
declare
  b text;
begin
  foreach b in array array['guide-media', 'listing-media', 'dispute-evidence'] loop
    begin
      perform storage.empty_bucket(b);
      perform storage.delete_bucket(b);
    exception when others then
      null; -- bucket doesn't exist, skip
    end;
  end loop;
end $$;

-- Functions
drop function if exists public.set_updated_at()                                                                                      cascade;
drop function if exists public.current_profile_role()                                                                                cascade;
drop function if exists public.is_admin()                                                                                            cascade;
drop function if exists public.is_guide()                                                                                            cascade;
drop function if exists public.handle_new_user()                                                                                     cascade;
drop function if exists public.touch_thread_updated_at()                                                                             cascade;
drop function if exists public.clean_text_array(text[])                                                                              cascade;
drop function if exists public.sync_guide_profile_onboarding_fields()                                                               cascade;
drop function if exists public.user_has_role(uuid, public.app_role)                                                                  cascade;
drop function if exists public.can_access_request_thread(uuid, uuid)                                                                 cascade;
drop function if exists public.can_access_offer_thread(uuid, uuid)                                                                   cascade;
drop function if exists public.can_access_booking_thread(uuid, uuid)                                                                 cascade;
drop function if exists public.can_access_dispute_thread(uuid, uuid)                                                                 cascade;
drop function if exists public.can_access_conversation_thread(uuid, uuid)                                                            cascade;
drop function if exists public.can_create_conversation_thread(public.thread_subject, uuid, uuid, uuid, uuid, uuid)                   cascade;

-- Enum types
drop type if exists public.app_role                  cascade;
drop type if exists public.guide_verification_status cascade;
drop type if exists public.listing_status            cascade;
drop type if exists public.request_status            cascade;
drop type if exists public.member_status             cascade;
drop type if exists public.offer_status              cascade;
drop type if exists public.booking_status            cascade;
drop type if exists public.favorite_subject          cascade;
drop type if exists public.review_status             cascade;
drop type if exists public.notification_kind         cascade;
drop type if exists public.dispute_status            cascade;
drop type if exists public.storage_asset_kind        cascade;
drop type if exists public.thread_subject            cascade;
drop type if exists public.message_sender_role       cascade;
drop type if exists public.event_scope               cascade;
drop type if exists public.moderation_subject        cascade;
drop type if exists public.moderation_decision       cascade;
