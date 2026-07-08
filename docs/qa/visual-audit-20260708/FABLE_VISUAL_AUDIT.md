# Provodnik VPS — Fable Visual Audit Report

Target: https://vps.provodnik.app  
Audit date: 2026-07-08  
Mode: read-only live VPS visual/product audit

## Executive summary

Fable captured and analyzed the current VPS UI across anonymous, traveler, guide, and admin surfaces.

Evidence collected:

- 108 route records in `raw/routes.json`
- 111 screenshots total
- 57 desktop screenshots
- 54 mobile screenshots
- 20 visual/product findings

Severity split:

- High: 3
- Medium: 6
- Low: 11

Main pattern: the site is not just missing small polish. There are several page-family layout failures: desktop request detail pages have a broken hero area, some routes render soft-404 content while returning HTTP 200, mobile protected pages have overlapping/fixed navigation artifacts, and several cards/forms/tabs are visually misaligned or clipped.

## Coverage notes

| Area | Coverage | Notes |
|---|---:|---|
| Anonymous/public | Broad desktop + mobile coverage | Home, guides, guide profiles, requests, request details, policies, auth, help, trust, AI, business pages |
| Traveler | Desktop + mobile coverage | Trips, requests, bookings, notifications, account pages |
| Guide | Desktop + mobile coverage | Profile, listings, bookings, calendar, reviews, stats, contact visibility |
| Admin | Partial | Login succeeded later, but visual screenshot coverage is incomplete compared with traveler/guide |

Login caveat: the first login attempt for all three roles failed or submitted empty fields. Retry succeeded for traveler and guide coverage. Admin coverage is partial.

## High severity

### F-01 — Request detail desktop hero is broken

Affected:

- Anonymous request detail pages
- Traveler request detail pages

Problem:

Desktop request detail pages show a huge empty dark-blue gradient area between the header and content. The expected request title/city/date/summary block is missing or visually collapsed. Mobile renders much better, so this is a desktop-specific layout failure.

Evidence screenshots:

- `screenshots/desktop/anon_requests_60ba7188-7bb8-4c9b-b7fc-bff53b8517e0.png`
- `screenshots/desktop/anon_requests_e008d8b7-ab51-4c6f-ab8f-0f0adf226768.png`
- `screenshots/desktop/traveler_requests_60ba7188-7bb8-4c9b-b7fc-bff53b8517e0.png`
- `screenshots/desktop/traveler_requests_e008d8b7-ab51-4c6f-ab8f-0f0adf226768.png`

Recommended direction:

Rebuild the desktop request-detail hero/card composition. The above-the-fold block should contain request title, city, date/flexibility, people/budget chips, status, and primary action. Desktop should not rely on a mobile-only content path.

### F-02 — `/account/notifications` renders a cabinet 404

Affected:

- Traveler `/account/notifications`
- Desktop and mobile

Problem:

Instead of notification settings, the page shows a cabinet 404: “Страница кабинета не найдена”. Route metadata also captured a React page error.

Evidence screenshots:

- `screenshots/desktop/traveler_account_notifications.png`
- `screenshots/mobile/traveler_account_notifications.png`

Recommended direction:

Either implement this account page or redirect it to the real notifications/settings location. Remove broken navigation links to this route if the page is intentionally not supported.

### F-03 — `/destinations` and `/listings` are public soft-404s

Affected:

- `/destinations`
- `/listings`
- Desktop and mobile

Problem:

Both routes return HTTP 200 and proper page titles, but visually render the 404 page. This is bad for users and SEO because the system pretends the pages exist while the UI says not found.

Evidence screenshots:

- `screenshots/desktop/anon_destinations.png`
- `screenshots/mobile/anon_destinations.png`
- `screenshots/desktop/anon_listings.png`
- `screenshots/mobile/anon_listings.png`

Recommended direction:

Choose one: build real index pages, redirect to existing canonical pages, or return true 404/410. Do not leave HTTP 200 + 404 UI.

## Medium severity

### F-04 — Guide mobile bottom navigation overlaps page content

Affected:

