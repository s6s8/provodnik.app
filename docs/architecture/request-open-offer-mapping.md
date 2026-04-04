# Request ↔ Open request ↔ Guide inbox mapping

## Purpose

One traveler request is exposed in three ways: as the traveler’s **request**, as a public **open request** (when the group is open to join), and as a **guide inbox item**. This doc defines the shared mapping so all surfaces stay consistent.

## Core identity

- **Traveler request** is the source of truth. It has a single id: `TravelerRequestRecord.id` (e.g. `req_seed_kazan_city_1`).
- **Open request** is a public view of that request when the traveler has chosen to form a group and allow others to join. `OpenRequestRecord.travelerRequestId` references the same id.
- **Guide inbox item** is the same request as seen by guides; it is derived from the same `TravelerRequestRecord` (same id), often shaped as `TravelerRequestInboxItem` for list/detail UIs.

## Data flow

```
TravelerRequestRecord (src/data/traveler-request)
        │
        ├── id ─────────────────────────────────────────────┐
        │                                                    │
        ▼                                                    │
OpenRequestRecord (src/data/open-requests)                   │
  · travelerRequestId === TravelerRequestRecord.id            │
  · status, group.sizeTarget, group.sizeCurrent               │
  · destinationLabel, dateRangeLabel, budgetPerPersonRub      │
        │                                                    │
        └── Public board: /requests, /requests/[id]           │
                                                             │
Guide inbox (TravelerRequestInboxItem from traveler-request) │
  · id === TravelerRequestRecord.id                          │
  · request: TravelerRequest (payload)                        │
        │                                                    │
        └── Guide UI: /guide/requests, request detail         │
                                                             │
TravelerOffer (src/data/traveler-request/types)               │
  · requestId === TravelerRequestRecord.id                    │
  · guide’s offer; counter-offers live in negotiations       │
        └────────────────────────────────────────────────────┘
```

## Rules

1. **Single id.** All three views use the same request id. No separate “open request id” for the same logical request.
2. **Open request is optional.** Not every traveler request has an `OpenRequestRecord`; only when the traveler has opened the group to others.
3. **Naming in code.** Use `requestId` or `travelerRequestId` consistently when linking to `TravelerRequestRecord.id`.
4. **Negotiations** (offers, counters, accept) are keyed by `requestId` and optionally `offerId`; see `src/data/negotiations`.

Ref: IMPLEMENTATION.md §15.3, §17 Phase 0.
