# Destination Media Administration Implementation Plan

> **For Hermes:** Use subagent-driven-development task-by-task; the execution pass is delegated to Opus.

**Goal:** Give administrators one reusable, safe media workspace for every canonical location/destination, so a published city cover replaces blue request-card and request-detail placeholders without duplicating uploads.

**Architecture:** Extend the existing `/admin/locations` catalogue rather than creating a parallel media section. Location media is a first-class data record with editorial metadata and a published primary cover; public request surfaces resolve that published cover and retain the existing branded fallback only when no published cover exists.

**Non-goals:** Do not invent or download city photography. Do not repurpose guide-owned Photobank. Do not alter existing public text, request privacy, pricing, or moderation behavior.

**Acceptance checks:**
1. An admin can open a canonical location, upload a JPG/PNG/WebP, see dimensions/file size/type, add alt text/caption/source, select a role, set it as primary, publish/unpublish, and delete it.
2. Only administrators can mutate location media; public users receive only published URLs.
3. A published primary cover for a location is used on public open-request cards and individual request heroes; a missing cover retains the exact existing branded fallback.
4. Existing location lifecycle (add/archive) remains intact; no duplicate destination catalogue is introduced.
5. At least focused unit/component tests cover validation, authorization boundary, primary/published selection, fallback, and admin interactions.
6. `bun run test:run`, `bun run check`, `bun run build`, and fresh DB tests pass. Live deployment/replay is performed by the managing agent after independent review.

## Task 1 — Data and access boundary
- Add the smallest destination/location media schema needed for original path plus displayed metadata: location relation, role, enabled/published state, primary flag, alt/caption/source, MIME, byte size, width/height, ordering, uploader and timestamps.
- Provision a dedicated storage bucket and admin-only object write policy. Public read must be limited to published media URLs, not unrestricted management APIs.
- Preserve auditability and use the existing storage/upload conventions.

## Task 2 — Server data layer and public image resolution
- Add focused location-media query/mutation helpers under `src/lib/supabase/`.
- Replace request-card/detail image resolution with active primary location media when present.
- Preserve `cityImage()` branded fallback exactly when media is absent, disabled, unpublished, or invalid.

## Task 3 — Admin location media workspace
- Keep the entry point under `/admin/locations`.
- Add a location detail/media route or equivalent focused editor reachable from each row.
- Provide upload, asset metadata, primary selection, publish/enable toggle, reorder where justified, and delete actions with clear loading/error states.
- Include image file validation before upload and server-side validation after submission.

## Task 4 — Tests and verification
- Follow TDD where possible. Cover success and rejection behavior.
- Update generated/local database types consistently with migration strategy.
- Run focused checks before the full suite.
- Commit all implementation and plan changes using a conventional human commit message; do not push.
