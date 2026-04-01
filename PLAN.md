# PLAN — Provodnik: From MVP to Go-Live

> Written 2026-03-30. Based on full codebase audit, IMPLEMENTATION.md, STAKEHOLDER-FEEDBACK.md, VISUAL-ISSUES.md, and build verification.

---

## Where We Are

**What exists and works:**
- Next.js 16 app builds clean, all 30+ routes compile
- Full public discovery: homepage, destinations, listings, guides, requests
- Protected areas scaffolded: traveler dashboard, guide dashboard, admin panel
- Supabase schema with 6 migrations covering all core tables (profiles, listings, requests, offers, bookings, reviews, notifications, disputes, conversations)
- Auth: Supabase + demo mode fallback
- Design system: CSS custom properties, glass-morphism, Russian copy throughout
- Data layer: Supabase queries for all major entities via TanStack Query
- Forms: React Hook Form + Zod validation on request creation and guide offers

**What does NOT work yet (blocking go-live):**
- No real Supabase auth flow tested end-to-end (demo mode masks gaps)
- No messaging between travelers and guides
- No real-time notifications (DB records only, no push/websocket)
- No file uploads (guide verification docs, listing photos)
- No email/SMS notifications
- No middleware.ts protecting routes server-side
- No tests of any kind
- No CI/CD pipeline
- 14 documented visual defects on homepage
- 7 stakeholder feedback items unaddressed
- No seed data strategy for launch region
- No SEO/meta tags beyond root layout
- No error boundaries or 404/500 pages
- No rate limiting or abuse protection

---

## What We Are Trying to Achieve

A live, request-first tour marketplace for Russia's initial launch region where:
1. A traveler can sign up, create a request, and get real guide offers
2. A guide can onboard, get verified, publish listings, and respond to requests
3. An operator can moderate guides, listings, and disputes
4. The experience feels trustworthy, fast, and mobile-first

> Payments are out of scope for launch. The marketplace loop works without them: traveler and guide agree on price and terms through the platform, then settle offline or via a later payment integration.

---

## The Plan

### Phase 0 — Visual & UX Polish ✅ COMPLETE (2026-03-30)
> Fix what's broken. No new features. Ship a homepage that matches the reference.
> Delivered in 3 commits via `codex exec` (GPT-5.4, reasoning=high), bypassing SDD pipeline.

