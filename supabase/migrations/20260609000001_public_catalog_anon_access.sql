-- Historical remote-applied migration restored for Supabase migration-history parity.
--
-- The production database already has version 20260609000001 recorded. In the
-- current squashed local history, this version sorts before the 20260702000000
-- schema baseline, so a fresh local reset has no traveler_requests table yet.
-- Keep the original policy change guarded so local resets can proceed; the
-- later baseline and hardening migrations define the effective final policy.

DO $$
BEGIN
  IF to_regclass('public.traveler_requests') IS NOT NULL THEN
    DROP POLICY IF EXISTS "traveler_requests_select" ON public.traveler_requests;

    CREATE POLICY "traveler_requests_select"
      ON public.traveler_requests
      FOR SELECT
      USING (
        -- anonymous: open requests are publicly visible
        status = 'open'::public.request_status
        -- owner always sees their own
        OR (SELECT auth.uid()::uuid) = traveler_id
        -- admin sees all
        OR public.is_admin()
        -- authenticated users can see open+joinable requests
        OR (
          (SELECT auth.uid()::uuid) IS NOT NULL
          AND status = 'open'::public.request_status
          AND open_to_join = true
        )
      );
  END IF;
END $$;
