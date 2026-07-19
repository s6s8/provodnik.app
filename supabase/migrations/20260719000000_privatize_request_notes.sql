-- The anonymous-safe projection exposed the traveler's free-text «Пожелания»
-- (notes) to any unauthenticated visitor with only contact info masked. That
-- field's own placeholder invites «ограничения по здоровью» (health restrictions),
-- so masking phones/emails is not enough — the free text itself is private
-- (owner / authorized guide / admin only). Drop it from the public projection
-- entirely; public discovery keeps destination, dates, budget, group size and
-- themes. Because a view is a live projection, this is retroactive: every
-- already-public request's notes stop being served to anon the moment it lands —
-- the safe remediation for content that was previously public.
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
    -- Private free-text is never projected to the public. Column kept (as NULL) so
    -- `select *` consumers and the row shape stay stable. Note: `notes` also carries
    -- an optional JSON display blob (hero image, labels) on some rows; nulling the
    -- whole column drops those cosmetics for anon too — a deliberate safety-over-
    -- cosmetics choice (parsing to keep only the safe keys risks re-leaking the
    -- sensitive free-text). Anon falls back to computed labels + city image.
    NULL::"text" AS "notes",
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

COMMENT ON VIEW "public"."v_public_open_requests" IS
  'Anonymous-safe projection of open traveler requests: no traveler_id, no free-text notes (private to owner/authorized guide/admin). Public discovery reads this instead of the raw table.';
