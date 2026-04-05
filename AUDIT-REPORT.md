# Provodnik.app — Full Visual & Functional Audit

**Date:** 2026-04-06  
**Auditor:** Claude (automated CDP-based visual + functional audit)  
**Method:** Chrome DevTools Protocol, 1280x800 viewport, all 3 test roles  
**Screenshots:** `/tmp/audit-screenshots/`

---

## Summary Table

| # | Severity | Area | Finding |
|---|----------|------|---------|
| 1 | **CRITICAL** | Protected pages | Dev debug bar (WorkspaceRoleNav) visible in production — exposes role switcher to all users |
| 2 | **CRITICAL** | Destinations | Kazan destination hero image shows Dubai skyline — wrong photo |
| 3 | **CRITICAL** | Destinations | Stats say "2 tours" / "3 tours" but body says "Туры скоро появятся" — contradictory |
| 4 | **MAJOR** | Auth | No "forgot password" flow — users who forget passwords are locked out |
| 5 | **MAJOR** | All pages | Page titles are generic "Provodnik — Найди своего гида" on all protected routes — bad for SEO, browser tabs, accessibility |
| 6 | **MAJOR** | Traveler | `/traveler/dashboard` redirects to `/traveler/requests` — no actual dashboard page exists |
| 7 | **MAJOR** | Guide | `/guide/dashboard` is a long onboarding/settings form, not a dashboard — misleading route name |
| 8 | **MAJOR** | Destinations | "Бюджет от" shows "—" (dash) on all destination detail pages — missing data |
| 9 | **MAJOR** | Listings | Listing detail hero uses generic mountain background, not listing-specific images |
| 10 | **MINOR** | Auth | Empty form submit shows browser-native validation tooltip, not styled error — inconsistent with custom error styling used for wrong password |
| 11 | **MINOR** | Guides index | Page feels very short/sparse with only 4 guides — large whitespace gap before footer |
| 12 | **MINOR** | Guide listings | Empty state says "У вас пока нет туров" even though the guide (guide@provodnik.test) should have seed listings |
| 13 | **MINOR** | Request detail | "О маршруте" and "Что запланировано" sections have minimal placeholder text ("Культурный тур") |
| 14 | **MINOR** | All protected | `bodyLength` consistently low — pages feel sparse and empty |
| 15 | **MINOR** | Navigation | No breadcrumbs on protected pages — hard to orient in deep routes |

---

## Detailed Per-Page Breakdown

### 1. Public Pages

#### Home (`/`)
- **Visual:** Clean hero with mountain background, role selection, featured routes, 3-step explainer, dark footer. Well structured.
- **Functional:** All sections render. Navigation links work.
- **Issues:** None critical.

#### Listings Index (`/listings`)
- **Visual:** Card grid with category filter tabs (Все, Природа, История, С семьёй, Фотография). Cards show image, title, price, reviews.
- **Functional:** Filter tabs present. Cards link to detail pages.
- **Issues:** All cards show "0 отзывов" — expected with seed data but looks empty.

