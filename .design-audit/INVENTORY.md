# Design Refactor — Static Inventory (SOT)

Read-only static analysis of `src/` at branch `audit/design-refactor-plan-20260713`. Neutral inventory — no recommendations.

## 1. Route inventory

Layout chains (abbreviations used in table):

| Key | Chain |
|---|---|
| R | `src/app/layout.tsx` (root: Onest + Geist Mono fonts, AppProviders, `lang="ru"`) |
| R>auth | root → `(auth)/layout.tsx` (passthrough fragment) |
| R>home | root → `(home)/layout.tsx` (passthrough fragment) |
| R>site | root → `(site)/layout.tsx` (skip-link + SiteHeaderServer + main + SiteFooter) |
| R>site>pol | R>site → `(site)/policies/layout.tsx` (760px column) |
| R>prot | root → `(protected)/layout.tsx` (SiteHeaderServer, max-w-page main, suspended→redirect) |
| R>prot>admin | R>prot → `admin/layout.tsx` (admin gate, sidebar + mobile tabs) |
| R>prot>guide | R>prot → `guide/layout.tsx` (guide role gate, GuideBottomNav) |
| R>prot>trips | R>prot → `trips/layout.tsx` (traveler role gate) |

Route-level states by group: `(auth)/error.tsx`; `(home)/error.tsx`; `(site)/loading.tsx, error.tsx, not-found.tsx`; `(protected)/loading.tsx, error.tsx, not-found.tsx`; `admin/error.tsx, not-found.tsx`; `trips/loading.tsx, error.tsx`. Per-route states noted inline.