- `/guide/profile`
- `/guide/bookings`
- `/guide/calendar`
- `/guide/settings/contact-visibility`

Problem:

The mobile bottom tab bar appears in the middle of long screenshots and covers content/CTAs. On calendar it cuts through the week grid; on contact visibility it partly hides the CTA.

Evidence screenshots:

- `screenshots/mobile/guide_guide_profile.png`
- `screenshots/mobile/guide_guide_bookings.png`
- `screenshots/mobile/guide_guide_calendar.png`
- `screenshots/mobile/guide_guide_settings_contact-visibility.png`

Recommended direction:

Audit fixed/sticky mobile nav behavior and add reliable bottom padding/safe-area spacing for all guide pages. Confirm in real mobile viewport, not only full-page screenshot mode.

### F-05 — Guide profile mobile form labels are cramped

Affected:

- `/guide/profile` mobile

Problem:

The label “Лет опыта в роли гида” is too close to the input. “Базовый город” also visually merges with helper text.

Evidence:

- `screenshots/mobile/guide_guide_profile.png`

Recommended direction:

Normalize vertical rhythm for label → helper → input groups. Use consistent field spacing tokens.

### F-06 — Traveler trips mobile tabs overlap

Affected:

- `/trips` mobile

Problem:

The active tab “Активные (1)” overlaps the neighboring “Подтверждённые” tab; the first letter is clipped/covered.

Evidence:

- `screenshots/mobile/traveler_trips.png`

Recommended direction:

Make the tabs horizontally scrollable with clear spacing, or switch to a stacked/segmented layout at mobile width.

### F-07 — Traveler notifications mobile card is clipped

Affected:

- `/notifications` mobile

Problem:

Notification card content is pressed against the right edge. The timestamp is too close to the screen border and title text is clipped.

Evidence:

- `screenshots/mobile/traveler_notifications.png`

Recommended direction:

Add container padding and review card grid/flex shrink behavior at 390px.

### F-08 — Public request cards have empty dark image blocks

Affected:

- `/requests` anonymous desktop/mobile

Problem:

All three request cards show empty dark gradient/blur placeholder imagery, making the grid look broken or still loading.

Evidence:

- `screenshots/desktop/anon_requests.png`
- `screenshots/mobile/anon_requests.png`

Recommended direction:

Use meaningful destination imagery or a designed fallback card visual with icon, destination, and request type—not an empty dark image block.

### F-09 — Mobile request breadcrumb overlaps sticky header

Affected:

- Request detail `60ba7188...` mobile

Problem:

Breadcrumb “Запросы › Казань” sits under or too close to the floating header, unlike the neighboring request page.

Evidence:

- `screenshots/mobile/anon_requests_60ba7188-7bb8-4c9b-b7fc-bff53b8517e0.png`

Recommended direction:

Normalize top offset/padding for all request-detail mobile variants.

## Low severity / polish issues

### F-10 — QA guide is publicly visible

Problem:

“QA Guide Test” appears publicly in guide listings and has English QA text on the public profile.

Evidence:

- `screenshots/desktop/anon_guides.png`
- `screenshots/desktop/anon_guides_qa-guide-test-904cdd5c.png`

Recommended direction:

Hide seed/test accounts from production catalogs or clearly separate QA data from public production.

### F-11 — Desktop guide category chip is clipped

Problem:

The final category chip cuts off at “Активный отды”.

Evidence:

- `screenshots/desktop/anon_guides.png`

Recommended direction:

Add fade/scroll affordance or wrap chips properly.

### F-12 — `/ai` mobile input placeholder is covered

Problem:

The input placeholder is clipped by the round send button.

Evidence:

- `screenshots/mobile/anon_ai.png`

Recommended direction:

Increase right padding inside the input or separate the send button from the text field.

### F-13 — Orphan “Поддержка” link below footer on mobile

Problem:

A standalone “Поддержка” text link appears under the footer on pages with footers.

Evidence:

- `screenshots/mobile/anon_ai.png`

Recommended direction:

Move it into the footer link group or remove duplicated/orphan placement.

### F-14 — Public guide profile mobile has huge empty gap

Problem:

