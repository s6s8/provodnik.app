# Tripster (experience.tripster.ru) — Navigation Map

_Researched 2026-04-11 from account `officekg@yandex.ru`, guide ID 366144. This account has both guide and traveler roles active simultaneously — Tripster uses a single-user-dual-role model, not separated accounts._

## Unauthenticated (public catalog)
- `/` — Home (hero search, popular destinations, popular excursions, trust blocks, FAQ, newsletter, app promo, footer)
- `/tours/` — Multi-day tours catalog
- `/journal/` — Editorial content (blog/magazine)
- `/help_center/travelers/` — Traveler help
- `/help_center/guides/` — Guide help
- `/locals/` — "Become a guide" marketing page
- `/about/` — About
- `/about/cancellation_policy/` — Refund policy
- `/about/secure_payments/` — Payment security
- `/about/cookie` — Cookie policy
- `/partners/` — Partner program
- `/partners/travelagents/` — Travel agent registration
- `/partner-account/` — Partner dashboard

## Public content (city/destination/listing)
- `/{city-slug}/` — Destination landing (infer)
- `/experience/{id}/` — Excursion detail (infer)
- `/tours/{id}/` — Tour detail (infer)
- `/guide/{id}/` — Guide public profile (confirmed: `/guide/366144/`)

## Authenticated — Guide side
- `/editor/` — **Add/edit listing** (unified editor for excursions and tours)
- `/account/guide/{id}/statistics/` — Statistics dashboard
- `/account/guide/{id}/experiences/` — My listings (guide's own catalog)
- `/account/guide/{id}/promotion/` — Promotion / advertising
- `/account/guide/{id}/events/` — Orders / bookings inbox (also "Events" — the scheduled runs)
- `/account/guide/{id}/calendar/` — Calendar of scheduled runs
- `/guide/{id}/` — Public profile (same URL as anonymous view)
- `/help_center/guides/` — Guide help center
- `/guides/how-to-work/` — "How to work on Tripster" onboarding

## Authenticated — Traveler side
- `/account/traveler/inbox` — My orders (incoming booking threads)
- `/favorites/` — Favorites / wishlist
- `/account/traveler/bonuses/` — Promo codes / bonuses

## Authenticated — Shared
- `/profile/` — Profile settings (likely: name, email, phone, language, notifications, password)

## Header badges observed on landing page after login
- Guide side: "Заказы 2" (2 pending orders) and a standalone "3" badge (likely 3 total events/notifications)
- Traveler side: "Мои заказы 1" (1 active traveler booking)

## Open questions to answer while touring
- Is there a unified inbox or are guide chat / traveler chat separate threads?
- How is the "event" concept modeled — is it a scheduled slot of an excursion that travelers sign up to?
- Is pricing per-person, per-group, or both?
- Does "Добавить предложение" (Add listing) have a branch for excursion vs tour, or is it unified with a toggle?
- Where is payout / earnings / invoicing shown? (Not visible in top nav — possibly under Profile or Statistics)
- Reviews: guide sees them where?
- Verification: is there a "become a guide" form or is creating a listing the verification trigger?