| route | group | purpose | layout chain | key components | auth role | states |
|---|---|---|---|---|---|---|
| /auth | (auth) | Login/signup entry | R>auth | AuthEntryScreen, Button, Input | public | group error |
| /auth/forgot-password | (auth) | Request password reset | R>auth | ForgotPasswordScreen | public | group error |
| /auth/update-password | (auth) | Set new password | R>auth | UpdatePasswordScreen | public | group error |
| / | (home) | Homepage: hero + request form | R>home | SiteHeaderServer, HomePageShell2Classic, OpenGroupCard, SectionHeading, SiteFooter | public | group error |
| /ai | (home) | AI-conversation request intake | R>home | SiteHeaderServer, HeroConversation, HomepageAuthGate, SiteFooter | public | group error |
| /form | (home) | permanentRedirect → `/` | R>home | — | public | — |
| /become-a-guide | (site) | Guide onboarding marketing | R>site | InfoHero, InfoPageShell, InfoSection, StepCard, Button | public | group set |
| /destinations | (site) | Destinations catalog | R>site | DestinationsDiscoveryScreen, DiscoveryShell, DiscoverySearchInput, Alert | public (flag→/guides) | group set |
| /destinations/[slug] | (site) | Destination detail + guides/requests | R>site | DestinationDetailScreen, ReqCard, PublicGuideCard (features), Button | public | +loading |
| /for-business | (site) | B2B marketing page | R>site | ArticleShell, PageHeader, Card, Button | public | group set |
| /guide/[id] | (site) | Legacy permanentRedirect → /guides/[slug] | R>site | — | public | — |
| /guides | (site) | Public guides catalog | R>site | PublicGuidesGrid, PublicGuideCard (shared), DiscoverySearchInput, DiscoveryShell | public | group set |
| /guides/[slug] | (site) | Public guide profile (Г2) | R>site | GuideProfileScreen, TourCard, Tag, NewGuideFrame, Button | public | +loading |
| /help | (site) | FAQ + help articles | R>site | HelpSearch, HelpArticle, InfoHero, InfoPageShell, radix Accordion | public | group set |
| /how-it-works | (site) | How-it-works marketing | R>site | InfoHero, InfoPageShell, InfoSection, StepCard, Button | public | group set |
| /listings | (site) | Public excursion catalog | R>site | PublicListingDiscoveryScreen, ListingCard, DiscoverySearchInput, Alert | public (flag→/guides) | group set |
| /listings/[id] | (site) | Excursion/tour detail | R>site | ExcursionShapeDetail, TourShapeDetail, AvailabilitySection, GuideCard, TariffsList, ImmersiveHero | public | +loading |
| /policies/cookies | (site) | Cookies policy | R>site>pol | PageHeader, Card | public | group set |
| /policies/offer | (site) | Public offer doc | R>site>pol | PageHeader, Alert, Card | public | group set |
| /policies/privacy | (site) | Privacy policy | R>site>pol | PageHeader, Card | public | group set |
| /policies/terms | (site) | Terms of service | R>site>pol | PageHeader, Card | public | group set |
| /requests | (site) | Open requests marketplace (Г1) | R>site | PublicRequestsMarketplaceScreen, OpenGroupCard, DiscoveryFilterSheet, DiscoverySearchInput, Calendar | public | group set |
| /requests/[requestId] | (site) | Request detail + bidding | R>site | RequestDetailScreen, BidFormPanel, GuideOfferQaPanel, TripPanel, StickyActionBar, Chip/Tag | public, role-aware | +loading |
| /trust | (site) | Trust & safety page | R>site | InfoHero, InfoPageShell, Card, Button | public | group set |
| /account | (protected) | Traveler profile settings | R>prot | PageHeader, PersonalSettingsForm, TravelerProfileCompletionChecklist, AvatarUploadBlock, Badge | auth (any) | group set |
| /account/notifications | (protected) | Notification preferences | R>prot | NotificationPreferencesClient | auth, flag-gated | group set |
| /admin | (protected) | redirect → /admin/dashboard | R>prot>admin | — | admin | — |
| /admin/audit | (protected) | Admin audit log | R>prot>admin | PageHeader, EmptyState, Input, Select, Badge | admin | group set |
| /admin/bookings | (protected) | Payments/bookings queue | R>prot>admin | PageHeader, ListRow, Select, PendingSubmitButton, EmptyState | admin | group set |
| /admin/bookings/[id] | (protected) | Booking detail + confirm payment | R>prot>admin | PageHeader, Card, Badge, PendingSubmitButton | admin | group set |
| /admin/dashboard | (protected) | Admin stats overview | R>prot>admin | PageHeader, Card, Badge, lucide stat icons | admin | +loading |
| /admin/disputes | (protected) | Disputes queue | R>prot>admin | DisputesQueue, PageHeader, ListRow, Card, Badge | admin | group set |
| /admin/disputes/[caseId] | (protected) | Dispute case resolution | R>prot>admin | DisputeCaseDetail, Card, Textarea, Separator, PageHeader | admin | +loading |
| /admin/guides | (protected) | Guide moderation queue | R>prot>admin | ListRow, Avatar, DropdownMenu, PendingMenuSubmitButton, Badge | admin | group set |
| /admin/guides/[id] | (protected) | Guide review detail | R>prot>admin | ProfileAvatar, PageHeader, GuideApprovalForm, GuideAvailabilityControl, Card | admin | group set |
| /admin/listings | (protected) | redirect → /admin/moderation | R>prot>admin | — | admin | — |
| /admin/moderation | (protected) | Listing/reply moderation | R>prot>admin | ModerationQueueList, ReplyModerationList, Tabs, EmptyState, PageHeader | admin | group set |
| /admin/pipeline | (protected) | Request pipeline tabs | R>prot>admin | Tabs, ListRow, EmptyState, PageHeader, Badge | admin | group set |
| /admin/users | (protected) | Users console | R>prot>admin | UsersConsole (Table, Select, DropdownMenu) | admin | group set |
| /admin/users/[id] | (protected) | User account detail/actions | R>prot>admin | RoleBadge/AccountStatusBadge/GuideStatusBadge, account-actions (AlertDialog) | admin | group set |
| /bookings/[bookingId] | (protected) | Booking detail (traveler view) | R>prot | BookingDetailScreen, BookingStatusBadge, ContactReveal, MoneyBreakdown, ConfirmDialog | auth (member) | group set |
| /bookings/[bookingId]/dispute | (protected) | Open dispute form | R>prot | PageHeader, DisputeForm, Button | auth, flag-gated | group set |
| /bookings/[bookingId]/review | (protected) | Leave review after trip | R>prot | TravelerBookingReviewScreen, ProfileAvatar, Card, Textarea | traveler | +loading |
| /disputes/[id] | (protected) | Dispute thread | R>prot | DisputeThread, Card, Textarea, EmptyState, PageHeader | auth (member/admin), flag-gated | group set |
| /favorites | (protected) | Favorites folders manager | R>prot | FavoritesManager, EmptyState, Card, Input, CabinetSectionUnavailable | auth, flag-gated | group set |
| /guide | (protected) | redirect → /guide/inbox | R>prot>guide | — | guide | — |
| /guide/bookings | (protected) | Guide bookings list | R>prot>guide | GuideBookingsScreen, ListRow, ListRowSkeleton, EmptyState, PageHeader | guide | group set |
| /guide/bookings/[bookingId] | (protected) | Booking detail (guide view) | R>prot>guide | BookingDetailScreen (same as traveler) | guide | +loading |
| /guide/calendar | (protected) | Guide calendar + stats | R>prot>guide | MonthlyCalendar, WeeklyCalendar, StatsChart, DateRangePicker, Tabs | guide | group set |
| /guide/inbox | (protected) | Guide requests inbox | R>prot>guide | GuideRequestsInboxScreen, Card, Badge, EmptyState, PageHeader | guide | group set |
| /guide/listings | (protected) | Guide excursion templates mgmt | R>prot>guide | GuideExcursionsScreen, ListRow, Sheet, GuidePortfolioScreen, ConfirmDialog | guide | group set |
| /guide/profile | (protected) | Guide profile + verification | R>prot>guide | GuideAboutForm, GuideProfileChecklist, VerificationUploadForm, LicenseManager, AvatarUploadBlock | guide | group set |
| /guide/reviews | (protected) | Guide reviews list | R>prot>guide | ReviewsList, EmptyState, Alert, PageHeader | guide | group set |
| /guide/settings/contact-visibility | (protected) | Contact visibility setting | R>prot>guide | ContactVisibilityChip, Alert, PageHeader, Button | guide | group set |
| /guide/stats | (protected) | Guide stats summary | R>prot>guide | Card, Badge | guide | group set |
| /listings/[id]/book | (protected) | Booking form for listing | R>prot | BookingFormTabs, MoneyBreakdown, PageHeader, Card | auth, flag-gated | group set |
| /messages | (protected) | Conversations list | R>prot | ConversationList, PageHeader | auth | +loading |
| /messages/[threadId] | (protected) | Chat thread | R>prot | ChatWindow, ChatInput, ProfileAvatar, PageHeader, Button | auth (member) | +loading |
| /notifications | (protected) | Notification center | R>prot | NotificationCenterScreen, ListRow, EmptyState, Badge, PageHeader | auth | group set |
| /referrals | (protected) | Referrals + partner payouts | R>prot | ReferralCode, BonusLedger, ApiTokenManager, PayoutsLedger, CabinetSectionUnavailable | auth, flag-gated | group set |
| /trips | (protected) | Traveler requests cabinet | R>prot>trips | TravelerRequestsScreen, Tabs, EmptyState, PageHeader, pin-elista inspirations | traveler | +loading, +error |
| /dev/guide-templates-wireframe | dev | Wireframe playground | R only | Tabs, Input, Textarea, Badge, Label | dev-only (404 in prod) | — |
| /dev/req-cards | dev | Request-card gallery | R only | ReqCard, Avatar | dev-only (404 in prod) | — |
| (root) not-found | — | Global 404 | R | RouteFeedbackShell, Button | public | — |
| (root) global-error | — | Root error boundary (Sentry) | replaces R | inline-styled markup only (no app CSS) | public | — |