A screen-height empty gap appears between “У этого гида пока нет экскурсий” and reviews.

Evidence:

- `screenshots/mobile/anon_guides_жюль-верников-69f18040.png`

Recommended direction:

Collapse empty sections when guides have no trips/reviews.

### F-15 — `/guide/listings` has orphan chevron button

Problem:

A standalone “<” button appears next to “Создать экскурсию” on desktop and mobile.

Evidence:

- `screenshots/desktop/guide_guide_listings.png`
- `screenshots/mobile/guide_guide_listings.png`

Recommended direction:

Remove accidental carousel/back-control or place it with clear purpose.

### F-16 — Guide profile document button has poor contrast

Problem:

“Добавить документ” uses white text on a pale blue background and is hard to read.

Evidence:

- `screenshots/desktop/guide_guide_profile.png`

Recommended direction:

Use standard primary/secondary button tokens with WCAG-safe contrast.

### F-17 — Account profile shows completed status with empty fields

Problem:

`/account` desktop shows green “Профиль заполнен” even while profile fields are empty.

Evidence:

- `screenshots/desktop/traveler_account.png`

Recommended direction:

Tie completion status to actual required field completion.

### F-18 — Traveler booking page has duplicated placeholder title and dead gap

Problem:

Booking detail desktop has a large empty gap and repeats placeholder “Маршрут” instead of a real route/trip title.

Evidence:

- `screenshots/desktop/traveler_bookings_30212d35-21b4-4c19-bcf2-c08825f5b261.png`

Recommended direction:

Render real booking/trip metadata and collapse empty sections.

### F-19 — Traveler request mobile price panel lacks side padding

Problem:

The sticky price panel starts almost at x=0; “~5 000 ₽” is too close to the screen edge.

Evidence:

- `screenshots/mobile/traveler_requests_e008d8b7-ab51-4c6f-ab8f-0f0adf226768.png`

Recommended direction:

Apply the same page gutter/container padding as the rest of the mobile layout.

### F-20 — Home hero secondary text has weak contrast

Problem:

“Сборные группы” near the bottom of the desktop hero is hard to read over the dark photo.

Evidence:

- `screenshots/desktop/anon_home.png`

Recommended direction:

Increase overlay strength, text contrast, or move the label into a solid/chip container.

## Cross-site design drift patterns

1. **Desktop/mobile layout divergence** — request detail pages are broken on desktop while mobile looks closer to intended.
2. **Protected mobile shell needs a safe-area pass** — guide pages show bottom navigation overlap patterns.
3. **Route map and navigation are ahead of real pages** — several linked or indexed routes render 404-like content.
4. **Fallback states look unfinished** — empty images, no-avatar profiles, empty sections, and placeholder titles appear in production.
5. **Component spacing tokens are inconsistent** — forms, tabs, chips, cards, and sticky panels each use slightly different gutters and vertical rhythm.

## Quick wins

1. Fix `/destinations` and `/listings` routing: implement, redirect, or return true 404.
2. Remove/hide QA public guide data from production catalog.
3. Patch mobile tab overflow on `/trips`.
4. Add mobile bottom padding under guide fixed nav.
5. Fix orphan footer “Поддержка”.
6. Add designed fallbacks for request card imagery.
7. Improve contrast of low-contrast buttons/text.

## Bigger refactor candidates

1. Rebuild request detail page layout as one shared responsive component.
2. Unify protected-role shell spacing for traveler/guide/admin.
3. Create one card/media fallback system for requests, guides, bookings, and empty states.
4. Add visual regression screenshots for key anonymous/traveler/guide/admin routes at desktop and mobile widths.

## Not fully tested / blockers

- Admin was only partially covered visually. Route records exist, but screenshot coverage is incomplete compared with traveler/guide.
- First login attempts failed for all three protected roles; retry succeeded for traveler/guide. Admin screenshots are limited.
- This was a visual/product audit, not a full business-logic test pass.

## Artifact locations

- Full route metadata: `raw/routes.json`
- Machine-readable findings: `raw/findings.json`
- Screenshots: `screenshots/desktop/` and `screenshots/mobile/`
