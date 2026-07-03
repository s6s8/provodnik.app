-- Anonymous visitors could read raw `traveler_requests` rows directly through
-- PostgREST because `traveler_requests_select` exposed every open row to the
-- `anon` role with no auth predicate. That leaked internal `traveler_id`s and
-- raw free-text `notes` (which can contain phone/email PII).
--
-- Fix: direct table reads now require an authenticated session (guides still see
-- open requests for bidding, travelers see their own, admins see all). Public,
-- logged-out discovery goes through a sanitized view that omits `traveler_id`
-- and masks contact info in free-text notes.

-- Contact-info masking for public-facing free-text. Redacts emails and
-- phone-like digit runs. Runs on JSON-meta notes too: replacing an inner
-- substring keeps the surrounding JSON valid, and image URLs / slugs do not
-- contain 11+ char phone patterns or bare emails.
CREATE OR REPLACE FUNCTION "public"."mask_public_contact_info"("p_text" "text")
RETURNS "text"
LANGUAGE "sql"
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_text IS NULL THEN NULL
    ELSE regexp_replace(
           regexp_replace(
             p_text,
             '[[:alnum:]._%+\-]+@[[:alnum:].\-]+\.[[:alpha:]]{2,}',
             '[контакт скрыт]',
             'g'
           ),
           '\+?\d[\d ()\-]{9,}\d',
           '[контакт скрыт]',
           'g'
         )
  END;
$$;

ALTER FUNCTION "public"."mask_public_contact_info"("text") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."mask_public_contact_info"("text") IS
  'Redacts emails and phone-like digit runs from public-facing free-text (e.g. traveler request notes).';

-- Sanitized public projection of open requests. Owned by postgres and running
-- with the owner''s rights (security_invoker off), so it bypasses the tightened
-- RLS below and remains readable by anon — but only exposes a deliberate,
-- non-sensitive column set with masked notes and no traveler_id.
CREATE OR REPLACE VIEW "public"."v_public_open_requests"
WITH ("security_invoker" = false) AS
  SELECT
    "tr"."id",
    "tr"."destination",
    "tr"."region",
    "tr"."interests",
    "tr"."starts_on",
    "tr"."ends_on",
    "tr"."start_time",
    "tr"."end_time",
    "tr"."budget_minor",
    "tr"."currency",
    "tr"."participants_count",
    "tr"."format_preference",
    "public"."mask_public_contact_info"("tr"."notes") AS "notes",
    "tr"."open_to_join",
    "tr"."group_capacity",
    "tr"."status",
    "tr"."created_at",
    "tr"."date_flexibility",
    "tr"."date_locked",
    "tr"."time_locked",
    "tr"."requested_languages"
  FROM "public"."traveler_requests" "tr"
  WHERE "tr"."status" = 'open'::"public"."request_status";

ALTER VIEW "public"."v_public_open_requests" OWNER TO "postgres";

REVOKE ALL ON TABLE "public"."v_public_open_requests" FROM PUBLIC;
GRANT SELECT ON TABLE "public"."v_public_open_requests" TO "anon";
GRANT SELECT ON TABLE "public"."v_public_open_requests" TO "authenticated";
GRANT SELECT ON TABLE "public"."v_public_open_requests" TO "service_role";

COMMENT ON VIEW "public"."v_public_open_requests" IS
  'Anonymous-safe projection of open traveler requests: no traveler_id, contact info masked in notes. Public discovery reads this instead of the raw table.';

-- Tighten direct table reads: drop the unconditional anon `status = open` branch.
DROP POLICY IF EXISTS "traveler_requests_select" ON "public"."traveler_requests";
CREATE POLICY "traveler_requests_select" ON "public"."traveler_requests"
  FOR SELECT USING (
    ((( SELECT "auth"."uid"() AS "uid") = "traveler_id")
      OR "public"."is_admin"()
      OR ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND ("status" = 'open'::"public"."request_status")))
  );
