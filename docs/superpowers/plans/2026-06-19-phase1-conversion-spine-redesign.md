# Phase 1 — Conversion-Spine Immersive Redesign + Bug Fixes — Implementation Plan

> **For agentic workers:** built to be driven by the reusable orchestrator `/goal` (cursorSDK writes all code, a Sonnet subagent verifies each task, the orchestrator runs gates + merges per-page to main + does the live 1280/375 browser check). Tasks are sized to one cursorSDK dispatch (≤5 files each).

**Goal:** Bring Provodnik's public **conversion spine** up to the locked "Clean Trust" immersive canon (already shipped on `/requests/[requestId]`) AND fix the P0/P1 functional bugs found on those pages, shipping **per-page to main** behind the green gate.

**Architecture:** Reuse the shipped primitives (`ImmersiveHero`, `TripPanel`, `AvatarStack`, `GuideOfferCard`, `BiddingGuidesTeaser`, glass/navy tokens). Build a small set of missing shared primitives once (Workstream S), then apply them page-by-page. Cross-cutting trust bugs (Workstream P0) and the genuinely-broken pages (Workstream B) are fixed first because they're cheap and high-impact.

**Tech stack:** Next.js 16 App Router, Tailwind v4 (`@theme` tokens in `globals.css`), shadcn/ui, Supabase (shared prod `yjzpshutgmhxizosbeef`), bun, vitest, lucide-react, Onest.

## Global Constraints — the per-page "polish gate" (every task must satisfy)
- **One job, one primary CTA** (rest outline/ghost/text). Never two equal "loud" buttons.
- **~85% neutral.** Navy/amber/green are accents only — never a section/background wash.
- **Onest only; 8px spacing rhythm; system `Button`/`Card`/`Chip` + Lucide icons.** NO emoji/glyph icons (`-> ★ ▾ ✕ + ×`), NO inline `style={}` for color, NO `window.confirm/alert`.
- **All four real states:** loading skeleton → friendly empty → error+retry → success. Never a false "не найдено / ничего не найдено" while loading.
- **Real data only.** No hardcoded chips/seasons/themes, no fake `0`-counts shown as real, no local-only mutations.
- **Semantic tokens only** in TSX (`bg-surface`, `text-on-surface`, `text-on-surface-muted`, `border-border`, `text-success`, `bg-glass`…). No raw hex.
- **Mobile-first 390/375px** verified; touch targets ≥44px; Russian copy; real photography.
- **Per-page ship:** typecheck+lint+test:run+build green → Sonnet PASS → push branch → PR → CI green → squash-merge to main (clean trailers) → live 1280/375 check.

---