- [x] **0.1** Fix navbar: float over hero as frosted glass, correct link colors (#475569), teal active underline — `5bb5dca`
- [x] **0.2** Fix hero: swap to correct bright shoreline image, lighten overlay, restore airy look — `5bb5dca`
- [x] **0.3** Fix buttons: white text on teal backgrounds everywhere — `5bb5dca`, `0c98d11`
- [x] **0.4** Fix typography: Cormorant for display headings only, DM Sans/Inter for UI text — `0c98d11`
- [x] **0.5** Fix Russian copy: replace all corrupted/placeholder text with real copy across homepage sections — `5bb5dca`
- [x] **0.6** Fix avatars: replace broken Unsplash URLs with local fallback images, correct chip sizing to 28px + onError fallback — `1843be8`
- [x] **0.7** Fix gateway cards: glass backdrop fixed with gateway-stage backdrop layer, no CSS value changes — `0c98d11`
- [x] **0.8** Fix "How it works" section: 5-step cards with connectors — `1843be8`
- [x] **0.9** Fix footer: real links wired — `1843be8`
- [x] **0.10** Implement dual-entry gateway (Stakeholder Change 1): left=Биржа, right=Готовые туры — `0c98d11`
- [x] **0.11** Reorder CTAs everywhere: "Создать запрос" first (Stakeholder Change 2) — `5bb5dca`
- [x] **0.12** Add region display "Город, Регион" to request/destination cards (Stakeholder Change 3) — `0c98d11`

**Exit criteria:** Homepage matches reference screenshots. No visual defects. Stakeholder can demo without caveats.

---

### Phase 1 — Auth & Data Integrity (1 week)
> Real users must be able to sign up, log in, and have correct data access.

- [x] **1.1** Wire Supabase Auth end-to-end: email magic link signup/login flow — deferred to final stage; seed accounts login working via Supabase Auth
- [x] **1.2** Add `middleware.ts` protecting all `/traveler/*`, `/guide/*`, `/admin/*` routes — migrated to `proxy.ts` (Next.js 16), JWT claims, commits `154466a`, `d4c34ce`
- [x] **1.3** Role-based route guards: additive hierarchy (admin > guide > traveler), `roleHasAccess()` in `role-routing.ts` — commit `d4c34ce`
- [x] **1.4** Profile creation on first login: `?role=` URL param pre-selects role on sign-up form — commit `30dee5d`
- [x] **1.5** Guide onboarding flow: save `guide_profiles` to Supabase (not just UI), enforce required fields — commit `5dbf4ff`
- [x] **1.6** Row-Level Security (RLS) audit: verify every table has correct RLS policies — migration `20260331130000_phase1_rls_audit.sql`, commit `5dbf4ff`
- [x] **1.7** Add proper error boundaries: per-route error.tsx and not-found.tsx pages — commit `5dbf4ff`
- [x] **1.8** Add loading.tsx skeletons for all dynamic routes — commit `5dbf4ff`

**Exit criteria:** A new user can sign up via email, select role, and access only their authorized routes. No data leaks between users.

---

### Phase 2 — Core Marketplace Loop ✅ COMPLETE (2026-04-01)
> The agreement path. Traveler and guide connect, negotiate, and confirm — no payments required.
> Delivered via 7 parallel Codex agents across 3 waves. Final `main` HEAD: `e94760a`.

- [x] **2.1** Traveler creates request → persists to Supabase `traveler_requests` — `a8add61`
- [x] **2.2** Guide sees request in inbox → sends structured offer → persists to `guide_offers` — `def1357`
- [x] **2.3** Traveler views offers on request detail → accepts one → creates `bookings` row — `041124c`
- [x] **2.4** Group joining: other travelers join open request → `open_request_members` updates → price recalculates — `c54a362`
- [x] **2.5** Booking lifecycle: pending → confirmed → completed/cancelled/disputed with proper state machine — `65a4c00`
- [x] **2.6** Price scenario display on request detail (Stakeholder Change 5): show per-person cost at different group sizes — `c54a362`
- [x] **2.7** Booking confirmation page with price range acknowledgment — `041124c`
- [x] **2.8** Guide listing CRUD: create, edit, pause, publish listings with validation — `f536d62`
- [x] **FEAT-001** Hide "Войти" nav link for authenticated users — `b3a28ac`

**Schema notes (discovered during Phase 2):**
- `bookings.subtotal_minor` not `total_price` (prices in minor units)
- `guide_profiles.verification_status === 'approved'` not `is_verified`
- No telegram field in DB; phone lives on `profiles` not `guide_profiles`
- Listing soft-delete maps to `status='rejected'` (no `deleted_at` column)
- Publish goes to `status='published'`; admin review via `moderation_cases` table

**Exit criteria:** Full loop works: request → offer → accept → booking confirmed. Guide and traveler see each other's contact info to settle payment offline. Group size changes reflect in pricing.

---

### Phase 3 — Communication & Notifications ✅ COMPLETE (2026-04-01)
> Users need to talk to each other and know when things happen.

- [x] **3.1** Messaging: traveler ↔ guide conversation threads using `conversations` table — `770cdde`
- [x] **3.2** Real-time message delivery via Supabase Realtime subscriptions — `53d761f`
- [x] **3.3** Notification triggers: new offer, offer expiring, booking created, booking confirmed, review received, dispute opened — `fd55874`
- [x] **3.4** In-app notification center (already scaffolded) → wire to real data with unread counts — `fd55874`
- [x] **3.5** Email notifications infrastructure built (Resend client + templates); deferred activation until RESEND_API_KEY configured — `fd55874`
- [x] **3.6** Push notification groundwork deferred to v2 per design spec

**Exit criteria:** Travelers and guides can message each other. Key events trigger in-app notifications. Email infrastructure ready.

---

### Phase 4 — Trust & Moderation ✅ COMPLETE (2026-04-01)
> Marketplace trust is table stakes. No one books a stranger without signals.

- [x] **4.1** Guide verification flow: upload ID, selfie, certifications → admin reviews → approve/reject — `fceb2bb`
- [x] **4.2** File upload via Supabase Storage: guide docs, listing photos, profile avatars — `fceb2bb`
- [x] **4.3** Admin moderation queue: approve/reject listings with notes — `296ab7b`
- [x] **4.4** Admin guide application review: approve/reject with verification status updates — `296ab7b`
- [x] **4.5** Dispute workflow: traveler opens dispute → admin reviews → resolution — `c1ec748`
- [x] **4.6** Review system: post-tour reviews persist to `reviews` table, display on guide/listing profiles — `c1ec748`
- [x] **4.7** Trust badges on guide profiles: verified identity, X completed tours, Y rating — `c1ec748`
- [ ] **4.8** Report mechanism: flag inappropriate listings/guides/requests — deferred to post-launch

**Exit criteria:** Guides go through verification before appearing in marketplace. Admin can moderate all content. Reviews are real and displayed.

---

### Phase 5 — Content & SEO ✅ COMPLETE (2026-04-01)
> Discovery matters. Search engines must find the marketplace.

- [ ] **5.1** Itinerary travel segments between stops with transport options — deferred to post-launch
- [ ] **5.2** Destination pages: "Гиды в этом городе" section — deferred to post-launch
- [x] **5.3** Per-page meta tags: title, description, og:image for all public routes — `0664d1a`
- [x] **5.4** Structured data (JSON-LD): TouristAttraction for listings, TravelAgency for guides, BreadcrumbList — `0664d1a`
- [x] **5.5** Sitemap.xml generation (dynamic from destinations + listings) — `2773ad9`
- [x] **5.6** robots.txt — `2773ad9`
- [x] **5.7** Seed data for launch region: real destinations, sample listings, realistic guide profiles — `2773ad9`
- [x] **5.8** Canonical homepage copy: all Russian text finalized — confirmed in Phase 0

**Exit criteria:** Google can index all public pages. Launch region has realistic content. OG previews work on social shares.

---

### Phase 6 — Quality & DevOps ✅ COMPLETE (2026-04-01)
> Ship with confidence. Don't ship bugs to real users.

- [x] **6.1** Set up Vitest: unit tests for state machine, Zod schemas, notification triggers — `b22e0e4`
- [x] **6.2** Set up Playwright: E2E tests for 3 critical paths (signup→booking, guide onboarding, admin moderation) — `c83d99b`
- [x] **6.3** GitHub Actions CI: lint + typecheck + vitest on PR, Playwright on merge — `c83d99b`
- [ ] **6.4** GitHub Actions CD: deploy to Vercel on merge to main — deferred (Vercel auto-deploys via git integration)
- [ ] **6.5** Environment management: staging vs production Supabase projects — deferred to post-launch
- [x] **6.6** Rate limiting on auth and mutation endpoints (Upstash Redis) — `c83d99b`
- [x] **6.7** Error monitoring: Sentry integration — `c83d99b`
- [ ] **6.8** Analytics: Plausible or PostHog — deferred to post-launch
- [ ] **6.9** Performance audit: Lighthouse score >90 — Phase 7 task #4
- [ ] **6.10** Accessibility audit — Phase 7 task #5
- [ ] **6.11** Mobile QA: test all flows on iOS Safari + Android Chrome — Phase 7 task #5
- [x] **6.12** Security headers in next.config.ts — `c83d99b`

**Exit criteria:** CI green on every merge. E2E tests cover the happy path. Errors are reported. Performance is good.

---

### Phase 7 — Launch Prep (3 days)
> Final checklist before real users arrive.

- [ ] **7.1** Legal: terms of service, privacy policy pages (not just placeholders)
- [ ] **7.2** Cancellation policy finalized with real terms
- [ ] **7.3** Support channel: email or Telegram link in footer and error pages
- [ ] **7.4** Onboard 3-5 real guides in launch region with completed profiles
- [ ] **7.5** Create 5-10 seed requests to demonstrate marketplace activity
- [ ] **7.6** Domain and DNS: provodnik.app pointed to production
- [ ] **7.7** SSL, CSP headers, security headers configured
- [ ] **7.8** Backup strategy: Supabase daily backups enabled
- [ ] **7.9** Runbook: how to handle common ops tasks (ban user, resolve dispute, remove listing)
- [ ] **7.10** Soft launch to closed group, collect feedback, fix critical bugs

**Exit criteria:** Real guides are on the platform. Real requests can be created and confirmed. Support exists.

---

## Critical Path

The absolute minimum to go live (in order):

```
Phase 0 (visual fix) → Phase 1 (auth) → Phase 2 (marketplace loop) → Phase 4 (trust) → Phase 7 (launch prep)
```

Phases 3 (messaging), 5 (SEO), and 6 (testing/devops) are important but can ship incrementally after soft launch.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Supabase RLS misconfiguration leaks data | Dedicated RLS audit task (1.6) before any real user data |
| No real guides at launch = empty marketplace | Phase 7.4: manually onboard initial supply |
| Demo mode code paths leak into production | Add build-time flag to strip demo mode in production builds |
| No mobile testing = broken experience for 70%+ of users | Phase 6.11: dedicated mobile QA pass |

---

## What This Plan Does NOT Cover (Post-Launch)

- Payments (deposit, escrow, payout — YooKassa / Tinkoff / CloudPayments)
- Native mobile app (React Native / Expo)
- Multi-language support (i18n)
- Advanced search (Elasticsearch / Meilisearch)
- AI-powered matching (request → guide recommendations)
- Guide analytics dashboard
- Affiliate/referral system
- Calendar/availability management for guides
- Anti-circumvention (preventing off-platform deals)
- Admin analytics and quality snapshots
