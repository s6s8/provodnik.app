# Deploy checklist — Two-phase policy

This document defines Provodnik's deploy policy across two distinct phases of the product's lifecycle.
The phase transition is automatic and threshold-based; the director approves the first post-launch deploy.

---

## Phase 1 — Pre-launch (current)

**Active when:** fewer than 5 live listings AND zero real-user bookings have occurred.

### Policy

- Push directly to `main`. No preview URL required.
- CI must be green (typecheck + lint pass) before merge.
- Rollback: `git revert` the merge commit and push; Vercel re-deploys from the previous build in < 2 min.
- No additional sign-off required — any engineer on the project may deploy.

### Rationale

The product is pre-public. There are no real users whose active sessions or in-flight bookings could be disrupted. Direct-to-main lets the team iterate at maximum speed while the feature set is still being stabilised.

---

## Phase 2 — Post-launch gate (activates automatically)

**Trigger (either condition):**
- 5 or more active listings are live, **OR**
- 1 or more real-user bookings have been activated (guide accepted, traveler confirmed).

Once triggered, this phase remains active for all subsequent deploys — it does not revert if listings drop below 5.

### Policy

Every deploy to `main` must be staged through a Vercel preview URL first.

**Reviewer:** director (final approve on all production promotes in this phase).

### Smoke checklist (all 5 items must pass on preview URL before production promote)

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Request form renders | Open the traveler request form; all fields visible, no JS errors in console |
| 2 | Request submits successfully | Submit a test request; confirm success state shown and record appears in admin |
| 3 | Guide can accept offer | Log in as guide; accept the pending offer; confirm status changes to "accepted" |
| 4 | Privacy reveal is correct | After guide accepts: traveler's contact is revealed to guide only; not visible to public or other guides |
| 5 | Admin can see request | Log in as admin; confirm the request is visible in the admin panel with correct status |

All 5 checks are blocking. A partial pass is not sufficient.

### Rollback (Phase 2)

- Revert the Vercel promote to the previous production deployment (Vercel dashboard → Deployments → Promote previous).
- Notify the director immediately if a rollback occurs in production.
- Root cause must be documented in `docs/audits/` within 24 h of the incident.

---

## Phase transition log

| Date | Event | Who recorded |
|------|-------|--------------|
| _(not yet triggered)_ | Phase 2 threshold reached | — |
