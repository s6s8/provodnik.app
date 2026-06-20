# Provodnik — Canonical Navigation IA spec (Opus PM, 2026-06-20)

Implementation spec for the whole-app nav refactor. ONE design, decided. Russian user-language labels, Lucide icons, ≥44px targets, mobile-first. Pure label + grouping + source-of-truth refactor — **no new routes, no redirect changes, no dead links** (the 2026-06-14 IA refactor / PR #124 added 34 redirects + role-aware routes; do not reintroduce dead links).

## Files in scope (verified against current code)
- `src/components/shared/site-header.tsx` — desktop header nav + mobile sheet (4 hardcoded arrays `navLinks`/`travelerNavLinks`/`guideNavLinks`/`publicNavLinks`), account dropdown, messages icon, anon CTAs.
- `src/components/shared/guide-bottom-nav.tsx` — guide mobile bottom-nav (4 hardcoded `items`).
- `src/components/shared/user-account-drawer.tsx` — mobile personal drawer (traveler/guide).
- `src/components/shared/site-footer.tsx` — footer `projectLinks`/`supportLinks`/`policyLinks` + FAQ.
- `src/app/(protected)/admin/admin-sidebar-nav.tsx` — admin ALREADY has a 7-item sidebar (`AdminSidebarNav`) + mobile tab bar (`AdminMobileTabs`); used by `admin/layout.tsx`. Uses a divergent label set ("Листинги","Брони","Обзор") to reconcile.
- `src/lib/copy.ts` — `COPY.nav.*` half-built dictionary; migrate callers to `ROUTES.*.label` or keep only if still read.
- NEW: `src/lib/navigation.ts` — the single source of truth.

**Correction to the original problem list:** admin is NOT navless — it has a full `/admin/*` sidebar + mobile tabs. The real bugs are (a) the global header's authenticated-fallback array points an admin at `/requests`/`/destinations`/`/guides` with NO way back into `/admin/*`, and (b) the admin sidebar uses a third divergent label set. Both fixed below.

## 1. Canonical label table — ONE label per destination
| Route | Canonical label | Lucide icon | Notes |
|---|---|---|---|
| `/requests` | Открытые группы | Users | kills "Запросы"(admin) vs "Открытые группы"; "Запросы" retired as a `/requests` label |
| `/listings` | Готовые экскурсии | Compass | |
| `/guides` | Гиды | UserSearch | guide DIRECTORY (not recruiting) |
| `/destinations` | Направления | Map | |
| `/search` | Поиск | Search | icon-only on mobile |
| `/how-it-works` | Как это работает | Route | |
| `/become-a-guide` | Стать гидом | BadgeCheck | the ONLY "Стать гидом" target (recruiting) |
| `/trust` | Доверие и безопасность | ShieldCheck | resolves dual-label ("О нас"+"Доверие…"); drop "О нас" |
| `/for-business` | Для бизнеса | Briefcase | |
| `/help` | Помощь | HelpCircle | |
| `/auth` | Войти | LogIn | |
| `/trips` | Мои запросы | ClipboardList | traveler |
| `/bookings` | Поездки | Luggage | traveler confirmed trips |
| `/favorites` | Избранное | Heart | |
| `/messages` | Сообщения | MessageSquare | header icon |
| `/notifications` | Уведомления | Bell | header bell |
| `/referrals` | Приглашения | Gift | |
| `/account` | Профиль | User | unify "Мой профиль"→"Профиль" |
| `/guide` | Запросы | Inbox | guide inbox — "Запросы" now belongs to `/guide` ONLY |
| `/guide/listings` | Мои экскурсии (short: Экскурсии) | Compass | one label; short for tab width |
| `/guide/bookings` | Заказы | BookCheck | replaces "Подтверждённые" |
| `/guide/reviews` | Отзывы | Star | |
| `/guide/calendar` | Календарь | Calendar | |
| `/guide/profile` | Профиль | User | |
| `/guide/settings/contact-visibility` | Настройки | Settings | |
| `/admin/dashboard` | Обзор | BarChart3 | |
| `/admin/moderation` | Модерация | ShieldCheck | |
| `/admin/guides` | Гиды | UserCheck | admin context |
| `/admin/listings` | Листинги | ClipboardList | admin moderation records (distinct from storefront) |
| `/admin/bookings` | Бронирования (short: Брони) | CalendarCheck | one label; short for tab |
| `/admin/disputes` | Споры | Flag | |
| `/admin/audit` | Аудит | ScrollText | |

## 2. Per-surface IA
### Desktop header primary (≤6)
- **Anon:** Открытые группы /requests · Готовые экскурсии /listings · Гиды /guides · Направления /destinations · Как это работает /how-it-works. Right: [Стать гидом] outline · [Войти] solid.
- **Traveler:** Открытые группы /requests · Готовые экскурсии /listings · Направления /destinations · Мои запросы /trips. Right: Bell /notifications · Msg /messages · [Создать запрос] solid → / · avatar dropdown.
- **Guide:** Запросы /guide · Мои экскурсии /guide/listings · Заказы /guide/bookings · Отзывы /guide/reviews. Right: Bell · Msg · avatar dropdown.
- **Admin (on non-admin pages):** Открытые группы /requests · Гиды /guides · Направления /destinations · **Админка → /admin/dashboard** (NEW bridge). Right: Bell · Msg · dropdown.

### Mobile
- **Header sheet** mirrors that role's desktop primary (anon also gets Стать гидом + Войти). Traveler personal cabinet stays in the avatar drawer, not the sheet.
- **Guide bottom-nav (4 tabs):** Запросы /guide (Inbox) · Экскурсии /guide/listings (Compass, shortLabel) · Заказы /guide/bookings (BookCheck) · Отзывы /guide/reviews (Star). Calendar → avatar drawer.
- **Traveler:** NO bottom-nav (header + drawer only — avoids competing with content CTAs).
- **Admin:** KEEP existing `AdminMobileTabs` (7-col) bottom bar.

### Account dropdown / drawer (same per-role array on desktop dropdown + mobile drawer)
- **Traveler:** Профиль /account · Поездки /bookings · Избранное /favorites · Уведомления /notifications · Приглашения /referrals · Помощь /help · — · Выйти. (This finally homes traveler's orphaned favorites/notifications/referrals/bookings.)
- **Guide:** Профиль /guide/profile · Календарь /guide/calendar · Настройки /guide/settings/contact-visibility · Помощь /help · — · Выйти.
- **Admin:** Админка /admin/dashboard · Профиль /account · Помощь /help · — · Выйти.
Keep the drawer's existing "Переключиться на гида/путешественника" role-switch row above the divider.

### Footer (3 groups + social, unchanged legal/social blocks)
- **О проекте:** Как это работает /how-it-works · Доверие и безопасность /trust · Стать гидом /become-a-guide · Для бизнеса /for-business. (/trust ONE row; recruiting → /become-a-guide; /guides removed from footer.)
- **Поддержка:** Помощь /help (NEW) · Telegram-поддержка (ext) · Email support@provodnik.app.
- **Правила:** Условия /policies/terms · Конфиденциальность /policies/privacy · Cookies /policies/cookies.

## 3. Single source of truth — `src/lib/navigation.ts`
Export a canonical `ROUTES` registry (one `NavItem` literal per destination: `{href,label,shortLabel?,icon,activePrefixes?,external?}`) + role arrays `headerPrimary{anon,traveler,guide,admin}`, `accountMenu{traveler,guide,admin}`, `guideBottomNav`, `adminNav` (7 sections), `footerNav{about,support,legal}` + a shared `isNavActive(pathname,item)` helper (replaces the duplicated active-state logic in 4 components). Header/sheet, guide-bottom-nav, dropdown/drawer, admin-sidebar, footer all import from it. Delete the 4 hardcoded arrays in site-header and the local arrays in the other components. `shortLabel` covers bottom-nav/admin-tab width truncation WITHOUT creating a second label.

```ts
export type NavItem = { href: string; label: string; shortLabel?: string; icon: LucideIcon; activePrefixes?: readonly string[]; external?: boolean };
// ROUTES = { requests:{href:"/requests",label:"Открытые группы",icon:Users}, ... } satisfies Record<string,NavItem>
// headerPrimary = { anon:[...], traveler:[...], guide:[guideInbox,guideListings,guideBookings,guideReviews], admin:[requests,guides,destinations,{...adminDashboard,label:"Админка"}] }
// accountMenu = { traveler:[account,myBookings,favorites,notifications,referrals,help], guide:[guideProfile,guideCalendar,guideSettings,help], admin:[{...adminDashboard,label:"Админка"},account,help] }
// guideBottomNav = [guideInbox,guideListings,guideBookings,guideReviews]
// adminNav = [adminDashboard,adminGuides,adminListings,adminModeration,adminDisputes,adminBookings,adminAudit]
// footerNav = { about:[howItWorks,trust,becomeGuide,forBusiness], support:[help, telegram(ext), email(ext)], legal:[terms,privacy,cookies] }
export function isNavActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  return item.activePrefixes?.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ?? false;
}
```

## 4. Admin nav
- Inside `/admin/*`: keep `AdminSidebarNav` (desktop rail) + `AdminMobileTabs` (mobile 7-col), now sourced from `adminNav` so labels match §1 (fixes "Брони"/"Бронирования" via shortLabel).
- Outside `/admin/*`: global header gains ONE «Админка» → /admin/dashboard primary entry + dropdown link. Do NOT surface all 7 admin sections in the global header.

## 5. Don't break
- Every href is an existing canonical route — no new/renamed routes, no redirect-map changes.
- Don't point "Стать гидом" at /guides or "Гиды" at /become-a-guide.
- `/guide` active-state: keep `activePrefixes:["/guide/inbox"]`; DROP the stale `/guide/bookings` prefix-match (bookings is its own tab now — would light two tabs).
- Keep the messages icon + notification bell header affordances (unread wiring via useUnreadCount / NotificationBell); the config adds them to accountMenu as a secondary path, doesn't remove icons.
- Nav config is presentation only — access control stays server-side (guide/layout.tsx, admin/layout.tsx via roleHasAccess + RLS).
- Tests to update: `guide-bottom-nav.test.tsx`, `role-layouts.test.tsx` (label/array changes).

## Coder change summary
1. ADD `src/lib/navigation.ts` (registry + role arrays + isNavActive).
2. REWRITE `site-header.tsx`: delete 4 arrays → `headerPrimary[role]` (desktop+sheet); add admin "Админка"; dropdown → `accountMenu[role]`.
3. REWRITE `user-account-drawer.tsx` → `accountMenu[role]` (adds traveler Поездки/Избранное/Уведомления/Приглашения).
4. REWRITE `guide-bottom-nav.tsx` → `guideBottomNav` ("Заказы" not "Подтверждённые"; shortLabel).
5. REWRITE `admin-sidebar-nav.tsx` → `adminNav` (fix Брони/Бронирования via shortLabel).
6. REWRITE `site-footer.tsx` → `footerNav` (single /trust row, /become-a-guide recruiting, add /help, drop /guides).
7. Verify typecheck/lint/test/build; smoke nav @1280 AND 375.