## Process & autonomy (STANDING RULES — apply to every task)
- **DB changes are AUTONOMOUS — never ask the owner.** Any change that needs a DB update (migration, RPC, view, column, data fix) is applied by the orchestrator itself via the Mac mini: `ssh sshm` (user **idev**), token at `~/.supabase/access-token`, project `yjzpshutgmhxizosbeef`, using `node /Users/idev/provodnik/scripts/apply-migration-via-management-api.mjs <file>` (ship the SQL to the mini via base64 if it isn't on the mini's branch). ALWAYS live-verify against the PostgREST/RPC API (anon key from `.env.local`) after applying. Do NOT pause or ask for DB approval — just do it (additive/reversible by default; write the rollback alongside).
- **Decisions are AUTONOMOUS via an Opus PM persona — never block on the owner.** Any open question or "what's best for the project" call is resolved by dispatching an **Opus Project-Manager persona agent** (Agent tool, `model: opus`, framed as Provodnik's senior PM) with the product context + the decision; act on its recommendation and record it in the plan/loop-state. Only escalate to the owner for irreversible non-DB ops outside this plan's scope (e.g. prod deploy of something not covered here) or a hard 3× failure.

## File structure (what gets created vs touched)
- **Create:** `src/components/shared/rating-display.tsx`, `page-header.tsx`, `list-hero.tsx`, `public-guide-card.tsx`, `loading-skeletons.tsx`.
- **Modify (bugs):** `booking-detail-screen.tsx`, `account/notifications/page.tsx` + `NotificationPrefsMatrix`, `guide/stats/page.tsx`, admin pages using `booking-badge`, `destinations-grid.tsx`, `destination-detail-screen.tsx`, search `ListingCard`, listing itinerary renderers, home `HeroConversation`.
- **Modify (redesign):** the spine page feature components — `public-listing-discovery-screen.tsx`, `ExcursionShapeDetail`/`TourShapeDetail`, `public-guides-grid.tsx`, `guide-profile-screen.tsx`, `search/page.tsx`+`FilterBar`, `destination-detail-screen.tsx`, `auth-entry-screen.tsx`, plus their `page.tsx` data wiring + `getGuides`/`getDestinations` queries.
- **Restore + refactor (`/form`):** recreate `src/app/(home)/form/page.tsx`; remove the `/form → /` redirect in `next.config.ts`; refactor `src/features/homepage-classic/components/*` (shell + request form + `use-request-form`) to canon; repoint `hero-conversation.tsx` link.

---

# Workstream P0 — Cross-cutting trust/display bug fixes (do FIRST; cheap, high-impact)

### P0-1 — `RatingDisplay` primitive + kill the zero-rating trust-killer
**Why:** `/guides`, `/guides/[slug]` and embedded listing/guide cards render `★0 · 0 отзывов`, `0.0 / 5`, `0 поездок` — reads as a zero-star guide. Pervasive.
**Files:** Create `src/components/shared/rating-display.tsx`; update every consumer that prints a star+rating (guides grid, guide-profile-screen, listing cards, destination cards, search cards).
**What:** `RatingDisplay({ rating, reviewCount, variant })` — when `reviewCount === 0` render **"Новый гид"/"Без отзывов"** (a muted chip), NOT stars/`0.0`. When `>0`, amber star + `rating.toFixed(1)` + `· {n} {pluralize}`. Replace the inline renders. Also suppress the `0 поездок`/`0.0 рейтинг` stat blocks on the guide profile when zero (show "—" or hide).
**Verify:** unit test (0 → no stars; 3 → stars+count). Live: a 0-review guide shows "Новый гид", a reviewed one shows stars.
**Commit:** `fix(trust): suppress zero-rating display; add RatingDisplay primitive`

### P0-2 — Fix doubled city text on `/destinations`
**Why:** cards render "Москва Москва Москва" (city + region + label all the same value).
**Files:** `src/features/destinations/components/destinations-grid.tsx` (+ the card subcomponent).
**What:** render city once; show region only when it differs from city; drop the duplicate label node.
**Verify:** live — each destination card shows one city + (distinct) region.
**Commit:** `fix(destinations): de-duplicate city/region label on cards`

### P0-3 — Fix `/destinations/[slug]` "Найти гида" CTA + hardcoded chips
**Why:** "Найти гида" links to `/` (intent lost); "Лучший сезон…" and "Природа · Культура · Гастрономия" are hardcoded fake chips.
**Files:** `src/features/destinations/components/destination-detail-screen.tsx`.
**What:** point "Найти гида" → `/guides?region={region}` (or `/search?city={name}` with the city pre-filled); make it the single primary CTA, demote "Смотреть маршруты" to secondary anchor. Remove the two hardcoded chips (or replace with real data fields if present; else delete — zero fabrication).
**Verify:** live — CTA lands on a filtered guides/search view; no fake season/theme chips.
**Commit:** `fix(destinations): real CTA target + remove hardcoded season/theme chips`

### P0-4 — ASCII `->` arrows → `→` in itineraries/routes
**Files:** the itinerary/route renderer(s) used by listing cards + `/listings/[id]` (search ListingCard, ExcursionShapeDetail route section).
**What:** replace the literal `->` separator with `→` (or a styled chevron) at the render layer; do not mutate DB data.
**Verify:** live — routes read "A → B → C".
**Commit:** `fix(listings): render route separators as → not ->`

### P0-5 — `/search` slug links + consistent rating
**Files:** `src/app/(site)/search/page.tsx` query (select `slug`), `src/components/traveler/ListingCard.tsx`.
**What:** link cards to `/listings/{slug}` (fall back to id only if slug missing); use `RatingDisplay` so 0-review cards show nothing/"Новый", matching `/listings`.
**Verify:** live — search cards link to slugs; rating display consistent.
**Commit:** `fix(search): slug-based listing links + consistent rating display`

### P0-6 — RESTORE the `/form` manual request page (reachability)
**Why:** `/form` (the classic manual request form, the backup to the conversational `/`) was deleted in the IA refactor (commit `06021e15`): the page file `src/app/(home)/form/page.tsx` was removed, a `next.config.ts:51` redirect `/form → /` was added, and the homepage link `hero-conversation.tsx:263` was repointed to `/`. Result: the "Предпочитаете заполнить вручную? → Обычная форма" link is a dead self-reference; the manual form is unreachable. **The components still exist** (`src/features/homepage-classic/`: `homepage-shell2-classic`, `homepage-request-form-classic`, `use-request-form`, etc.) and the deleted page is recoverable: `git show 06021e15^:src/app/(home)/form/page.tsx`.
**Files:** Create `src/app/(home)/form/page.tsx` (recover/recreate — mounts `SiteHeaderServer` + `HomePageShell2Classic` with `getActiveGuideDestinations` + `getHomepageRequests`); remove the `/form → /` redirect in `next.config.ts:51`; repoint `hero-conversation.tsx:263` link `href="/"` → `href="/form"`.
**What:** restore the route so the manual form works again (old styling OK at this step — V-9 does the canon refactor). Confirm `createRequestAction` still wires.
**Verify:** live — `/form` loads the manual form (no longer 301s to `/`); the homepage "Обычная форма" link lands on it; submitting creates a request.
**Commit:** `fix(form): restore manual /form route + repoint homepage link`

---

# Workstream B — Broken-page fixes (front-loaded; "function before polish")

### B-1 — BookingDetailScreen false "не найдено" while loading (HIGH)
**Files:** `src/features/bookings/components/booking-detail-screen.tsx` (guide view ~L372-495; apply same to traveler view).
**What:** add an `isLoading` flag; render a loading skeleton while the fetch is pending; only show "Бронирование не найдено" when `!isLoading && !record`. Add an error+retry branch.
**Verify:** unit/render test: pending → skeleton, resolved-null → not-found, resolved → content. Live (demo booking) shows content, not a flash of "не найдено".
**Commit:** `fix(bookings): loading + error states on booking detail (no false not-found)`

### B-2 — `/account/notifications` loads saved prefs + error handling + touch targets
**Files:** `src/app/(protected)/account/notifications/page.tsx`, `NotificationPrefsMatrix`.
**What:** fetch the user's saved prefs on mount (server action) and seed state from them (not `{}`); surface save errors (toast/inline, not silent); wrap switches to ≥44px hit area.
**Verify:** unit test seeded prefs render checked; save-failure path surfaces an error. Live: existing prefs pre-populate.
**Commit:** `fix(account): load saved notification prefs + surface save errors`

### B-3 — `/guide/stats` placeholder → minimal real stats (DECISION: see note)
**Files:** `src/app/(protected)/guide/stats/page.tsx` (+ a query lib + maybe an RPC).
**What (RESOLVED — Opus PM: build minimal REAL stats now):** replace "Скоро…" with real figures from existing data — completed bookings count, avg review rating, review count, active listings count — using read-only existing queries. If a metric needs aggregation, add ONE read-only RPC (apply autonomously via mini). Scope to read-only existing data, NO new aggregation tables; if any single metric isn't queryable within this task, OMIT that metric rather than fake it or defer the whole page. (A "coming soon" page live in prod is a trust leak on the audience — guides — you most need to retain pre-launch.)
**Verify:** live as a demo guide — real numbers, no "coming soon".
**Commit:** `feat(guide): real guide stats dashboard (bookings/reviews/listings)`

### B-4 — Admin `booking-badge` undefined classes → `Badge`
**Files:** `admin/guides/page.tsx`, `admin/guides/[id]/page.tsx`, `admin/listings/page.tsx` (+ the `verificationBadgeClass` helper).
**What:** replace the undefined `booking-badge*` classes with the shared `<Badge variant=…>` + status label (semantic colors).
**Verify:** typecheck/lint; live admin pages show styled status badges. (Admin is not a spine page, but this is a cheap real-bug clear bundled with B.)
**Commit:** `fix(admin): replace undefined booking-badge classes with Badge`

---

# Workstream S — Missing shared primitives (build once, reused by all spine pages)

### S-1 — `PageHeader`
**Files:** Create `src/components/shared/page-header.tsx`.
**What:** `PageHeader({ eyebrow?, title, subtitle?, actions? })` — canonical page title block (Onest weights, tokens) for non-hero list/cabinet pages. Replaces ad-hoc `h1`+metadata.
**Verify:** typecheck; a snapshot/render test. **Commit:** `feat(ui): PageHeader primitive`

### S-2 — `LoadingSkeleton` variants
**Files:** Create `src/components/shared/loading-skeletons.tsx`.
**What:** `CardGridSkeleton`, `DetailSkeleton`, `ListRowSkeleton` built on the existing `Skeleton`. Used as Suspense fallbacks + client loading states across the spine.
**Verify:** typecheck. **Commit:** `feat(ui): shared loading skeleton variants`

### S-3 — `PublicGuideCard` (canonical guide list card)
**Files:** Create `src/components/shared/public-guide-card.tsx`.
**What:** a non-selectable link card reusing `GuideOfferCard`'s visual language (avatar, verified badge, `RatingDisplay`, experience, specialties, trips/%recommend) — for the `/guides` grid and "local guides" sections. Wraps a `next/link` to `/guides/{slug}`.
**Verify:** render test (renders name, links to slug, hides rating at 0). **Commit:** `feat(ui): PublicGuideCard for guide directory`

### S-4 — `ListHero` (immersive hero for catalog/list pages)
**Files:** Create `src/components/shared/list-hero.tsx`.
**What:** a hero variant (full-bleed photo + scrim + title/intro) with a **search/filter slot** child — for `/listings`, `/guides`, `/search`, `/destinations` tops. Reuses `ImmersiveHero` internals where possible.
**Verify:** render test. **Commit:** `feat(ui): ListHero primitive for catalog pages`

---

# Workstream V — Spine pages (immersive redesign; each ships per-page)

### V-1 — `/listings` immersive catalog
**Files:** `src/features/listings/components/public/public-listing-discovery-screen.tsx` (+ `listing-card.tsx` token-align).
**What:** `ListHero` top (region photo + "Готовые экскурсии" + search inside hero); token-align the theme filter pills (kill the off-brand blue shadow on active pills); ensure `RatingDisplay`; add a subtle "не нашли подходящее? — оставить запрос" nudge → `/`. Loading skeleton + friendly empty.
**Verify:** live 1280/375; filters preserved. **Commit:** `feat(listings): immersive catalog hero + token alignment`

### V-2 — `/listings/[id]` immersive detail + CTA hierarchy
**Files:** `ExcursionShapeDetail.tsx` (+ `TourShapeDetail.tsx`), `listings/[id]/page.tsx` if wiring needed.
**What:** immersive hero (full-bleed gallery/scrim + title + meta chips); convert the booking sidebar to **one primary "Заказать"** + secondary ghost "Задать вопрос"; sticky desktop rail + mobile bottom bar (reuse the request-detail pattern); `RatingDisplay`; route `→`. Keep PII masking, tariffs/schedule, instant-booking.
**Verify:** live 1280/375; booking + question flows still work. **Commit:** `feat(listings): immersive listing detail + primary/secondary CTA`

### V-3 — `/guides` immersive directory
**Files:** `public-guides-grid.tsx`; `src/data/supabase/queries.ts` `getGuides` (select the view stats — trips_completed/recommend_pct/verified from `v_guide_public_profile`; **no migration**, columns exist).
**What:** `ListHero` + search; replace inline cards with `PublicGuideCard`; `RatingDisplay` (fixes ★0); move "Стать гидом" to a single subordinate strip (not a competing third job); loading/empty states.
**Verify:** live — rich guide cards, no zero-star, search preserved. **Commit:** `feat(guides): immersive directory with PublicGuideCard + real stats`

### V-4 — `/guides/[slug]` immersive profile + primary CTA
**Files:** `guide-profile-screen.tsx` (+ `guides/[slug]/page.tsx`).
**What:** replace the custom hero with `ImmersiveHero` (guide portrait + name + headline + verified); **add the missing primary CTA** — "Оставить запрос этому гиду" (or contact when unlocked) as the single loud action; `RatingDisplay` (kill 0.0/0 trips); populate languages/specialties (they're queried but dropped — wire them through); keep listings + reviews sections. Full bio (no mid-sentence truncation).
**Verify:** live 1280/375 — hero + one clear CTA + no zero-stats. **Commit:** `feat(guides): immersive guide profile + primary request CTA`

### V-5 — `/search` aligned with `/listings`
**Files:** `search/page.tsx`, `FilterBar.tsx`, `ListingGrid.tsx`.
**What:** `ListHero` + the same card as `/listings` (consistency; the audit flagged search/listings divergence); tidy filter overflow (collapse extras behind "Ещё", clear-all); loading/empty/error states; (P0-5 already fixed slugs+rating).
**Verify:** live 1280/375. **Commit:** `feat(search): align search with listings (shared hero + card + states)`

### V-6 — `/destinations` + `/destinations/[slug]` polish
**Files:** `destinations-grid.tsx`, `destination-detail-screen.tsx`.
**What:** the list is already photo-strong — token-align + apply `ListHero`/`PageHeader`; show real tour counts where present; on detail, reduce the 15+ filter buttons (collapse), keep the fixed CTA (P0-3) and one primary action. (P0-2/P0-3 already fixed the data bugs.)
**Verify:** live 1280/375. **Commit:** `feat(destinations): token-align list + detail, tame filter overflow`

### V-7 — `/` home canon alignment
**Files:** `hero-conversation.tsx`.
**What:** keep the strong one-job chat form; align to tokens (replace inline gradient `style={}` with token utilities/`bg-glass`); add an above-the-fold trust line; ensure 375px above-fold shows heading+input+enabled-on-input CTA. (P0-6 already fixed the dead link.)
**Verify:** live 1280/375; form still submits. **Commit:** `feat(home): token-align hero, trust line, mobile above-fold`

### V-8 — `/auth` polish
**Files:** `auth-entry-screen.tsx`, `auth/page.tsx`.
**What:** tone down the full-bleed navy wash to canon (mostly neutral, navy as accent); add a desktop value-prop/trust panel beside the form (1280px); render `?error=` params as a visible banner (a real UX gap); keep the focused single-job flow.
**Verify:** live 1280/375; error param shows a banner. **Commit:** `feat(auth): canon-aligned auth with trust panel + visible error states`

### V-9 — `/form` manual request form: canon refactor + schema reconciliation
**Why:** after P0-6 restores reachability, the classic form needs the canon polish + must emit the SAME request shape as the conversational `/` form (closes the audit's home/kabinet form divergence).
**Files:** `src/app/(home)/form/page.tsx`, `src/features/homepage-classic/components/homepage-shell2-classic.tsx` + `homepage-request-form-classic.tsx` (+ `homepage-hero-form-classic.tsx`, `use-request-form.ts` as needed). ≤5 files.
**Archetype:** focused FORM page (like `/auth`) — NOT a photo-immersive hero. Use `PageHeader` ("Заполните заявку вручную" + one-line intro) + a single elevated form card (`bg-surface-lowest`, `rounded-[16px]`, `border-border`). Mobile-first single column.
**What:**
- Canon: semantic tokens only, Onest, 8px rhythm, **one primary CTA "Подобрать гика"** (rename if needed to match `/`), Lucide icons (NO glyphs), system `Button`/`Chip`/inputs — kill any inline `style`, raw `<button>`, emoji.
- Fields (logical groups in the card): **Куда** · **Когда** + flexibility toggle (Точная дата / ±несколько дней → `dateFlexibility` `exact`/`few_days`) · **Время** (optional start/end) · **Формат** = the existing `mode` assembly/private toggle with Lucide `Users`/`User` icons (keep ADR-063 behaviour) · **Сколько человек** · **Бюджет на человека (₽)** · **Интересы** = multi-select chips from the canonical `INTEREST_CHIPS` (`@/data/interests`) — replace any divergent list · **Язык** (`requestedLanguages`) · **Комментарий** (`notes`).
- Reconcile: ensure the form submits via `createRequestAction` (`src/features/requests/create-request-actions.ts`) with the IDENTICAL field set the conversational `/` form produces (destination, startDate, startTime, endTime, groupSize, budgetPerPersonRub, interests[], requestedLanguages[], notes, mode). One source of truth for field defs (the shared `use-request-form` hook + `src/data/traveler-request/schema.ts`).
- States: inline zod validation errors, pending state on submit, success → `redirect('/requests/{id}?created=1')` (same as `/`). Add a subordinate link back to the conversational flow ("Быстрый подбор через вопросы" → `/`).
**Verify:** `bun run test:run` (update `homepage-request-form*.test.tsx` for any field/label changes); live 1280/375 — clean form, one CTA, mode toggle works, submit creates a request and lands on its detail page; interests + flexibility match what `/` produces.
**Commit:** `feat(form): canon refactor of manual request form + schema reconciliation`

---

# Workstream E — Verify + ship (orchestrator, per page)
For EACH task above, in order (P0 → B → S → V): cursorSDK writes the code → orchestrator runs git diff (scope + trailer scan) + `bun run typecheck && bun run lint && bun run test:run && bun run build` → Sonnet subagent PASS → push branch `redesign/phase1-<task>` (or a rolling `redesign/phase1-spine`) → PR → CI green → squash-merge to main (clean trailers) → live 1280/375 browser check on the affected page. DB: only V-3/B-3 might touch data; V-3 needs none (view columns exist); B-3 only if a metric needs an RPC (apply via mini `ssh sshm`).

### E-final — Full spine sweep
After V-8, a Sonnet browser subagent walks the whole spine (`/ /listings /listings/[id] /guides /guides/[slug] /search /destinations /destinations/[slug] /auth`) at 1280 + 375, confirming: immersive heroes present, one primary CTA each, all four states, no zero-rating/doubled-text/dead-CTA regressions, no emoji glyphs, no horizontal scroll. Report = Phase 1 done.

---

# Workstream R — Research-backed enhancements (fold into the tasks above; 2024–2026 sources)
Durable, evidence-backed patterns from a competitor/UX sweep (Baymard, Thumbtack/Bark/Upwork, Airbnb/GetYourGuide/Booking). Each augments an existing task — not separate work.

- **R-1 (augments V-1, V-5) — Zero-results becomes a lead.** The empty/no-results state on `/listings` + `/search` is a prominent **"Ничего не нашли? Опубликуйте запрос — гиды предложат варианты →"** primary CTA (→ `/` or `/form`), not a bare "ничего не найдено". Our reverse-marketplace superpower. (Baymard filter UX.)
- **R-2 (augments V-1, V-5) — Real filter UX.** Result-counts next to each facet value ("Горы (34)"); persistent filters (desktop sidebar / mobile bottom-sheet drawer with a sticky **"Показать N результатов"** apply button); removable applied-filter chips above results; checkbox logic = OR within a facet, AND across facets; ≥44px targets. (Baymard — counts are "one of the single highest-impact filter improvements.")
- **R-3 (augments P0-1, S-3, V-4) — "New but vetted" cold-start.** A 0-review guide must not look like a 0-star guide. `RatingDisplay`'s zero state shows a **"Новый гид"** chip PAIRED with the verification badge + response-time + experience + portfolio count — verifiable trust artifacts instead of a blank. (Upwork "Rising Talent", Angi "New Pro"; verified profiles convert ~3–4×.)
- **R-4 (augments V-2, V-4) — Decision-point conversion.** At the primary CTA on `/listings/[id]` + `/guides/[slug]`: rating+count rendered ADJACENT to the CTA; **"от N ₽"** starting-price framing; one line of doubt-remover micro-copy ("оплата напрямую гиду · ответ за ~2 ч"). (+31% sticky-CTA conversion evidence; GetYourGuide "from" pricing.)
- **R-5 (augments V-1, V-3, S-3) — Name + face the guide everywhere.** Every listing/guide card shows the individual guide's name + photo (not an operator logo) — Provodnik's core differentiator. (Airbnb Experiences vs Viator/GYG.)
- **R-6 (augments V-9, V-7) — Scope-first, minimal forms.** The manual `/form` (and `/` hero) ask 1–3 trip-scoping questions (куда/когда/что) BEFORE any contact/identity; keep it short (each field ≈ −10% completion). Single-page is correct here — only step it if fields exceed ~7. (HubSpot/Neil Patel field-count data; multi-step only wins past ~7 fields.)
- **R-7 (augments V-4, V-2) — Lightweight review trust (cheap parts now).** Tag reviews "после реальной экскурсии" and order recent-first. (Booking 2025 recency weighting.) *Larger follow-ons (browsable review-photo gallery, visible guide reply to negative reviews) need data/feature work → defer to a later phase; logged here, not Phase-1.*
- **R-8 (augments V-7 home; + follow-on to the DONE `/requests/[id]`) — Expectation-setting.** After posting (and on home), show "Обычно гиды отвечают за ~N ч" to justify the wait + make the marketplace feel alive; back it with the guide-side fast-response signal. The shipped `BiddingGuidesTeaser` can later gain a response-time line (follow-on enhancement to the already-done page, not a Phase-1 spine task).
- **Product/architecture notes (NOT Phase-1 tasks, flagged for the owner):** standardized bid cards already trust-signal on `/requests/[id]` (could add "отвечает быстрее всех" later); value-anchor the off-platform model by keeping contact/messaging on-platform to build a reputation/evidence trail (Sharetribe leakage playbook) — but AVOID hard contact-masking (backfires) and AVOID charging guides for low-intent leads (Thumbtack/Bark's biggest trust wound). **Zero fabrication:** never seed AI-synthetic guide profiles.

## Resolved decisions (Opus PM consult, 2026-06-19)
1. **`/guide/stats` (B-3):** build the minimal REAL page now (read-only existing data; omit a metric rather than fake/defer). A live placeholder is a trust leak on guides.
2. **Run shape: SPLIT into two goals** — **goal-1 = P0 + B** (bug/restoration fixes, small independent diffs, incl. restoring `/form`; lands trust value within hours, near-zero design risk) → **goal-2 = S + V** (the visual rollout; shared primitives fanning across 9 pages = a different risk class, isolate it for clean reviews + trivial per-page rollback + sane turn budget). A single 20-task goal is too long a leash for the per-page browser-gated loop.
3. **Sequencing:** trust/display bug fixes (P0) → **request-creation funnel (home + `/form`)** → conversion-spine polish. On a thin marketplace, no guide bids without requests, so the funnel that produces inventory is the true top-of-funnel and must work before polish; fabricated-looking signals destroy trust, so kill those first; polish amplifies pages that are by then already correct.
4. **Tripster RU parity:** ONE time-boxed browser pass DURING goal-1, off the critical path (capture how it surfaces identity/reviews/pricing/"why this guide"); produce a short patterns note. If extraction fails again, ship on our locked canon — do NOT block.
5. **Front-load the booking HANDOFF (best-for-project):** the off-platform model lives or dies on the identity/contact reveal + accept→confirm handoff (a prior workflow audit flagged it broken). **NOTE:** much of this was already shipped in PR #129 ("identity reveal, guide confirm, marketplace handoffs") — so **goal-0 = re-verify the handoff live** (request→bid→accept→contact-revealed→booking) before the spine; front-load only the gaps that remain. Also add **lightweight funnel instrumentation** (events: request created → bid placed → accepted → contact revealed) so Phase-1 impact is measurable on the thin user base. `/destinations` polish (V-6) is the lowest-priority spine page — deferrable to fund handoff gaps if needed.

## Sequencing & DONE
- **goal-0 (pre-spine):** re-verify the booking handoff live (mostly #129-fixed); fix only remaining gaps; add funnel events. Kick the time-boxed Tripster pass in parallel.
- **goal-1 = P0 + B** (order within: P0 trust/display bugs → restore `/form` → B broken-page fixes incl. real `/guide/stats`). Each task: cursorSDK → gates → Sonnet PASS → per-page merge to main → live check. DB applied autonomously via mini as needed.
- **goal-2 = S + V** (build primitives S-1..S-4, then spine pages V-1..V-9 in funnel-first order: home/`/form` → listings/search/listing-detail → guides/guide-profile → auth → destinations last), each folding its R-enhancements; then **E-final** full-spine sweep @1280+375.
- **Phase 1 DONE =** all P0+B+S+V tasks merged to main with green CI + Sonnet PASS each; goal-0 handoff verified; E-final sweep PASS; DB changes (B-3 stats, any others) applied + live-verified autonomously via the mini.

## Self-review notes
- Scope corrected to reality: `/form` was DELETED by the IA refactor (not "never existed") — now RESTORED (P0-6) + canon-refactored (V-9), with its homepage link + redirect fixed; `/guides/[slug]` added to redesign (not already immersive) + given its missing CTA; admin/moderation link "bug" dropped (works).
- Every page pass folds in its in-scope functional bug (per owner decision), with the worst trust-killers (zero-rating, doubled city, dead CTA) front-loaded as P0 so they're fixed within days regardless of redesign pace.
- No fabrication: hardcoded season/theme chips removed rather than faked; zero-review guides show "Новый гид", not invented stats.
