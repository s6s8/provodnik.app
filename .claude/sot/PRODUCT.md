# PRODUCT.md — Provodnik

> Pinned digest. On any conflict, docs/product/ and docs/superpowers/specs/ win. Last reviewed: 2026-05-17.
>
> Shipped 2026-05-17 ahead of owner review — the mission, wedge, and glossary
> below are curated from source docs but not yet confirmed by Alex. Four terms
> remain unresolved under PENDING OWNER DEFINITION.

## Mission

Connect travelers who know what they want with guides who can deliver it — and
make every trip more affordable by turning strangers into travel companions.
(`docs/superpowers/specs/2026-04-13-provodnik-mission-vision.md` §Mission)

## Wedge strategy

Provodnik is **demand-first**: travelers post requests, guides bid, other
travelers join the same trip. It inverts the incumbent listing-first model.

| | Tripster (listing-first) | Provodnik (request-first) |
|---|---|---|
| Who initiates | Guide lists → traveler finds | Traveler requests → guide bids |
| Pricing | Fixed by guide upfront | Negotiated through bids |
| Group formation | Guide creates slots | Travelers join each other's requests |
| Commission | 22% + promotion uplift | 0% in v1 |

(`mission-vision.md` §What makes us different from Tripster)

Provodnik still has listings — but a listing is a **portfolio and trust
signal**, not the booking product. The booking product is the bid.
(`mission-vision.md` §What makes us different from Tripster)

**The trap:** request-first is the differentiator. Parity features (catalog,
filters, listing pages) support it but must not be built *ahead* of the
request → bid → join loop. MVP principle: "request-first, but not
request-only" (`MVP.md` §5).

## MVP boundary

MVP must ship the **complete non-payment transaction loop**: discovery →
request capture → group formation → guide response → booking confirmation →
reviews → moderation → refunds/support. Missing any part collapses the product
back into the pain points it fixes. (`MVP.md` §18)

V1 scope locks (`mission-vision.md` §V1 scope decisions, locked 2026-04-11):
- No payment integration — money moves off-platform between traveler and guide.
- No deposits; guide contact + exact meeting point unlock on bid acceptance.
- Bid-first for all booking types; no instant-book in v1.
- No cancellation UI (admin-only dispute path exists in DB).
- 0% commission — platform value is pure matching.

Intentionally **out of scope** (`MVP.md` §15): flights and hotels, operator
CRM, dynamic pricing engine, non-Russian languages, native mobile apps, large
loyalty program, insurance/visa products.

## Entity model & glossary

Canonical terms — use ONLY these (`KODEX.md` Rule 1; source: Alex, 2026-04-27,
"Туры — это совсем другое"):

| Term | Meaning | Never |
|---|---|---|
| готовые экскурсии | ready-made excursion listings | "готовые туры" |
| Биржа | the marketplace/exchange concept (use the Russian word) | "marketplace", "exchange" |
| запросы | what the request board is called inside the guide cabinet | "Биржа" as a guide-nav label |
| путешественник | the traveler | "клиент", "турист" |
| гид | the guide | "поставщик", "исполнитель" |
| сборная группа | a group assembled from several travelers joining one request | "открытая группа" |

Booking statuses (`MVP.md` §10.1): `pending`, `awaiting guide confirmation`,
`confirmed`, `cancelled`, `completed`, `disputed`.

### PENDING OWNER DEFINITION

These terms surfaced in product/planning discussion but have **no pinned
definition** in any current source document. Listed, not guessed — Alex to
define:

- **флагман** — (no confirmed definition in sources)
- **лента** — (no confirmed definition in sources)
- **первая волна** — (no confirmed definition in sources)
- **достроить сборную** — (no confirmed definition in sources; may be a verb
  phrase over the canonical term "сборная группа" — owner to confirm)

## Core flow

1. Traveler posts a request — destination, dates, group size, interests, budget.
2. Matching guides receive it and send structured offers (price, inclusions,
   timing, capacity, expiry).
3. Traveler compares offers, asks questions in platform chat, accepts one.
4. A booking object is created; the reservation is confirmed with explicit
   (off-platform) payment instructions; guide contact + meeting point unlock.
5. Meanwhile other travelers can join the open request → сборная группа →
   per-person price drops.
6. Tour completes; both sides review.

(`mission-vision.md` §How Provodnik works; `MVP.md` §8.2, §8.3)

## Owner profile

**Alex** — non-technical product owner. Working language: Russian. Decides
*what* is built, for *whom*, and which outcome is correct — not *how*.
Implementation-level questions (code, DB, configuration) must NOT be routed to
Alex; verify in the repo and bring a fact. (`KODEX.md` captured rules,
2026-05-16)

## Links

- `docs/product/MVP.md` — full MVP definition
- `docs/product/PRD.md` — product requirements
- `docs/product/MARKET_RESEARCH.md` — market research
- `docs/superpowers/specs/2026-04-13-provodnik-mission-vision.md` — mission/vision north star
- `docs/product/research/tripster/` — Tripster deep research (recovered 2026-05-17)
