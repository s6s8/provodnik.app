# Tripster v1 — Full Replication Design Spec

**Date:** 2026-04-12
**Status:** Approved — execution in progress
**Owner:** Orchestrator (native Claude agents + cursor-agent primary coder)
**Research basis:** `.claude/research/tripster/00-07*.md`
**Scope lock:** 2026-04-11 (v1 constraints), expanded 2026-04-12 (no deferrals)

---

## 0. Endgoal

Replicate Tripster's full traveler + guide product surface in Provodnik, adjusted for Provodnik's v1 commercial constraints (no payments, no deposits, bid-first with mandatory guide confirmation, no cancellation, 0% commission). Every functional surface documented in the `00-07*` research bundle ships in v1 — nothing is deferred to v1.1.

## 1. Guiding principles

- **Feature flag `FEATURE_TRIPSTER_V1`** is the kill-switch through Phase 13. 12 sub-flags (`FEATURE_TRIPSTER_TOURS`, `FEATURE_TRIPSTER_KPI`, `FEATURE_TRIPSTER_NOTIFICATIONS`, `FEATURE_TRIPSTER_REPUTATION`, `FEATURE_TRIPSTER_PERIPHERALS`, `FEATURE_TRIPSTER_HELP`, `FEATURE_TRIPSTER_FAVORITES`, `FEATURE_TRIPSTER_PARTNER`, `FEATURE_TRIPSTER_REFERRALS`, `FEATURE_TRIPSTER_QUIZ`, `FEATURE_TRIPSTER_DISPUTES`, `FEATURE_DEPOSITS`) allow surfaces to flip independently during QA.
- **One editor shell, eight listing-type branches.** A `SECTIONS_BY_TYPE` map drives sidebar + router guard. No three-editor-copies anti-pattern.
- **Two detail templates for listings.** `excursion-shape` serves 6 types (excursion, waterwalk, masterclass, photosession, quest, activity). `tour-shape` serves tours. Transfer gets its own slim template.
- **Locked v1 commercial rules hold.** No payments, no deposits visible, bid-first, no cancellation, 0% commission. `deposit_rate` column lands for forward-compatibility but UI stays hidden behind `FEATURE_DEPOSITS` (off).
- **Cursor-agent is primary coder**, dispatched via `.claude/logs/cursor-dispatch.mjs`. Native Claude agents orchestrate, review, and handle anything that previously hit ERR-011/012 (Wave D pattern).
- **Sequential phases, parallel waves.** No aggressive phase overlap — lower merge-conflict risk chosen over shaved calendar days.

## 2. Architectural decisions (new ADRs on top of 012–027)

| ADR | Decision |
|---|---|
| 028 | `SECTIONS_BY_TYPE` single source of truth for editor branching; leaves share a `{listing, draft, onChange}` contract |
| 029 | Two listing detail templates (`excursion-shape`, `tour-shape`) plus transfer — NOT eight templates |
| 030 | KPI strip uses Tremor (local React charts), NOT DataLens embed — data sovereignty + no external dep |
| 031 | Notifications delivered via pg_cron worker reading `notifications` table; no separate queue service |
| 032 | 4-axis review ratings stored in `review_ratings_breakdown`; `reviews.rating` is the denormalized overall for list queries |
| 033 | Review replies are moderated: `draft → pending_review → published`; admin moderation surface reused from listings moderation |
| 034 | Dual rating aggregation: `listings.average_rating` and `guide_profiles.average_rating` maintained by two separate pg_cron jobs with advisory locks |
| 035 | Notification prefs are a 3D matrix: event × channel × frequency, stored as `notification_prefs jsonb` on `guide_profiles` and `traveler_profiles` |

## 3. Schema (Phase 1 megamigration)

Single migration `supabase/migrations/20260413000001_tripster_v1.sql`. Additive only — no destructive DDL. Rollback script ships alongside.

### 3.1 `listings` additive columns