Note: `(protected)/layout.tsx` itself only redirects suspended accounts; unauthenticated redirects happen per-page (`buildAuthLoginRedirect` / `readAuthContextFromServer`) and in the nested admin/guide/trips layouts.

## 2. Foundation inventory

### Tailwind v4, CSS-first — `src/app/globals.css` (360 lines)

Structure: `@theme inline` (lines 12–126) maps raw vars to Tailwind utilities; `:root` (128–226) holds raw palette + semantic assignments; `.dark` (228–249) overrides ~20 vars; `@layer base` reset; `@layer components` scrims; loose custom classes at end.

| Token group | Contents |
|---|---|
| Fonts | Onest everywhere (`--font-sans/serif/display/ui` all → `--font-onest`); Geist Mono for `--font-mono`. Loaded via next/font in `src/app/layout.tsx` (Onest 400–800 latin+cyrillic, Geist Mono 400) |
| Type scale additions | `--text-section: clamp(24px,3vw,30px)`, `--text-display: clamp(46px,6vw,68px)` |
| Container | `--max-w: 1160px` → `--container-page`; `--spacing-gutter: clamp(20px,4vw,48px)`; `--nav-h: 88px`; `--sec-pad: 80px` |
| Navy brand ramp | `--navy-50…950` raw → `--brand-50…950` (`bg-brand-*`); `--primary: navy-500 #1A56A4`; dark: `--primary #4F8BD6` |
| Amber/gold ramp | `--amber-50…600` raw → `--gold-50…950` (`bg-gold-*`); `--gold: amber-400 #D4872B`, `--gold-foreground #fff`, `--gold-hover` |
| Ink scale | `--ink` (=on-surface #141C28), `--ink-2` (#414B59), `--ink-3` (muted #8A93A1), `--faint/--placeholder` |
| Surfaces | `--surface` (canvas #FAFAF9), `--surface-low` (#F4F4F2), `--surface-lowest`/`--surface-high` (white), `--footer-bg` (navy-950), glass (`--glass-bg/border/blur/shadow`), nav-glass |
| Semantic | `--success` (green-500 #2F8F66), `--warning` (amber-400), `--danger` (#C2410C), `--destructive` (#C8453B), `--info`→primary; tints `--primary-tint/--amber-tint/--green-tint`; lines `--line/--line-2`, hairlines |
| Radii | `--card-radius 16px` (→ radius-lg/card), `--glass-radius 16px` (→ radius-xl/glass), `--radius-btn 10px`, `--radius-pill 999px`, `--radius-step 12px`, `--radius-hero 18px`; sm/md derived via calc |
| Shadows | `--card-shadow` (soft/card), `--glass-shadow` (panel/glass), `--shadow-editorial`, `--shadow-lift` |

### Custom CSS classes (globals.css) and their consumers

| Class | Defined | Used by |
|---|---|---|
| `.scrim` / `.scrim-hero` | `@layer components` | Only via `Scrim` atom (`src/components/ui/scrim.tsx`); Scrim used in `src/features/homepage-classic/components/homepage-hero-form-classic.tsx`, `src/components/shared/open-group-card.tsx` |
| `.hero-overlay` | loose rule | `src/components/shared/list-hero.tsx`, `src/components/shared/immersive-hero.tsx` |
| `.hero-grain` | loose rule | `src/components/shared/immersive-hero.tsx` |
| `.native-picker-hidden` | loose rule | 0 usages in `src/` outside globals.css |

### components.json

Style `radix-nova`, rsc+tsx true, tailwind css `src/app/globals.css`, baseColor `neutral`, cssVariables true, no prefix, iconLibrary `lucide`, aliases `@/components`, `@/components/ui`, `@/lib`, `@/hooks`.

## 3. shadcn/ui components + variants (`src/components/ui/`, 33 files)

Custom (non-registry) atoms flagged **[custom]**.

| File | Variants / API |
|---|---|
| alert-dialog.tsx | radix slots; Cancel styled via `buttonVariants({variant:"outline"})` |
| alert-dismiss.tsx | **[custom]** dismiss X button; no variants; used only by alert.tsx |
| alert.tsx | variant: default, destructive, info, success, warning; `dismissible` → AlertDismiss |
| avatar-stack.tsx | **[custom]** size: default(46px), compact(34px); `max` + "+N" overflow |
| avatar.tsx | radix Avatar/Image/Fallback; no variants |
| badge.tsx | variant: default, secondary, destructive, outline, ghost, link, eyebrow, success, warning, info, overlay |
| button.tsx | variant: default, outline, secondary, ghost, destructive, link; size: default, xs, sm, lg, icon |
| calendar.tsx | react-day-picker wrapper; no variants |
| card.tsx | slots Card/Header/Title/Description/Action/Content/Footer; no variants |
| chip.tsx | **[custom]** label+value pill, optional icon; no variants |
| command.tsx | cmdk wrapper; no variants |
| completion-bar.tsx | **[custom]** pct track + optional label; no variants |
| dialog.tsx | radix slots; no variants |
| dropdown-menu.tsx | radix slots; item `variant: destructive` via data-attr |
| empty-state.tsx | **[custom]** icon+title+description+action; iconColor: primary, amber, green |
| field-shell.tsx | **[custom]** canonical input shell (border + focus ring); no variants |
| input-group.tsx | addon `align` variants; button size: xs, sm; **0 consumers** |
| input.tsx | single styled input; no variants |
| label.tsx | radix label; no variants |
| popover.tsx | radix slots; no variants |
| progress.tsx | radix progress; no variants |
| scrim.tsx | **[custom]** variant: card, hero → `.scrim`/`.scrim-hero` |
| scroll-area.tsx | radix wrapper; no variants |
| select.tsx | trigger size: sm, default |
| separator.tsx | radix; orientation only |
| sheet.tsx | side: top, right, bottom, left |
| skeleton.tsx | **[custom variants]** variant: line, card, avatar, chip, hero; width/height props |
| stat-strip.tsx | **[custom]** dot-separated icon+value+label row; **0 consumers** |
| table.tsx | slots Table/Header/Body/Row/Head/Cell/Caption; no variants |
| tabs.tsx | radix slots; no variants |
| tag.tsx | **[custom]** color: primary, amber, green |
| textarea.tsx | single styled textarea; no variants |
| tooltip.tsx | radix slots; no variants |

## 4. Shared component usage map

Counts = distinct non-test `.tsx/.ts` files importing the module (own file excluded).

### ui atoms

| Component | Count | Used by |
|---|---|---|
| ui/button | 101 | app-wide, all groups |
| ui/badge | 53 | app-wide, all groups |
| ui/card | 37 | protected + admin + site + features |
| ui/alert | 23 | features + policies + discovery screens |
| ui/textarea | 21 | forms across features/admin |
| ui/input | 19 | forms across features/admin |
| ui/label | 19 | forms across features/admin |
| ui/avatar | 16 | admin, request/messaging features, shared cards |
| ui/separator | 16 | features + referrals + notifications |
| ui/skeleton | 11 | loading.tsx files + loading-skeletons + screens |
| ui/dialog | 10 | features (bid panel, uploads, etc.) |
| ui/select | 8 | admin pages, profile/booking forms, list-toolbar |
| ui/tabs | 6 | guide/calendar, admin pipeline/moderation, dev, ReviewsList, TourShapeDetail |
| ui/sheet | 5 | guide-excursions, offer-qa-sheet, discovery-filter-sheet, site-header, user-account-drawer |
| ui/dropdown-menu | 5 | admin guides/users, dispute-admin-resolve, ModerationQueueItem, site-header |
| ui/tag | 5 | guide-profile-screen, request-detail-screen, NewGuideFrame, DestinationCard, trip-panel |
| ui/alert-dialog | 4 | confirm-dialog, admin account-actions, cancel-booking/request buttons |
| ui/popover | 4 | homepage form, NotificationBell, discovery-filter-sheet, tag-multi-select |
| ui/avatar-stack | 3 | contact-reveal + orphans (cabinet-shell, notification-item) |
| ui/table | 3 | admin users-console, BonusLedger, PayoutsLedger |
| ui/calendar | 2 | requests marketplace, homepage request form |
| ui/command | 2 | requests marketplace, tag-multi-select |
| ui/scrim | 2 | homepage-hero-form-classic, open-group-card |
| ui/chip | 1 | request-detail-screen |
| ui/completion-bar | 1 | cabinet-shell (itself an orphan) |
| ui/empty-state | 1 | destinations-grid |
| ui/field-shell | 1 | homepage-request-form-classic |
| ui/progress | 1 | shared/req-card |
| ui/scroll-area | 1 | NotificationBell |
| ui/tooltip | 1 | homepage-request-form-classic |
| ui/alert-dismiss | 1* | only ui/alert.tsx internally |
| ui/input-group | 0 | none |
| ui/stat-strip | 0 | none |

### Shared / feature-shared components

| Component | Count | Used by |
|---|---|---|
| shared/page-header | 32 | protected + admin + site pages, feature screens |
| shared/empty-state | 15 | guide/admin/traveler screens, favorites, notifications |
| shared/list-row | 10 | admin queues, guide bookings/excursions, notifications |
| shared/confirm-dialog | 7 | booking/excursion/request destructive actions |
| profile-avatar (root) | 7 | admin guides, messages, reviews, profile forms |
| shared/loading-skeletons | 6 | loading.tsx files, guide-bookings, notifications |
| shared/discovery-shell | 5 | guides/destinations/listings/requests discovery screens |
| shared/route-feedback-shell | 5 | root/site/protected/admin not-found, cabinet-section-unavailable |
| shared/discovery-search-input | 4 | 4 discovery screens (guides, destinations, listings, requests) |
| shared/site-header-server | 4 | (site)+(protected) layouts, / and /ai pages |
| shared/info-shell | 4 | become-a-guide, how-it-works, help, trust |
| shared/avatar-stack | 3 | request-card-final (orphan), trip-panel, open-group-card |
| shared/glass-card | 3 | guide availability/calendar blocks, route-feedback-shell |
| shared/immersive-hero | 3 | request-detail-screen, ExcursionShapeDetail, TourShapeDetail |
| shared/site-footer | 3 | (site) layout, /ai, homepage shell |
| shared/cabinet-section-unavailable | 2 | referrals, favorites |
| shared/open-group-card | 2 | requests marketplace, homepage shell |
| shared/rating-display | 2 | ExcursionShapeDetail, TourShapeDetail |
| shared/req-card | 2 | /dev/req-cards, destination-detail-screen |
| shared/step-card | 2 | become-a-guide, how-it-works |
| shared/tour-card | 2 | guide-profile-screen, destinations listings-filter |
| shared/article-shell | 1 | for-business |
| shared/bidding-guides-teaser | 1 | request-detail-screen |
| shared/discovery-filter-sheet | 1 | requests marketplace |
| shared/guide-bottom-nav | 1 | guide layout |
| shared/guide-offer-card | 1 | request-detail-screen |
| shared/interest-tag | 1 | open-group-card |
| shared/language-multi-select | 1 | homepage-request-form-classic |
| shared/list-hero | 1 | discovery-shell |
| shared/listing-card | 1 | public-listing-discovery-screen |
| shared/public-guide-card | 1 | public-guides-grid |
| shared/request-facts-panel | 1 | request-detail-screen |
| shared/section-heading | 1 | homepage shell |
| shared/sticky-action-bar | 1 | request-detail-screen |
| shared/theme-multi-select | 1 | homepage-request-form-classic |
| shared/trip-panel | 1 | request-detail-screen |
| shared/user-account-drawer | 1 | site-header |
| shared/site-header | 1* | only via site-header-server |
| shared/tag-multi-select | 1* | only via language/theme-multi-select |
| shared/cabinet-shell | 0 | none |
| shared/list-toolbar | 0 | none |
| shared/marketing-header | 0 | none |
| shared/notification-item | 0 | none |
| shared/request-card-final | 1 | /trips (traveler-requests-screen.tsx:14, multi-line import — corrected 2026-07-13) |
| discovery/DestinationCard | 1 | destinations-grid |
| discovery/NewGuideFrame | 1 | guide-profile-screen |
| bookings/booking-status-badge | 2 | booking-detail-screen, dispute-case-detail |
| guide/ContactVisibilityChip | 1 | /guide/settings/contact-visibility |
| help/HelpArticle | 1 | /help |
| help/HelpSearch | 1 | /help |
| listing-detail/AvailabilitySection | 2 | /listings/[id], ExcursionShapeDetail |
| listing-detail/ExcursionShapeDetail | 1 | /listings/[id] |
| listing-detail/GuideCard | 2 | Excursion/TourShapeDetail |
| listing-detail/ScheduleDisplay | 1 | ExcursionShapeDetail |
| listing-detail/TariffsList | 2 | Excursion/TourShapeDetail |
| listing-detail/TourDeparturesList | 1 | TourShapeDetail |
| listing-detail/TourItineraryDisplay | 1 | TourShapeDetail |
| listing-detail/TourShapeDetail | 1 | /listings/[id] |
| trust/contact-reveal | 1 | booking-detail-screen |
| trust/money-breakdown | 2 | booking-detail-screen, /listings/[id]/book |

### Duplicate / overlap suspects

1. **Two EmptyState components**: `src/components/ui/empty-state.tsx` (1 use) vs `src/components/shared/empty-state.tsx` (15 uses) — same name, different APIs.
2. **Two AvatarStack components**: `src/components/ui/avatar-stack.tsx` (live: contact-reveal only) vs `src/components/shared/avatar-stack.tsx` (3 uses).
3. **Two PublicGuideCard components**: `src/components/shared/public-guide-card.tsx` (used by /guides grid) vs `src/features/guide/components/public/public-guide-card.tsx` (used by destination detail).
4. **Request-card family (3+)**: `src/components/shared/req-card.tsx`, `src/components/shared/open-group-card.tsx`, `src/components/shared/request-card-final.tsx` (live on /trips — see correction in §Orphans) — all render request cards.
5. **Badge/chip/tag pill family (5)**: `ui/badge` (11 variants), `ui/chip`, `ui/tag`, `shared/interest-tag`, `guide/ContactVisibilityChip` — overlapping pill styling.
6. **Card wrappers**: `ui/card`, `shared/glass-card`, plus bespoke card shells in `tour-card`, `listing-card`, `guide-offer-card`, `step-card`, `discovery/DestinationCard`, `listing-detail/GuideCard`.
7. **Hero family**: `shared/immersive-hero` (hero-overlay + hero-grain), `shared/list-hero` (hero-overlay), `ui/scrim` (.scrim/.scrim-hero) — two overlay systems (`hero-overlay` class vs Scrim atom).
8. **Skeleton duplication**: `ui/skeleton` variants vs `shared/loading-skeletons` (ListRowSkeleton etc.) composing the same patterns.
9. **Header duplication**: `shared/site-header(-server)` vs orphaned `shared/marketing-header`.
10. **Shell family (5)**: `shared/discovery-shell`, `shared/info-shell`, `shared/article-shell`, `shared/route-feedback-shell`, orphaned `shared/cabinet-shell` — parallel page-scaffold patterns.
11. **Orphans (0 importers)**: `shared/cabinet-shell.tsx`, `shared/list-toolbar.tsx`, `shared/marketing-header.tsx`, `shared/notification-item.tsx`, `ui/stat-strip.tsx`; plus CSS class `.native-picker-hidden` (0 uses). CORRECTION 2026-07-13: `ui/input-group.tsx` is NOT an orphan — imported (multi-line) by `ui/command.tsx:17`, which is live via tag-multi-select and public-requests-marketplace-screen. CORRECTION 2026-07-13: `shared/request-card-final.tsx` is NOT an orphan — it is imported via a multi-line import in `src/features/traveler/components/requests/traveler-requests-screen.tsx:13-17` and renders the /trips cards (single-line grep missed it).
12. **Two multi-select wrappers**: `shared/language-multi-select` and `shared/theme-multi-select` both thin wrappers over `shared/tag-multi-select`, both used only by homepage request form.
