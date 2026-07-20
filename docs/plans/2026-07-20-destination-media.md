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

## Task 5 — Security repair: revocable delivery copies and a cancel/confirm CAS

Two gaps found by review after the feature merged.

**Signed URLs survived unpublishing.** The public resolver signed the *original* private
object and leaned on the object SELECT policy to gate who could mint that URL. A Supabase
signed URL is a self-contained JWT, so an issued 3600s token kept serving the object after
the row was demoted, unpublished or deleted — the policy gates minting, not the minted
token, and a shorter TTL only narrows the window rather than closing it.

- A published primary cover is now served from a **separate delivery object**, copied from
  the original and tracked in `location_media.delivery_object_path`. The original is never
  signed for a public caller and never leaves the admin-only side of the object policy.
- Every demotion, unpublish and delete **deletes the delivery object first**. Removing the
  bytes is the revocation: outstanding signed URLs for that path die with it. A revocation
  failure throws before any row write, so publish state is left unchanged.
- Promotion **rotates**: the row's own previous copy and the outgoing primary's are revoked
  before the new copy is created, so no URL minted for an earlier cover survives a swap.
- `CHECK ((delivery_object_path IS NOT NULL) = is_primary)` makes "is primary" and "has a
  live copy" one fact, so the database cannot hold a primary with nothing to serve, nor a
  copy no row will ever revoke. The sibling-demote trigger fails closed against it.
- Existing primaries are demoted by the migration rather than backfilled — fabricating a
  copy there would publish bytes the migration cannot verify. Curators re-promote.

**Cancel raced confirmation.** Cancel read the object path, removed the bytes, then deleted
`WHERE status = 'uploading'`. A confirm interleaving between the read and the remove left a
`draft` row pointing at an object that had just been deleted.

- Cancel now claims the row by compare-and-swap `uploading -> cancelling` *before* touching
  storage; confirmation still only ever transitions `uploading`, so exactly one wins.
- Losing the CAS is a silent no-op. Bytes are removed, then the `cancelling` row is deleted;
  a removal failure leaves that row in place, keeping the object recoverable.