```sql
ALTER TABLE listings ADD COLUMN IF NOT EXISTS exp_type text CHECK (exp_type IN (
  'excursion','waterwalk','masterclass','photosession','quest','activity','tour','transfer'
));
ALTER TABLE listings ADD COLUMN IF NOT EXISTS format text CHECK (format IN ('group','private','combo'));
ALTER TABLE listings ADD COLUMN IF NOT EXISTS movement_type text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS currencies text[] DEFAULT '{RUB}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS idea text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS route text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS theme text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS audience text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS facts text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS org_details jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS difficulty_level text CHECK (difficulty_level IN ('easy','medium','hard','extreme'));
ALTER TABLE listings ADD COLUMN IF NOT EXISTS included text[] DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS not_included text[] DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS accommodation jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deposit_rate numeric(4,3) DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pickup_point_text text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS dropoff_point_text text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS vehicle_type text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS baggage_allowance text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pii_gate_rate numeric(4,3) DEFAULT 0.60;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS booking_cutoff_hours int DEFAULT 24;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS event_span_hours int;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS instant_booking boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS review_count int DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('draft','pending_review','active','rejected','archived')) DEFAULT 'draft';
```

### 3.2 `guide_profiles` additive columns

```sql
ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS legal_status text CHECK (legal_status IN ('self_employed','individual','company'));
ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS inn text;
ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS document_country text;
ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS is_tour_operator boolean DEFAULT false;
ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS tour_operator_registry_number text;
ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0;
ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS response_rate numeric(4,3) DEFAULT 0;
ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS review_count int DEFAULT 0;
ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS contact_visibility_unlocked boolean DEFAULT false;
ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS locale text DEFAULT 'ru';
ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'RUB';
ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS notification_prefs jsonb DEFAULT '{}'::jsonb;
```

### 3.3 New tables (15)

- `listing_days(listing_id, day_number, title, body, date_override)` — tour itinerary
- `listing_meals(listing_id, day_number, meal_type, status, note)` — tour meal grid
- `listing_tour_departures(id, listing_id, start_date, end_date, price_minor, currency, max_persons, status)` — tour fixed departures (replaces weekly schedule for tours)
- `listing_tariffs(id, listing_id, label, price_minor, currency, min_persons, max_persons)`
- `listing_schedule(id, listing_id, weekday, time_start, time_end)` — weekly template
- `listing_schedule_extras(id, listing_id, date, time_start, time_end)` — one-off overrides
- `listing_licenses(listing_id, license_id, scope)` — many-to-many guide licenses ↔ listings
- `listing_photos(id, listing_id, url, position, alt_text)` — ordered gallery
- `listing_videos(id, listing_id, url, poster_url, position)`
- `review_ratings_breakdown(review_id, axis, score)` — 4-axis breakdown (material/engagement/knowledge/route)
- `review_replies(id, review_id, guide_id, body, status, submitted_at, published_at)` — moderated
- `favorites_folders(id, user_id, name, position)` and `favorites_items(folder_id, listing_id, added_at)`
- `notifications(id, user_id, event_type, payload, channel, status, created_at, read_at)`
- `referral_codes(id, user_id, code, created_at)`, `referral_redemptions(code_id, redeemed_by, redeemed_at)`, `bonus_ledger(id, user_id, delta, reason, ref_id, created_at)`
- `help_articles(id, slug, category, title, body_md, position)`
- `partner_accounts(id, user_id, api_token_hash, created_at)`, `partner_payouts_ledger(id, partner_id, delta, ref_id, created_at)`
- `disputes(id, booking_id, opened_by, status, resolution, opened_at, resolved_at)` and `dispute_events(id, dispute_id, actor_id, event_type, payload, created_at)`

### 3.4 Views

- `v_listing_card` — grid/list page
- `v_listing_detail_excursion` — 6 types share this
- `v_listing_detail_tour` — tour-shape
- `v_guide_public_profile` — with dual rating + review count
- `v_guide_dashboard_kpi` — KPI strip aggregation

### 3.5 RLS

