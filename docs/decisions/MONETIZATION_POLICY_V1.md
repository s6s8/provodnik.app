# Monetization policy V1 (commission)

**INTERNAL — not for public distribution; investor-facing use only**

## Commission rate and monetary representation

V1 take is a **15% flat commission** calculated on **`subtotal_minor`** (the booking subtotal stored as an integer in **kopecks**).

All **user-facing amounts are shown in RUB** (whole rubles or rubles with sensible fractional display, per product rules). **Persisted money fields remain kopecks in `*_minor` columns.** All RUB ⇄ kopecks crossings must go through the central helpers described in **AP-012** and **ADR-013** (see cross-links below); do not inline `* 100` / `/ 100` in feature code.

## Ledger write trigger (booking lifecycle)

The **sole** booking status transition that may create the primary commission accrual row in the future `partner_payouts_ledger` is **`confirmed` → `completed`**. No other transition accrues platform commission under this V1 policy frame.

Authoritative transition graph: [`src/lib/bookings/state-machine.ts`](../../src/lib/bookings/state-machine.ts) (database-aligned `BookingStatus` and `BOOKING_TRANSITIONS`). Narrow UI mapping from DB enums is documented under **ADR-008** in [`.claude/sot/DECISIONS.md`](../../.claude/sot/DECISIONS.md).

## Reversal and claw-back (negative `delta`)

When commission must be unwound (for example after a partial refund agreed post-completion), the ledger records **one row with a negative `delta`** (kopecks owed back by the guide or credited against future payout) with **`ref_id = booking.id`** so every monetary movement stays idempotently tied to the originating booking.

## Competitive benchmark (anchored)

**Target take:** **10%–15%** on the relevant booking base (this policy fixes V1 at **15%** until revisited).

**Comparator:** public guide-facing materials for **Sputnik8** cite **24% and higher**, with a **minimum 200 ₽ per ticket** — materially above our target band.

Those anchors are stated in product research, not invented here: see **PRD §1** (“lower commission than on major aggregators”) in [`docs/product/PRD.md`](../product/PRD.md) and **MARKET_RESEARCH §3** (Sputnik8 commission facts) plus **§6** (10%–15% positioning) in [`docs/product/MARKET_RESEARCH.md`](../product/MARKET_RESEARCH.md).

## Disputes and payout freeze

If a booking is **`disputed`** and **`payout_frozen = true`**, **no new commission ledger write** (accrual or payout) is performed until the dispute is resolved and freeze is cleared. Ledger activity resumes only under the resolved outcome and the rules above.

## Deferred models (subscription, paid placement, lead fee)

**Subscription**, **paid placement**, and **lead-fee** monetization are **explicitly out of scope for this V1 commission policy** and remain subject to the **ADR-050** deferred decision frame.

**Re-evaluation trigger (unchanged):** revisit when **100 real traveler requests** have been recorded **or** **30 days post-launch**, whichever is sooner — see [ADR-050 in `.claude/sot/DECISIONS.md`](../../.claude/sot/DECISIONS.md#adr-050--monetization-model-deferred-to-post-launch-2026-05-02).

**Lead fee and ADR-052:** a **lead-fee at contact reveal** (one of ADR-050’s candidate frames) is **mechanically blocked** until a **contact-reveal** product surface exists; **ADR-052** currently keeps strict anti-disintermediation for V1 (no off-platform contact affordance). Until that architecture changes, **do not plan lead-fee revenue** as an active instrument — see [ADR-052 in `.claude/sot/DECISIONS.md`](../../.claude/sot/DECISIONS.md#adr-052--anti-disintermediation-softening-deferred-2026-05-02).

## Design targets (not yet in schema)

> **Design targets (not yet in schema)**  
> The following identifiers describe **future-schema intent only**. They are **not** queryable in production schema today and must not be assumed in application code or RLS until a dedicated migration ships:
>
> - `partner_payouts_ledger`
> - `subtotal_minor`
> - `payout_frozen`

## HOT-NEW guard relationship (policy vs implementation)

This document **establishes authoritative policy definition required by the code-level HOT-NEW guard — implementation is a separate open ticket**. That framing governs financially sensitive surfaces (for example demo payment UI that must never mislead production users); shipping schema, triggers, and UI that enforce the policy remains follow-on work.

## Cross-links (canonical sources)

- **ADR-050** — monetization model deferral and re-evaluation trigger: [`.claude/sot/DECISIONS.md`](../../.claude/sot/DECISIONS.md#adr-050--monetization-model-deferred-to-post-launch-2026-05-02)
- **ADR-052** — anti-disintermediation posture and future contact-reveal frame: [`.claude/sot/DECISIONS.md`](../../.claude/sot/DECISIONS.md#adr-052--anti-disintermediation-softening-deferred-2026-05-02)
- **AP-012** / **ADR-013** — kopecks storage and helper-only conversions: [`.claude/sot/ANTI_PATTERNS.md`](../../.claude/sot/ANTI_PATTERNS.md) and [`.claude/sot/DECISIONS.md`](../../.claude/sot/DECISIONS.md) (ADR-013 section)
- **Booking state machine** — allowed transitions: [`src/lib/bookings/state-machine.ts`](../../src/lib/bookings/state-machine.ts)
