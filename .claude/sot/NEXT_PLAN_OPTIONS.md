# NEXT_PLAN_OPTIONS.md — what to ship next, ranked

> Written 2026-04-30 after closing 14-plan day. Active queue is empty (ПППД-D code audit clean, notFound() investigation closed, Task_Z post-launch). This file ranks four candidate next-steps and recommends an order.

## Comparison

| # | Option | Cost (hrs) | Value | Risk | Prereq | Best for |
|---|--------|-----------|-------|------|--------|----------|
| 1 | Test-account walkthrough across 3 roles | 2–3 | **High** — regression check after today's 6,000-line cleanup; integration bugs code-grep misses | Low (read-only mostly) | Free browser; test creds (have) | Pre-launch sanity |
| 2 | Live browser audit ПППД-D guide cabinet | 1.5–2 | Medium — UI/UX issues code-level audit missed; mobile responsive | Low | Free browser; guide login | Closing the deferred audit from today |
| 3 | Page-by-page next group (C / F / G / H) | per group: 2–4 | Medium — methodical surface review | Low | Free browser; relevant role login | Continued campaign across sessions |
| 4 | Something new from Alex | unknown | unknown | unknown | Direction from Alex | When higher priorities aren't pressing |

## Recommended order

### 1. Test-account walkthrough (HIGHEST priority)

**What:** Manual end-to-end run through three real user journeys, one per role:

- **Guest journey:** open `/`, click into `/listings`, open one listing, click "Создать запрос", fill request, hit submit (will redirect to /auth — that's expected).
- **Traveler journey:** sign in as `traveler@provodnik.app / Demo1234!`. Submit a request. Open `/traveler/requests`. Open `/messages`. Open one of own requests. Try to navigate to `/traveler/bookings` if any exist.
- **Guide journey:** sign in as `guide@provodnik.app / Demo1234!`. Open `/guide/inbox`, click into a request, try the bid form. Open `/guide/listings`, click "Новое предложение". Open `/guide/profile`. Open `/guide/portfolio`.

**Why this first:** today shipped 14 plans, 34 hours, 6,202 lines deleted. Pre-launch sanity is critical. The bulk delete (Plan 40) was risk-mitigated by Vercel build green and basic curl smoke, but only a real role walkthrough proves nothing broke. If something did, find it before the launch goes wide.

**Acceptance:** all three journeys complete without console errors, broken UI, infinite spinners, 5xx responses, or data inconsistencies. If any role hits a wall, capture: URL + role + viewport + the symptom + a screenshot. Becomes Plan 43 input.

**Output:** zero findings = relief, write a one-line "all journeys pass" SOT note. Findings = list of fixes for next session.

### 2. Live browser audit ПППД-D guide cabinet

**What:** Deferred item from earlier today. Open all 17 guide cabinet pages at 1280px and 375px under guide login. Document UI/UX issues that code-level grep can't see (spacing, alignment, broken layouts, mobile breakpoints, hover states, empty-state visuals).

**Why second:** complementary to (1). Walkthrough covers high-traffic flows; audit covers edge pages and visual polish. If (1) reveals nothing structural, (2) is the next most valuable step before launch.

**Output:** findings table → Plan 43 (or 44) spec.

### 3. Next group page-by-page

**What:** Pick a group from the campaign (C = traveler cabinet, F/G/H per the original framework). Repeat the code-audit + browser-audit + fixes cycle.

**Why third:** methodical, but (1) and (2) cover the most-used surfaces first. Group C (traveler cabinet) is the natural next group — symmetric to the guide cabinet just audited.

### 4. Something new from Alex

Reserve for when Alex has a specific pain or feature ask. Without input, not actionable.

## Decision criteria

- **If launch is imminent (days):** start with (1). Confirm nothing's broken. Then (2) only if there's time.
- **If launch is weeks out:** still (1) first, then (2), then (3) per group. Cycle.
- **If Alex flags a concrete issue:** that becomes (4) and jumps to top.

## Output format for each

Whichever path is picked, the output uses the same structure: discovered issues → Plan 43+ spec → cursor-agent or direct fixes → ship → SOT close-out → optional Slack/Telegram.

## Not in this list

- ПППД-D additional waves (drilling deeper into already-audited guide cabinet) — diminishing returns; skip
- More Slack-friendly tiny fixes — the small-fix surface is exhausted today
- Refactors without observable user-facing payoff — vision rejects work that scores 0/0 on journey impact