Every new table gets a policy set following the `listings` RLS template:
- Public read for active/published rows where appropriate
- Owner-only write
- Admin-role override via `auth.jwt()->>'role'`

### 3.6 Rollback

`supabase/migrations/20260413000001_tripster_v1_rollback.sql` — drops new tables, drops new columns, drops views. Runs clean in staging snapshot test.

## 4. The 14 phases

### Phase 0 — Pre-flight (0.5d · 1 agent)

- Wire `FEATURE_TRIPSTER_V1` + 12 sub-flags in `lib/flags.ts` and middleware
- Baseline test suite + coverage snapshot → METRICS.md
- Create branch `feat/tripster-v1` + 32 worktree stubs under `.claude/worktrees/tripster-v1/`
- Delete drafts 115870/115871/115872 from officekg@yandex.ru guide account
- Tag `checkpoint/tripster-v1-phase-0-baseline`
- Production DB snapshot backup via Supabase API

### Phase 1 — Schema megamigration (2d · 3 agents parallel)

- **1.1** Write migration `20260413000001_tripster_v1.sql` per §3
- **1.2** Write rollback script + dry-run against staging snapshot
- **1.3** Regenerate TypeScript types + Zod schemas

### Phase 2 — State machines (1.5d · 3 agents parallel)

- **2.1** Request/offer SM: `lib/requests/state-machine.ts` — legal transitions + DB trigger + backfill
- **2.2** Review SM: draft → submitted → published; reply draft → pending_review → published
- **2.3** Moderation SM: draft → pending_review → active|rejected, edit → pending_review, audit log

### Phase 3 — PII gate + contact visibility (1d · 2 agents parallel)

- **3.1** `lib/pii/mask.ts` — regex strips phone/email/telegram/whatsapp/vk; unit tests cover all Russian number formats
- **3.2** DB trigger auto-flips `contact_visibility_unlocked` when `average_rating >= 4.0 AND response_rate >= 0.60` (ADR-020); status chip + settings explanation page

### Phase 4 — Editor megawave — all 8 listing types (9d · 12 agents across 12 waves)

| Wave | Scope | WT |
|---|---|---|
| 4.1 | `ListingEditor` shell, sidebar, `SECTIONS_BY_TYPE` map, router guard, draft autosave, preview, publish gate | 1 |
| 4.2 | Shared leaves (photos, MeetingPointPicker with Yandex Maps JS, weekly schedule, extras, tariffs, pricing, languages, movement, children, max persons, org details, facts, audience) | 3 |
| 4.3 | Excursion branch (Idea/Route/Theme + completeness check) | 1 |
| 4.4 | Waterwalk branch | 1 |
| 4.5 | Masterclass branch | 1 |
| 4.6 | Photosession branch (exp_type=`photosession`, 4 sub-steps) | 1 |
| 4.7 | Quest branch (6 description sub-steps) | 1 |
| 4.8 | Activity branch | 1 |
| 4.9 | Transfer branch (pickup/dropoff pins, vehicle, baggage, Темы, weekly schedule) | 1 |
| 4.10 | Tour branch A — itinerary (`TourDaysEditor`, `TourAccommodationEditor`, `TourDifficultyPicker`, `TourIncludedEditor`) | 1 |
| 4.11 | Tour branch B — programme grids (`TourMealsGridEditor`, `TourTransportEditor`, `TourVideosEditor`) | 1 |
| 4.12 | Tour branch C — departures + registry gate (`TourDeparturesEditor`, tour-operator registry publish gate, deposit % field behind `FEATURE_DEPOSITS`) | 1 |

### Phase 5 — Traveler surfaces (5d · 7 agents across 6 waves)

