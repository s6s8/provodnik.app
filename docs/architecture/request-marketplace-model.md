# Request-first marketplace model (Phase 0)

This doc reconciles the current repo’s request surfaces with the Phase 0 “request-first” model. It is intentionally contract-level and does **not** assume full Supabase persistence beyond what exists today.

## Core objects

### Traveler request (`src/data/traveler-request/*`)

A traveler-owned request is the canonical “intent” object.

- **UI surface**: `src/app/(protected)/traveler/requests/*`
- **Contract**: `TravelerRequestRecord` (`src/data/traveler-request/types.ts`)
- **Schema**: `travelerRequestSchema` (`src/data/traveler-request/schema.ts`)

### Open request / joinable request (`src/data/open-requests/*`)

An “open request” is the joinable view of a traveler request when `openToJoiningOthers` is true. In the current repo, this is represented as a derived projection over `traveler_requests` + membership rows.

- **UI surface**: `src/app/(protected)/traveler/open-requests/*`
- **Contract**: `OpenRequestRecord` (`src/data/open-requests/types.ts`)
- **Supabase mapping**: `mapTravelerRequestRowToOpenRequestRecord` (`src/data/open-requests/supabase-client.ts`)

### Guide inbox / requests (`src/app/(protected)/guide/requests/*`)

The guide inbox consumes “requests” as work items. In Phase 0 this aligns to “traveler requests” that are eligible to receive offers, plus any open-request context needed for group formation (if applicable).

### Guide offer (`src/data/guide-offer/*`)

An offer is the guide’s structured proposal responding to a request.

- **Contract**: `GuideOfferDraft` (`src/data/guide-offer/schema.ts`)
- **Supabase access (when enabled)**: `src/data/guide-offer/supabase.ts`

### Negotiation (stub) (`src/data/negotiations/*`)

Negotiation is the message/thread surface around an offer, counters, and acceptance. Phase 0 provides **typed contracts only**.

- **Contract**: `NegotiationRecord` (`src/data/negotiations/types.ts`)
- **Schema**: `negotiationSchema` (`src/data/negotiations/schema.ts`)

### Destination (stub) (`src/data/destinations/*`)

Destination is the canonical reference object used across requests, listings, and discovery. Phase 0 provides **typed contracts only**.

- **Contract**: `DestinationRecord` (`src/data/destinations/types.ts`)
- **Schema**: `destinationSchema` (`src/data/destinations/schema.ts`)

## Mapping summary

- **Traveler request → Open request**: if the traveler toggles `openToJoiningOthers`, the traveler request can be projected into an `OpenRequestRecord` for the “open requests” feed.
- **Open request → Guide inbox**: guide inbox items should reference the underlying traveler request id, and optionally include open-request group context (roster/remaining spots) when the request is joinable.
- **Guide offer → Negotiation**: creating an offer can open a negotiation thread; in Phase 0 this is contract-only, not persisted end-to-end.