#### Listing Detail (`/listings/[slug]`)
- **Visual:** Hero image (generic mountains), title, route description, price sidebar with CTA.
- **Functional:** Price sidebar, "Создать запрос" and "Найти группу" CTAs present. Reviews section shows empty state.
- **Issues:**
  - **MAJOR (#9):** Hero image is a generic mountain landscape, not specific to the listing. Moscow tour should show Moscow.
  - **MINOR (#13):** "О маршруте" content is placeholder-quality ("Культурный тур").

#### Destinations Index (`/destinations`)
- **Visual:** Grid with featured Moscow card (larger), other destinations in 2-column grid. Clean overlays with city names.
- **Functional:** Cards link to detail pages. 5 destinations visible.
- **Issues:** None.

#### Destination Detail (`/destinations/[slug]`)
- **Visual:** Hero with city image, title, category tags, stats row, tours section.
- **Functional:** "Найти гида" and "Смотреть маршруты" CTAs work.
- **Issues:**
  - **CRITICAL (#2):** Kazan page shows a Dubai/UAE skyline as hero image. Moscow correctly shows St. Basil's.
  - **CRITICAL (#3):** Stats row shows "2 готовых тура" but tours section says "Туры по этому направлению скоро появятся" — data mismatch. Same on Moscow ("3 тура" but "скоро появятся").
  - **MAJOR (#8):** "Бюджет от" metric shows "—" on all destinations.

#### Guides Index (`/guides`)
- **Visual:** Guide profile cards with avatars, names, bios, ratings, review counts.
- **Functional:** 4 guides visible. Cards link to detail pages.
- **Issues:**
  - **MINOR (#11):** Only 4 cards — page feels very short. Large gap between content and footer.

#### Guide Detail (`/guides/[slug]`)
- **Visual:** Profile photo, bio, stats (tours, reviews, rating), own tour listings, open requests, traveler reviews.
- **Functional:** Well-structured sections. Reviews display nicely.
- **Issues:** None — this is one of the best-designed pages.

#### Requests Index (`/requests`)
- **Visual:** Search bar, category filters, request cards with destination, dates, budget, group size.
- **Functional:** 6 seed requests visible. "Не нашли подходящую группу?" CTA at bottom.
- **Issues:** None.

#### Request Detail (`/requests/[id]`)
- **Visual:** Hero with destination info, trip details table, price calculator with group size buttons, offers section.
- **Functional:** Group size pricing works (1/3/5/8 person options). "Войти и присоединиться" CTA for non-auth users.
- **Issues:** None critical.

#### New Request (`/requests/new`)
- **Visual:** Form with destination, dates, group size, budget, format, description. Live preview sidebar.
- **Functional:** Form renders properly. Toggle switches for options.
- **Issues:** None.

#### Policy Pages (`/policies/*`)
- **Visual:** Standard legal text layout, two-column for terms, single column for privacy.
- **Functional:** Content renders. Links to support email visible.
- **Issues:** None.

#### Trust Page (`/trust`)
- **Visual:** Two-column layout explaining trust for travelers and guides.
- **Functional:** All content visible.
- **Issues:** Page is quite short/thin.

#### 404 Page
- **Visual:** Clean card with "Эта страница не найдена" message, 3 navigation CTAs.
- **Issues:** Well designed.

---

### 2. Auth Page (`/auth`)

- **Visual:** Centered glass-morphism card, email + password fields with icons, toggle between login/signup.
- **Functional:**
  - Login with correct credentials: Works. Traveler redirects to `/traveler/requests`, guide to `/guide/dashboard`, admin to `/admin/dashboard`.
  - Wrong password: Shows styled error "Неверный email или пароль." — good.
  - Empty submit: Browser-native validation tooltip instead of custom error styling.
  - Signup toggle: Adds name field and role selector (Путешественник/Гид). Admin role correctly hidden from signup.
  - Password visibility toggle: Present and functional.
- **Issues:**
  - **MAJOR (#4):** No "forgot password" link anywhere.
  - **MINOR (#10):** Empty field validation uses browser-native tooltip instead of matching the custom error component used for wrong password.

---

### 3. Traveler Protected Pages

#### Dashboard (`/traveler/dashboard`)
- **Redirects to** `/traveler/requests` — no dedicated dashboard.
- **Issue:** **MAJOR (#6)** — dashboard route exists but just redirects.

#### Requests (`/traveler/requests`)
- **Visual:** Left sidebar with user info + nav, request cards in main area. Stats at bottom (6 active, 0 offers, 0 confirmed).
- **Functional:** Cards display seed data. "Создать запрос" CTA present.
- **Issues:** None beyond missing dedicated dashboard.

#### Requests New (`/traveler/requests/new`)
- **Visual:** Form with category, destination, dates, group size, budget, format, description.
- **Functional:** All form fields render. Two checkboxes for options. "Опубликовать запрос" CTA.
- **Issues:** None.

#### Bookings (`/traveler/bookings`)
- **Visual:** "Мои поездки" with empty state message and CTA "Перейти к маршрутам".
- **Issues:** Good empty state design.

#### Open Requests (`/traveler/open-requests`)
- **Visual:** "Открытые группы" with empty state.
- **Issues:** None.

#### Favorites (`/traveler/favorites`)
- **Visual:** "Избранное" with empty state, heart icon instruction, two CTAs.
- **Issues:** Good empty state.

#### Messages (`/messages`)
- **Visual:** "Сообщения" with empty state.
- **Issues:** None.

#### Notifications (`/notifications`)
- **Visual:** "Уведомления" with filter tabs (Все, Непрочитанные) and empty state.
- **Issues:** None.

---

### 4. Guide Protected Pages

#### Dashboard (`/guide/dashboard`)
- **Visual:** Very long onboarding/settings form — NOT a dashboard. Contains fields for personal info, experience, verification, and many other settings.
- **Issue:** **MAJOR (#7)** — This is a settings/onboarding form, not a dashboard. Route name is misleading.

#### Listings (`/guide/listings`)
- **Visual:** "Мои туры" with empty state + "Создать первый тур" CTA.
- **Issues:**
  - **CRITICAL (#1):** Debug bar at top with role switcher (Путешественник/Гид/Оператор) and "Локальный демо-режим" label — MUST NOT be in production.
  - **MINOR (#12):** Shows "no tours" despite guide@provodnik.test being a seed guide with listings on the public site.

#### Listings New (`/guide/listings/new`)
- **Visual:** "Новый тур" form with destination, duration, description, inclusions/exclusions, photo upload.
- **Functional:** Form renders properly. Photo upload area present.
- **Issues:** None beyond debug bar.

#### Requests (`/guide/requests`)
- **Visual:** "Входящие запросы" with tabs (Бронирования, Мои программы), stats row, empty state.
- **Issues:** None.

#### Bookings (`/guide/bookings`)
- **Visual:** "Бронирования" with stats and empty state.
- **Issues:** None.

#### Verification (`/guide/verification`)
- **Visual:** 3 document upload areas (Паспорт, Селфи с документом, Сертификаты). File format requirements shown.
- **Functional:** Upload areas present. "Подтвердить на проверку" CTA.
- **Issues:** Clean page, well designed.

---

### 5. Admin Protected Pages

#### Dashboard (`/admin/dashboard`)
- **Visual:** "Обзор модерации" with 4 stat cards (1 guide pending, 0 moderation, 0 listings, 0 disputes). 3 action areas below.
- **Functional:** Stats render. Navigation works.
- **Issues:** Debug bar visible.

#### Guides (`/admin/guides`)
- **Visual:** "Проверка гидов" with data table — 5 guides listed with name, email, region, phone, status, date, actions.
- **Functional:** Table renders. "Просмотр" action buttons present.
- **Issues:** Status column shows "Guide" (English) in otherwise all-Russian UI.

#### Listings (`/admin/listings`)
- **Visual:** "Листинг на проверке" with filter columns header and empty state.
- **Issues:** None.

#### Disputes (`/admin/disputes`)
- **Visual:** "Споры и возвраты" with queue stats (all 0s) and empty state.
- **Issues:** None.

---

## Priority Action Items

### Must Fix Before Launch (Critical)
1. **Remove WorkspaceRoleNav debug bar** from production — `src/components/shared/workspace-role-nav.tsx` renders role switcher, demo session controls visible to all authenticated users
2. **Fix Kazan destination image** — currently showing Dubai skyline
3. **Fix destination tour count mismatch** — stats show tour count > 0 but tours section says "скоро появятся"

### Should Fix Before Launch (Major)
4. **Add forgot password flow** — standard auth feature, users will be locked out without it
5. **Add page-specific `<title>` tags** to all protected routes — currently all show generic title
6. **Create actual traveler dashboard** or remove `/traveler/dashboard` route
7. **Rename or redesign guide dashboard** — currently an onboarding form, not a dashboard
8. **Populate destination budget data** — "—" shows for budget on all destinations
9. **Use listing-specific hero images** on detail pages instead of generic mountains

### Polish (Minor)
10. Style empty-field validation to match custom error component
11. Add more guide seed data or adjust page layout for sparse content
12. Fix guide listings page showing empty state for seed guide account
13. Improve request detail "about" section content
14. Consider adding breadcrumbs to protected routes