| Wave | Scope |
|---|---|
| 5.1 | Home: single-input hero search, "Популярные направления" dropdown, featured grid |
| 5.2 | Destination page: grid, filter chips (duration/price/movement/format/language/difficulty), sort, pagination |
| 5.3 | Excursion-shape detail template (6 types share) — Idea/Route/Theme/Facts/Audience/Tariffs/WeeklySchedule/Reviews + dual rating + cross-sell |
| 5.4 | Tour detail template — itinerary, accommodation, meals, transport, difficulty, included/not_included, fixed departures, videos, tour-operator trust chip |
| 5.5 | Transfer detail template — pickup/dropoff map, vehicle, capacity, baggage, single price, cross-sell to excursions |
| 5.6 | Booking form w/ tabs (Заказать / Задать вопрос); inquiry = booking minus calendar + "Вопросы и комментарии" textarea |

### Phase 6 — Thread, system events, offers, disputes (2d · 3 agents)

- **6.1** `messages.system_event_type` + `system_event_payload jsonb`; inline renderers for `offer_sent`/`offer_accepted`/`booking_confirmed`/`moderation_rejected`/`review_request`/`dispute_opened`/`dispute_resolved`
- **6.2** Offer card renderer w/ accept/decline + counter-offer flow
- **6.3** Dispute thread UI — traveler opens dispute, admin-visible thread w/ read-only inspection + resolution actions

### Phase 7 — Moderation queue + rejection cards (1.5d · 2 agents)

- **7.1** `/admin/moderation` queue reading `status = 'pending_review'`; bulk actions; canned rejection reasons
- **7.2** Listings card-only rejection surface (no in-editor banner); reply moderation (Отправить на проверку → admin approves → published)

### Phase 8 — Profile sub-pages (1.5d · 3 agents parallel)

- **8.1** `/profile/personal/` — email/phone/locale/currency/timezone/notification-prefs 3D matrix UI
- **8.2** `/profile/guide/legal-information/` — status enum, INN, 252-country document-issuing select
- **8.3** `/profile/guide/license/` — license CRUD w/ many-to-many scope input "Все предложения"
- **8.4** Contact-visibility status page explaining the 60% gate

### Phase 9 — Guide dashboard + management surfaces (3d · 5 agents across 5 waves)

| Wave | Scope |
|---|---|
| 9.1 | KPI strip (Tremor charts): views/requests/offers/bookings/rating/response-rate |
| 9.2 | Statistics page w/ time-series charts + date-range picker |
| 9.3 | Orders inbox: segmented tabs (new/active/completed/archived) + bulk actions |
| 9.4 | Calendar: weekly + monthly views, schedule overrides, departure management |
| 9.5 | Listings management: status filter, quick-edit, bulk publish/unpublish |

### Phase 10 — Notifications (1.5d · 2 agents parallel)

- **10.1** Header bell popover reading `notifications`; inline nav badges per section
- **10.2** 3D preference matrix UI at `/profile/personal/notifications`; pg_cron delivery worker writing to `notifications` + dispatching email/telegram via existing scripts

### Phase 11 — Reputation (2d · 3 agents parallel)

- **11.1** Review submission flow w/ 4-axis rating input (Материал/Заинтересовать/Знания/Маршрут + overall)
- **11.2** Dual aggregation jobs: pg_cron for `listings.average_rating` and `guide_profiles.average_rating` with advisory locks
- **11.3** Reviews list w/ 3-bucket star filter + 4-axis breakdown UI on listing detail + guide public profile + reply composer hooked into Phase 7 moderation

### Phase 12 — Peripheral surfaces (2.5d · 6 agents parallel)

- **12.1** Help center: single-page FAQ reading `help_articles`, anchor deep-links, client-side search, 5 traveler categories + guide section
- **12.2** Favorites + folders: folder CRUD, add-to-folder picker, folder view
- **12.3** Partner cabinet `/partner/`: API token management, payout ledger, referral stats
- **12.4** Referrals + bonuses: code generation, redemption flow, bonus ledger display
- **12.5** Guide quiz / onboarding wizard: multi-step, quiz questions, completion tracking
- **12.6** Cross-sell transfer widget on excursion/tour detail pages

### Phase 13 — QA + rollout (2d · 1 agent + manual)

