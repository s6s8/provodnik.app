# DECISIONS — Wildberries execution (2026-07-13)

Panel seats: **Systems** (architecture, sequencing, blast radius), **Domain** (North-Star /
product truth), **Adversary** (security, integrity, breakage paths).

---

## D-01 — Phone gate reads the row the guards already fetch (A1/A3)

**Plan said:** add a `profiles.select("phone")` query inside `setUserRoleAction`.
**Ruling:** extend `getTargetForGuards` to select `phone, full_name` instead. Zero extra queries.

- *Systems:* `getTargetForGuards` already SELECTs the target's `profiles` row by id. Adding two
  columns is free; a second query is a serial round trip.
- *Adversary:* attacked it — does widening the select leak anything? No: the row is fetched with
  the service-role client inside an admin-only action, and `phone`/`full_name` are already shown
  to admins in the same console. Return type is additive, so no caller breaks (all 5 callsites
  checked).
- *Domain:* A3 exists to make the role save feel fast. Adding a serial read inside A1 while A3
  removes one is self-defeating.

**Reversibility:** high (revert two columns). **Blast radius:** one function, five callers, all
in the same file.

---

## D-02 — New guide profiles never fall back to the email local-part (A1)

**Plan said:** `fallbackName = targetEmail?.split("@")[0] ?? COPY.guide`.
**Ruling:** fall back to `full_name`, then `COPY.guide`. The email is not passed in at all.

- *Domain:* item 13's complaint IS that an email local-part became a public display name.
  Re-introducing it on the insert path — even for a `draft`, hidden profile — recreates the bug
  class the card exists to kill.
- *Adversary:* conceded the row is not publicly visible while `draft`+`is_available=false`, but
  argued it becomes visible the moment a moderator approves it without the guide editing their
  name. That is a real path. Removing `targetEmail` from the function signature makes the leak
  impossible by construction rather than by policy.

**Recorded dissent:** none after the stress test.

---

## D-03 — B3 must also fix the guide calendar and `bulkSetStatus` (B3) ⚠️

**Plan said:** flip `moderateListing.ts` (`active` → `published`), migrate the rows, done.
**Ruling:** the plan is incomplete. Two more sites, both found by the Adversary seat.

- **`guide/calendar/page.tsx:111`** READS `listings.status = 'active'`. Migrating the rows to
  `published` without changing this **empties every guide's calendar**. The plan's own grep
  (`grep '"active"' src | grep -i listing`) does not match that line — the word "listing" is not
  on it. This is precisely the "status migration misses a reader" risk the plan's own §7 names,
  and the plan's grep was the thing that would have missed it.
- **`bulkSetStatus`** (guide-facing) was typed `"active" | "archived"` and wrote `'active'` — a
  second live path that silently hid a guide's own listings. It has no UI caller today, so
  narrowing the type kills the landmine in one word rather than deleting code.

**Also ruled:** introduce `PUBLIC_LISTING_STATUS` shared by writer and reader. The bug was two
literals drifting apart; a constant makes recurrence impossible. Two literals would just drift
again.

**Explicitly NOT touched** (both would be wrong): `listing_tour_departures.status = 'active'` is
a different table where `active` is correct, and `ExcursionRecord.status` is a hardcoded UI
view-model field that never reaches the DB.

---

## D-04 — Production is a hard external gate; artifacts, not executions (A2, C7, C8, C1-flag)

Per the contract. A2's runbook, C7's env verification, C8's prod repro and C1's flag flip are
**prepared and reviewed**, never run. This is the contract's design, not a shortfall — but it is
reported as *unverified*, never as *verified-good*.

**Adversary's condition, accepted:** a runbook that has never executed is a hypothesis. So A2 was
**rehearsed against a real Postgres with the real schema**, in a rolled-back transaction, with a
deliberate false-positive fixture. Without that fixture the runbook's core safety claim ("a guide
genuinely named like their email is excluded") was untested rhetoric.

---

## D-05 — C7 is a finding, not a config change

**Plan said:** the notification stack exists end-to-end; audit coverage and fix env drift.
**Ruling:** the premise is false, and the matrix says so plainly.

Only 2 of 7 triggers can deliver an email in production. Three have **zero callers**
(`notifyBookingConfirmed`, `notifyBookingCancelled`, `notifyReviewRequested` — the last of which
has working email code that nothing invokes). `FEATURE_TR_NOTIFICATIONS` does not gate email at
all; it gates the settings page and the bell.

- *Domain:* the highest-value gap is that guides are never emailed about matching new requests —
  marketplace liquidity depends on it.
- *Systems:* wiring those events is real work with real state-machine questions. C7's scope is
  "audit + config". Filed as follow-up cards N-1…N-4 rather than smuggled into a P1 audit card.

**Reversibility:** n/a (no code changed).

---

## D-06 — Tests that pin a reversed decision get updated, not deleted (C1)

Two `navigation.test.ts` tests asserted the catalog is hidden — the earlier deliberate call that
item 7 now reverses. They were updated to the NEW contract while keeping their protective intent:
`/destinations` still must not appear anywhere, and a public nav must never use the bare label
«Экскурсии» (that is the guide's own workspace tab — the public catalog is «Готовые экскурсии»
precisely so the two never read as the same thing).

Deleting them would have dropped a real invariant along with the stale one.

---

## D-07 — Analytics (D1) renders honest gaps, never proxy metrics

Where the existing schema cannot answer one of the six questions, the page shows «нет данных»
rather than a plausible-looking substitute. A wrong number in an analytics page is worse than a
missing one: it gets believed and acted on.
