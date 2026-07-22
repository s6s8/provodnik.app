-- Rollback for 20260722150000_admin_request_lifecycle.sql (forward-only repair).
-- Re-apply accept_offer, policies, and v_public_open_requests from prior migrations
-- if this rollback is executed in production.

DROP FUNCTION IF EXISTS public.admin_delete_traveler_request(uuid, text);
DROP FUNCTION IF EXISTS public.admin_unblock_traveler_request(uuid);
DROP FUNCTION IF EXISTS public.admin_block_traveler_request(uuid, text);
DROP FUNCTION IF EXISTS public.request_is_discoverable(uuid);

DROP TRIGGER IF EXISTS trg_guard_traveler_request_lifecycle ON public.traveler_requests;
DROP FUNCTION IF EXISTS public.fn_guard_traveler_request_lifecycle();

ALTER TABLE public.traveler_requests
  DROP COLUMN IF EXISTS admin_delete_reason,
  DROP COLUMN IF EXISTS deleted_by,
  DROP COLUMN IF EXISTS deleted_at,
  DROP COLUMN IF EXISTS admin_block_reason,
  DROP COLUMN IF EXISTS admin_blocked_by,
  DROP COLUMN IF EXISTS admin_blocked_at;