- Playwright happy paths: create each of 8 listing types + send request + send offer + confirm booking + post 4-axis review + moderated reply + dispute flow
- Schema migration dry-run on staging snapshot
- Full RLS policy audit
- Pre-merge security scan per orchestrator protocol §10
- Flag rollout: internal → 10% → 50% → 100% in order editor → traveler → notifications → reputation → peripherals

## 5. Sizing

| Metric | Value |
|---|---|
| Phases | 14 |
| Waves | ~42 |
| Worktrees | ~32 |
| Agent dispatches | ~55 |
| Wall-clock (sequential phases, parallel waves) | ~30 working days (~6 weeks) |
| New DB tables | 15 |
| New/modified routes | ~45 |
| New/modified components | ~120 |
| New/modified migrations | 1 big + 1 rollback |

## 6. Dependency graph

```
P0 → P1 → P2 → P3 ┐
              ├─→ P4 (editor, 12 waves)
              ├─→ P5 (traveler, 6 waves)
              ├─→ P6 (threads) ─→ P7 (moderation)
              ├─→ P8 (profile)
              ├─→ P9 (dashboard)
              ├─→ P10 (notifications) ─┐
              ├─→ P11 (reputation) ────┼─→ P13 (QA + rollout)
              └─→ P12 (peripherals) ───┘
```

## 7. Risks + mitigations

1. **Schema megamigration irreversible in practice** → full dry-run on staging snapshot; rollback script tested; tagged checkpoint before merge
2. **Editor branch count (8 types) × leaves = combinatorial prompt budget** → `SECTIONS_BY_TYPE` centralization + shared leaves in wave 4.2 eliminates ~60% of duplication
3. **Tour data model iteration risk** → `FEATURE_TRIPSTER_TOURS` sub-flag; dogfood with 2 real tours before public rollout
4. **Notification delivery at scale** → pg_cron + rate-limiting; dead-letter rows in `notifications.status = 'failed'`
5. **Moderation backlog** → bulk actions + canned reasons; admin capacity monitored in KPI strip
6. **Review aggregation races** → separate pg_cron jobs w/ advisory locks (ADR-034)
7. **Locale/currency scope creep** → RU/EN + RUB/USD/EUR only in v1; tested in 5.1 first
8. **Cursor-agent context budget** → 8k token cap; complex leaves split; Wave D (native agents) for any wave that re-hits ERR-011/012
9. **Feature flag sprawl** → all 12 sub-flags in one `lib/flags.ts`; rollout doc in SOT
10. **Parallel wave merge conflicts** → sequential phases enforced; no aggressive cross-phase parallelism

## 8. Execution mandate

After this spec is committed:

1. Spec self-review (placeholder scan, consistency, scope, ambiguity) — fix inline
2. Invoke `writing-plans` skill to break every wave into cursor-agent-ready task briefs (one markdown prompt file per wave, ~42 files in `.claude/prompts/tripster-v1/`)
3. Execute Phase 0 → Phase 13 autonomously per orchestrator §8 workflow: worktrees, waves, two-stage review, merges, SOT updates, checkpoint tags after each phase
4. Post-work protocol after every merge (merge → push → migrations → dev-notes → SOT → Telegram → memory)
5. Escalation only on 3× failure of same task or coverage drop >5%

**Commercial constraints v1 (unchanged):** no payments, no deposits, bid-first, no cancellation, 0% commission.

**Parallelism policy:** sequential phases, parallel waves inside each phase. No aggressive cross-phase parallelism (user directive 2026-04-12).

## 9. Completion definition

v1 ships when:

- All 14 phases merged to `main`
- All Playwright happy paths green
- Coverage has not decreased vs Phase 0 baseline
- `FEATURE_TRIPSTER_V1` at 100% in production
- All 12 sub-flags in their intended v1 state
- Rollback script verified on staging
- SOT files (METRICS.md, ERRORS.md, DECISIONS.md, NEXT_PLAN.md) reflect the shipped state
