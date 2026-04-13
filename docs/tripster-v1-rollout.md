# Tripster v1 — Feature Flag Rollout Sequence

## Pre-launch (internal testing)

Set in Vercel environment variables:

```
FEATURE_TR_V1=1
FEATURE_TR_TOURS=1
FEATURE_TR_KPI=1
FEATURE_TR_NOTIFICATIONS=1
FEATURE_TR_REPUTATION=1
FEATURE_TR_PERIPHERALS=0
FEATURE_TR_HELP=1
FEATURE_TR_FAVORITES=1
FEATURE_TR_PARTNER=0
FEATURE_TR_REFERRALS=0
FEATURE_TR_QUIZ=1
FEATURE_TR_DISPUTES=1
FEATURE_DEPOSITS=0
```

## Wave 1 — Editor + Search (guides first)

- `FEATURE_TR_V1=1`
- All sub-flags off except tours
- Guides can create and edit listings with new editor

## Wave 2 — Traveler surfaces

- Enable after 5+ active listings exist
- Enables: search, detail pages, booking form

## Wave 3 — Notifications + Reputation

- Enable after 3+ completed bookings
- `FEATURE_TR_NOTIFICATIONS=1`, `FEATURE_TR_REPUTATION=1`

## Wave 4 — Peripherals

- Enable after soft launch confirmed stable
- `FEATURE_TR_PERIPHERALS=1` (enables all peripheral sub-flags except partner/referrals)

## Wave 5 — Partner + Referrals (post-v1)

- `FEATURE_TR_PARTNER=1`, `FEATURE_TR_REFERRALS=1`
- After partner onboarding is ready

## Never in v1

- `FEATURE_DEPOSITS=0` — payments are v2
