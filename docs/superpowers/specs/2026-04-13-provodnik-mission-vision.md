# Provodnik — Mission, Vision & Product Identity

_Authored 2026-04-13. This document is the north star for all product and engineering decisions._

---

## Mission

**Connect travelers who know what they want with guides who can deliver it — and make every trip more affordable by turning strangers into travel companions.**

---

## Vision

Provodnik is a **demand-first travel marketplace** for excursions and tours across Russia and CIS.

Travelers post what they want. Guides bid to deliver it. Other travelers join the same trip.

That's the whole model. Every feature we build serves one of those three things.

---

## The problem we solve

Every existing excursion platform starts from the same assumption: guides know best. They list what they offer, at what price, on what schedule. Travelers scroll, filter, and pick. The traveler is a consumer, not a participant.

This creates three compounding problems:

1. **Travelers guess at what's available** instead of asking for what they actually want. You want a private dawn walking tour of the Kazan Kremlin for your family of 4 — you'll spend an hour filtering 60 listings hoping someone offers it. Nobody does.

2. **Guides compete on catalog visibility**, not on quality. The guide who can afford promotion or knows SEO wins over the best guide.

3. **Solo travelers pay solo prices** because nobody knows there are 5 other people who want the same tour on the same day in the same city.

---

## How Provodnik works

```
Traveler posts a request
  "3-hour walking tour of old Kazan, May 15, 2 people, morning, up to 4000 ₽"

Guides receive the request and bid
  Guide A: "3500 ₽, Kremlin gate 9am, 4.9★ 234 reviews"
  Guide B: "3200 ₽, I can add a tea ceremony, 4.7★ 180 reviews"

Traveler compares bids and accepts one
  → Guide confirmed, contact details unlock for both parties

Meanwhile, other travelers see the open request
  "2 other travelers want the same tour on May 15 in Kazan"
  → They join. Price per person drops 40%.
  → Original traveler gets a cheaper trip and travel companions.
```

Nobody browsed 50 listings. The best guide won on merit. Three strangers became a group.

---

## What makes us different from Tripster

| | Tripster | Provodnik |
|---|---|---|
| **Who initiates** | Guide lists → traveler finds | Traveler requests → guide bids |
| **Pricing** | Fixed by guide upfront | Negotiated through bids |
| **Group formation** | Guide creates slots, travelers independently book | Travelers organically join each other's requests |
| **Discovery** | Browse supply | Express demand OR browse open requests |
| **Commission** | 22% + promotion uplift | 0% in v1 — guides keep everything |
| **Power balance** | Guide-first | Traveler-first |

Provodnik still has listings — guides showcase their capabilities, profile, past tours. But a listing is a **portfolio and trust signal**, not the booking product. The booking product is the bid.

---

## The two traveler entry points

### Entry 1: "I know what I want"
Traveler posts a request directly — destination, dates, group size, interests, budget. Does not need to find a specific guide first. Guides come to them.

### Entry 2: "Show me what others are requesting"
Traveler browses the open requests feed. Sees 3 people in Kazan on May 15 looking for a walking tour. Joins their request instead of creating a new one. Splits the cost.

Both paths end at the same place: a competitive bid, an accepted offer, a confirmed trip.

---

## The name

**Проводник** means both *guide* and *conductor* in Russian — the person on a train who takes you through the journey, who knows the route, who is with you the whole way. It works on both sides of the marketplace: guides are проводники in the literal sense; the platform is the проводник between a traveler's desire and the right person to fulfill it.

---

## Success metric

A traveler in Moscow posts a request at 9pm. By morning, 3 guides have bid. One says: *"There are 2 other travelers requesting the same experience for the same dates — I can combine you for 40% less."* The traveler picks a guide, joins the group, pays less than anywhere else, and travels with people who wanted the same thing.

That's Provodnik working.

---

## V1 scope decisions (locked 2026-04-11, still current)

1. No payment integration. Money moves off-platform between traveler and guide.
2. No deposits. PII (guide contacts + exact meeting point) unlocks on bid acceptance.
3. Bid-first for all booking types. No instant-book in v1.
4. No cancellation UI. Admin-only dispute path exists in DB.
5. 0% commission. Platform value is pure matching.
