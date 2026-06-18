# Immersive Request-Detail Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the navy/amber/green + Onest "Clean Trust" theme the canonical, systematic Tailwind-v4 + shadcn token system, and rebuild the traveler **owner** view of `/requests/[requestId]` pixel-faithfully to the "Immersive" handoff as the reference design for all future pages.

**Architecture:** Three token layers — raw palette (hex literals live here only) → semantic tokens (existing names repointed, zero consumer churn) → `@theme inline` Tailwind utilities → shadcn primitive variants. Components consume *semantic utilities only* (never raw hex). The request page is assembled from new reusable primitives (`ImmersiveHero`, `TripPanel`, `GuideOfferCard`, `StickyActionBar`, `AvatarStack`) so other pages reuse them. Guide-card data comes from a single additive `CREATE OR REPLACE VIEW` on `v_guide_public_profile` (no table alter → no `search_guides` rowtype landmine).

**Tech Stack:** Next.js 16 (App Router, Turbopack), Tailwind v4 (`@theme inline` in `globals.css`), shadcn/ui (CVA), Supabase (shared prod DB), bun, vitest, lucide-react, `next/font/google` (Onest).

## Global Constraints

- **Local repo:** `D:\dev2\projects\provodnik` (working in worktree `.claude/worktrees/immersive-request-detail`, branch `worktree-immersive-request-detail`; merged back to the main checkout at completion). Runtime: `bun`. Verify with `bun run typecheck`, `bun run test:run`, `bun dev`.
- **Shared prod DB:** `.env.local` → prod Supabase `yjzpshutgmhxizosbeef`. **The view migration (Task 5) alters production. Do NOT apply it until the user explicitly approves.** Apply via `scripts/apply-migration-via-management-api.mjs` (token `~/.supabase/access-token`). Writing the `.sql` files is safe; applying is gated.
- **Zero fabrication (CLAUDE.md §8):** No invented numbers/people. The handoff's decorative "+7 уже выбрали" social-proof avatars and fake joined faces are **NOT** to be reproduced with fake data. Render only real data (real `open_request_members` for joined avatars); omit any element with no real source.
- **No orphan data:** Every guide-card field that is *user-entered* must already have an input. (Verified: `years_experience`, `avatar_url`, `languages`, `specialties/specializations`, `bio`, `base_city`, `regions` all already have inputs in `guide-about-form.tsx`. `trips_completed`/`recommend_pct` are computed, not entered. So **no new input UI is required** — but if any future field is added, add its input in the same task.)
- **Token discipline:** Raw hex literals appear **only** in the Layer-1 palette block in `globals.css`. Every component/className uses semantic utilities (`bg-primary`, `text-muted-foreground`, `bg-surface`, `text-success`, `border-border`, etc.). No `#hex`, no `bg-[#...]` in `.tsx`.
- **Russian UI.** All copy in Russian, matching existing strings.
- **Design source of truth:** `C:\Users\x\Downloads\Redesigning an overwhelming page\design_handoff_immersive_request_detail\Request Detail - Immersive.dc.html` (+ its README). Exact hex/sizes/spacing/copy listed there; mirror them via tokens.
- **Preserve owner behavior** (the 2026-06-17 fixes): accept → `/bookings/[id]` (no 404, correct `party_size`); contact reveal gated to acceptance; counter-offer deviation chips; route-stops gallery; inclusions; Q&A; pending/declined/accepted states.

---

## Token color reference (Layer 1 palette — used by Task 2)

```
Navy (primary):   500 #1A56A4 · 600 #15467F (hover) · 700 #113A6A
Amber (accent):   400 #D4872B
Green (success):  500 #2F8F66 · tint rgba(47,143,102,.12)
Neutrals:         ink #141C28 · body #414B59 · muted #8A93A1 · faint #AEB6C2
Canvas/surface:   canvas #FAFAF9 · surface #FFFFFF · surface-2 #F4F4F2
Hairlines:        rgba(20,28,40,.08) · rgba(20,28,40,.12)
Selection:        rgba(26,86,164,.16)
```

---

# Workstream 1 — Canonical theme + font (systematic Tailwind + shadcn)

### Task 1: Load Onest, retire Rubik/dead font refs

**Files:**
- Modify: `src/app/layout.tsx:1-18,50`

**Interfaces:**
- Produces: CSS var `--font-onest` on `<html>`; `--font-geist-mono` retained.

- [ ] **Step 1:** In `src/app/layout.tsx`, replace the `Rubik` import/instance with Onest:

```ts
import { Geist_Mono, Onest } from "next/font/google";

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-onest",
});
```

- [ ] **Step 2:** Update `<html className={...}>` to `` `${onest.variable} ${geistMono.variable}` `` (drop `rubik.variable`). Keep `<body className="font-sans antialiased">`.

- [ ] **Step 3:** Run `bun run typecheck` → exit 0. Run `bun dev`, load `/`, confirm Onest renders (Cyrillic glyphs present, not a serif fallback).

- [ ] **Step 4:** Commit: `feat(theme): load Onest, retire Rubik`

### Task 2: Systematic 3-layer token system in globals.css

**Files:**
- Modify: `src/app/globals.css:6-209`

**Interfaces:**
- Produces: repointed semantic tokens (same names, navy/amber/green/neutral values) consumed by every existing `bg-*/text-*/border-*` utility. No consumer edits needed.

- [ ] **Step 1:** In the `@theme inline` block, set all font vars to Onest and add two semantic color aliases:

```css
--font-sans:    var(--font-onest);
--font-serif:   var(--font-onest);
--font-display: var(--font-onest);
--font-mono:    var(--font-geist-mono);
/* add (alongside existing --color-* mappings): */
--color-success: var(--success);
--color-amber:   var(--gold);
```
Keep the existing `--color-*` → `var(--token)` mappings unchanged; they auto-recolor.

- [ ] **Step 2:** Replace the `:root` body with the **3-layer** structure below. Layer 1 = raw palette (the ONLY hex). Layer 2 = semantic tokens repointed (names unchanged). Every value is real — no placeholders:

```css
:root {
  /* ───────── Layer 1: raw palette (hex literals live ONLY here) ───────── */
  --navy-50:#EAF1FA; --navy-100:#D3E2F3; --navy-200:#A6C4E7; --navy-300:#7AA5DA;
  --navy-400:#4A7FC4; --navy-500:#1A56A4; --navy-600:#15467F; --navy-700:#113A6A;
  --navy-800:#0E2F57; --navy-900:#0A2543; --navy-950:#061827;
  --amber-50:#FBF3E8; --amber-100:#F5E2C8; --amber-200:#ECC593; --amber-300:#E2A65C;
  --amber-400:#D4872B; --amber-500:#B26F1E; --amber-600:#8F5817;
  --green-50:#E9F5EF; --green-100:#CFE9DD; --green-500:#2F8F66; --green-600:#27764F;
  --ink:#141C28; --body:#414B59; --muted-ink:#8A93A1; --faint:#AEB6C2;
  --canvas:#FAFAF9; --surface-white:#FFFFFF; --surface-2:#F4F4F2;
  --hairline:rgba(20,28,40,.08); --hairline-2:rgba(20,28,40,.12);

  /* ───────── Layer 2: semantic tokens (existing names, repointed) ───────── */
  --nav-h: 88px;
  --primary: var(--navy-500);
  --primary-hover: var(--navy-600);
  --surface: var(--canvas);
  --surface-low: var(--surface-2);
  --surface-lowest: var(--surface-white);
  --on-surface: var(--ink);
  --on-surface-muted: var(--muted-ink);
  --outline-variant: var(--hairline);
  --footer-bg: var(--navy-950);

  --glass-bg: rgba(255,255,255,.97);
  --glass-border: var(--hairline);
  --glass-blur: blur(12px);
  --glass-shadow: 0 26px 56px -22px rgba(8,14,24,.30);
  --glass-radius: 16px;
  --card-shadow: 0 1px 2px rgba(20,28,40,.04);
  --card-radius: 16px;
  --radius-btn: 10px;

  --font-display: var(--font-onest);
  --font-ui: var(--font-onest);
  --font-serif: var(--font-onest);
  --font-mono: var(--font-geist-mono);

  --success: var(--green-500);
  --warning: var(--amber-400);

  --max-w: 1160px;
  --sec-pad: 80px;
  --px: clamp(20px, 4vw, 32px);

  --brand: var(--primary);
  --brand-light: var(--navy-50);
  --brand-mid: var(--navy-400);
  --ink-2: var(--body);
  --ink-3: var(--muted-ink);
  --surface-high: var(--surface-lowest);
  --nav-glass-bg: rgba(255,255,255,.85);
  --nav-glass-border: var(--hairline);

  /* amber = the single warm accent (keeps the --gold-* utility names) */
  --gold: var(--amber-400);
  --gold-foreground:#FFFFFF;
  --gold-hover: var(--amber-500);

  /* brand ramp (navy) — keeps bg-brand-* utilities */
  --brand-50:var(--navy-50);   --brand-100:var(--navy-100); --brand-200:var(--navy-200);
  --brand-300:var(--navy-300); --brand-400:var(--navy-400); --brand-500:var(--navy-500);
  --brand-600:var(--navy-600); --brand-700:var(--navy-700); --brand-800:var(--navy-800);
  --brand-900:var(--navy-900); --brand-950:var(--navy-950);
  /* gold ramp (amber) — keeps bg-gold-* utilities */
  --gold-50:var(--amber-50);   --gold-100:var(--amber-100); --gold-200:var(--amber-200);
  --gold-300:var(--amber-300); --gold-400:var(--amber-400); --gold-500:var(--amber-500);
  --gold-600:var(--amber-600); --gold-700:#6F4512; --gold-800:#52330D;
  --gold-900:#3A2409; --gold-950:#231505;

  --background: var(--surface);
  --foreground: var(--on-surface);
  --card: var(--surface-lowest);
  --card-foreground: var(--on-surface);
  --popover: var(--surface-lowest);
  --popover-foreground: var(--on-surface);
  --secondary: var(--surface-lowest);
  --secondary-foreground: var(--on-surface);
  --muted: var(--surface-low);
  --muted-foreground: var(--on-surface-muted);
  --accent: var(--surface-low);
  --accent-foreground: var(--on-surface);
  --destructive:#C8453B;
  --destructive-foreground:#FFFFFF;
  --border: var(--outline-variant);
  --input: var(--outline-variant);
  --ring: var(--primary);
  --radius: var(--card-radius);
}
```

- [ ] **Step 3:** Update `.dark` to a navy/amber/green family (keep architecture, not a full redesign):

```css
.dark {
  --surface:#0E1726; --surface-low:#15233A; --surface-lowest:#1B2C46;
  --on-surface:#E7EDF5; --on-surface-muted:#94A1B5; --outline-variant:#26344A;
  --footer-bg:#061827;
  --glass-bg:rgba(27,44,70,.92); --glass-border:rgba(255,255,255,.08);
  --nav-glass-bg:rgba(14,23,38,.85); --nav-glass-border:rgba(255,255,255,.08);
  --primary:#4F8BD6; --primary-hover:#6C9FDF; --brand-mid:#6C9FDF; --brand-light:#15233A;
  --ink-2:#C3CDDB; --gold:#E0A14B; --gold-hover:#EAB868; --success:#46A883;
}
```

- [ ] **Step 4:** Update the `::selection` rule (in `@layer base`) to `background: rgba(26,86,164,.16); color: var(--ink);`.

- [ ] **Step 5:** `bun run typecheck` → 0. `bun dev`; smoke `/`, `/listings`, `/guides`, `/trips` — confirm navy primary, amber accents, near-white canvas, Onest everywhere; no layout breakage; no emerald leftovers.

- [ ] **Step 6:** Commit: `feat(theme): systematic 3-layer navy/amber/green token system`

### Task 3: shadcn Button radius + Onest in Tailwind config

**Files:**
- Modify: `src/components/ui/button.tsx:7` (CVA base)
- Modify: `src/components/ui/badge.tsx` (confirm pill radius + normal-case)
- Modify: `tailwind.config.ts:66-70` (fontFamily → Onest)

**Interfaces:**
- Produces: canonical `Button` with 10px radius (`rounded-[var(--radius-btn)]`), navy primary; `Badge` pill `rounded-full`.

- [ ] **Step 1:** In `button.tsx` CVA base, change `rounded-full` → `rounded-[var(--radius-btn)]`. Leave variant colors (resolve from semantic tokens → navy automatically).

- [ ] **Step 2:** In `tailwind.config.ts`, set `fontFamily.sans` and `fontFamily.display` to `["var(--font-onest)", "system-ui", "sans-serif"]`.

- [ ] **Step 3:** `bun run typecheck` → 0. `bun run test:run` → green. Browser-smoke `/listings`: navy 10px-radius buttons.

- [ ] **Step 4:** Commit: `feat(theme): canonical button radius + Onest in tailwind config`

---

# Workstream 2 — Guide-card data (view + query) — DB apply GATED

### Task 4: Write the `v_guide_public_profile` migration + rollback (no apply)

**Files:**
- Create: `supabase/migrations/20260618130000_guide_public_profile_card_fields.sql`
- Create: `supabase/rollbacks/20260618130000_guide_public_profile_card_fields.sql`

**Interfaces:**
- Produces: view columns `avatar_url, years_experience, trips_completed, recommend_pct` appended to `v_guide_public_profile`.

- [ ] **Step 1:** Write the migration. `CREATE OR REPLACE VIEW` appends columns at the end (no drop → no dependents break → no `search_guides` impact). Verified sources: `bookings(guide_id, status)`, `reviews(guide_id, rating 1-5, status)`, `profiles.avatar_url`, `guide_profiles.years_experience`.

```sql
-- Append guide-card display fields to the RLS-safe public profile view.
create or replace view public.v_guide_public_profile as
select
  gp.user_id, gp.slug, p.full_name, gp.bio, gp.regions, gp.languages, gp.specialties,
  gp.average_rating, gp.review_count, gp.response_rate, gp.contact_visibility_unlocked,
  gp.is_available, gp.locale, gp.preferred_currency,
  -- appended:
  p.avatar_url,
  gp.years_experience,
  (select count(*) from public.bookings b
     where b.guide_id = gp.user_id and b.status = 'completed') as trips_completed,
  (select round(100.0 * count(*) filter (where r.rating >= 4) / nullif(count(*),0))
     from public.reviews r
     where r.guide_id = gp.user_id and r.status = 'published') as recommend_pct
from public.guide_profiles gp
left join public.profiles p on p.id = gp.user_id
where gp.verification_status = 'approved';

grant select on public.v_guide_public_profile to anon, authenticated;
```

- [ ] **Step 2:** Write the rollback = the verbatim prior 14-column view from `supabase/migrations/20260528154254_drop_guide_display_name.sql:18-38` + grant.

- [ ] **Step 3:** Eyeball SQL vs `schema.sql`. Do NOT apply yet.

- [ ] **Step 4:** Commit: `feat(db): migration to expose guide-card fields on v_guide_public_profile`

### Task 5: Apply the migration to the shared DB — **USER-GATED**

- [ ] **Step 1:** **Get explicit user approval** (prod DB). On approval: `node scripts/apply-migration-via-management-api.mjs supabase/migrations/20260618130000_guide_public_profile_card_fields.sql`.
- [ ] **Step 2:** **Verify on the live PostgREST API**: `GET /rest/v1/v_guide_public_profile?select=user_id,avatar_url,years_experience,trips_completed,recommend_pct&limit=3` → 200 with new fields. Confirm `search_guides` RPC still 200.
- [ ] **Step 3:** No commit (DB op). Record applied status here.

### Task 6: Extend the owner query + GuideInfo type

**Files:**
- Modify: `src/app/(site)/requests/[requestId]/page.tsx:154-190`
- Modify: `src/features/traveler/components/requests/offer-card.tsx:20-27` (GuideInfo)

**Interfaces:**
- Produces: `GuideInfo` = `{ guide_id, full_name, avatar_url, rating, review_count, verified, years_experience, trips_completed, recommend_pct, languages, specialties }`.

- [ ] **Step 1:** In `getOwnerDetailData`, change the `.select(...)` on `v_guide_public_profile` to `"user_id, full_name, avatar_url, average_rating, review_count, years_experience, trips_completed, recommend_pct, languages, specialties"`.

- [ ] **Step 2:** Update the inline `guideInfoMap` value type + population: `avatar_url: g.avatar_url` and add `years_experience, trips_completed, recommend_pct, languages: g.languages ?? [], specialties: g.specialties ?? []`. Keep `verified: true`.

- [ ] **Step 3:** Update `GuideInfo` in `offer-card.tsx` (+ any shared duplicate). `bun run typecheck` → 0.

- [ ] **Step 4:** Commit: `feat(requests): pull full guide-card fields into owner view`

---

# Workstream 3 — Reusable canonical primitives (`src/components/shared/`)

> Follow the design HTML for spacing/sizes; semantic utilities only. Icons: lucide-react (`MapPin, CalendarDays, Clock, Users, MessageSquare, Check, BadgeCheck, Star`).

### Task 7: Extract `AvatarStack`
**Files:** Create `src/components/shared/avatar-stack.tsx`; Modify `request-card-final.tsx:121-138`.
**Produces:** `AvatarStack({ members:{id,displayName,avatarUrl?,initials}[], max?, size?, overflowCount? })` — overlap circles + `+N` chip.
- [ ] Extract markup; defaults `max=5,size=26`. Replace inline use. `bun run typecheck` + `test:run` green. Commit `refactor(ui): extract reusable AvatarStack`.

### Task 8: `ImmersiveHero`
**Files:** Create `src/components/shared/immersive-hero.tsx`.
**Produces:** `ImmersiveHero({ imageUrl, breadcrumb:{label}[], title, intro, children })` — `relative h-[560px]`, `next/image` fill, bottom gradient, centered `max-w-[1160px] px-8` rail, breadcrumb + H1(68px) + intro bottom-left, `children` bottom-right. Mobile <768: title stacks above full-width panel.
- [ ] Build per README §1–2 (gradient `180deg rgba(8,14,24,.5)….8`). Browser-verify 1160/768/375. Commit `feat(ui): ImmersiveHero primitive`.

### Task 9: `TripPanel` (info-only)
**Files:** Create `src/components/shared/trip-panel.tsx`. Consumes `AvatarStack`.
**Produces:** `TripPanel({ dateLabel, timeLabel, durationLabel?, status:{open,label}, seatsTaken?, seatsTotal?, remainingLabel?, members })` — white glass card; "Детали поездки" rows + Availability (dot+"Группа открыта", "X / Y мест", progress `bg-primary`, real-member `AvatarStack` + "Уже присоединились N человек"). **Availability only if `seatsTotal!=null`**; hide for private. No fake avatars.
- [ ] Build per README §3 (progress = `round(100*taken/total)%`). Browser-verify real data. Commit `feat(ui): TripPanel primitive (info-only, real members)`.

### Task 10: `GuideOfferCard`
**Files:** Create `src/components/shared/guide-offer-card.tsx`. Consumes `GuideInfo`, `GuideOfferRow`.
**Produces:** `GuideOfferCard({ offer, guideInfo, perPersonPriceLabel, selected, onSelect, children })` — 3-col card (`grid-cols-[128px_minmax(0,1fr)_200px] rounded-[16px]`). Col1 portrait + "Местный житель" badge **only if base_city/region matches trip**. Col2 name + "Проверен" chip + (selected)"Ваш выбор"; role = `languages.join(', ')` + (years? ` · ${years} лет в туризме`); quote=`offer.message`; tags=`specialties`; stats `★rating · {reviews} отзывов · {trips} поездок · {pct}% рекомендуют` — **each only if non-null**. Col3 per-person price + select button (default "Выбрать гида" navy / selected "Выбран" green+check). **No "уже выбрали" cluster** (zero fabrication). `children` = injected chips/route/inclusions/actions.
- [ ] Build per README §4 (selected ring `inset-0 border-2 border-primary shadow-[0_0_0_4px_rgba(26,86,164,.09)]`). Browser-verify full + sparse guide. Commit `feat(ui): GuideOfferCard primitive`.

### Task 11: `StickyActionBar` + header overlay
**Files:** Create `src/components/shared/sticky-action-bar.tsx`; Modify `site-header.tsx` (add `overlay?:boolean`).
**Produces:** `StickyActionBar({ avatarUrl, name, metaLabel, onMessage, primary:ReactNode })` — `fixed inset-x-0 bottom-0 z-[60]` glass + top hairline, `max-w-[1160px]` rail, 42px avatar + name + meta + "Написать" + primary slot. Header `overlay`=transparent+white text.
- [ ] Build per README §6; add header overlay prop. `typecheck`→0. Commit `feat(ui): StickyActionBar + header overlay variant`.

---

# Workstream 4 — Wire the owner branch

### Task 12: Rebuild `OwnerDetailBranch` (immersive layout + selection→accept)
**Files:** Modify `request-detail-screen.tsx` (`OwnerDetailBranch` ~574-674); Modify `requests/[requestId]/page.tsx` (pass trip/availability/members, `overlay` header, cancel `pt-nav-h` via `-mt-[var(--nav-h)]`); Modify `offer-card.tsx` (body → `GuideOfferCard`, keep chips/route/inclusions/accept-reject/Q&A as injected `children`).
**Consumes:** W3 primitives + Task-6 data. **Produces:** `selected:offerId|null`.
- [ ] **Step 1:** Compose `<ImmersiveHero>` (breadcrumb "Поездки › {region} › {destination}") + `<TripPanel>` child (assembly availability; hidden for private) + eyebrow "Ваши проводники" + H2 "Кто покажет вам {destination}" + helper "Нажмите на карточку, чтобы выбрать".
- [ ] **Step 2:** Offers → `<GuideOfferCard>` stack; `onSelect` toggles `selected`; inject `children` (deviation chips from `offer-card.tsx:126-137`, route gallery, inclusions, contact-reveal gate); `RejectOfferButton` as secondary "Скрыть предложение".
- [ ] **Step 3:** `<StickyActionBar>` when `selected!=null`: "Написать"→`OfferQaSheet`/`onGetOrCreateQaThread`; primary=`AcceptOfferButton` (→`acceptOfferAction`→`/bookings/[id]`) with confirm step.
- [ ] **Step 4:** Preserve accepted/booked state (selected, contact revealed, link to `/bookings/[id]`).
- [ ] **Step 5:** Header `overlay` + cancel `pt-nav-h`; verify breakpoints.
- [ ] **Step 6:** `bun run typecheck` → 0. Commit `feat(requests): immersive owner request-detail with selection → accept`.

### Task 13: Update tests/consumers + full verification
**Files:** Modify `offer-card.test.tsx` + any test/consumer touching changed components (search `offer-card`, `request-detail-screen`, `GuideInfo`).
- [ ] **Step 1:** Update vitest fixtures for new `GuideInfo` + `GuideOfferCard`. `bun run test:run` → green.
- [ ] **Step 2:** `bun run typecheck` → 0.
- [ ] **Step 3:** **Browser smoke** (chrome-devtools MCP, login demo traveler `anna@…demo.provodnik.app` / `Provodnik-QA-2026!`, owner of a seeded Элиста assembly request ≥2 offers): hero+panel, real joined avatars+seats, cards full data with graceful omission, select→ring+sticky bar, "Написать"→Q&A, accept→`/bookings/[id]` (no 404, party_size ok), accepted reveals contact, **no fabricated social proof**.
- [ ] **Step 4:** Responsive 375/768/1160; global smoke `/ /listings /guides /trips`.
- [ ] **Step 5:** Visual diff vs `Request Detail - Immersive.dc.html`.
- [ ] **Step 6:** Commit `test(requests): update fixtures for immersive owner redesign`.

---

## Self-Review notes
- **Spec coverage:** theme (W1) · font (T1) · systematic Tailwind/shadcn tokens (T2–T3) · full guide data (W2) · no orphan data (verified already editable) · reusable primitives (W3) · owner redesign + preserved behavior (W4) · zero fabrication.
- **No new input UI required** — confirmed; fold any future field's input into its task.
- **Landmine avoided:** view-only change → no `search_guides` rowtype drift.
- **Gate:** Task 5 (prod DB apply) requires explicit user approval.
- **Type consistency:** `GuideInfo` identical in Tasks 6/10/12; `AvatarStack` props identical in 7/9; `selected:offerId|null` consistent in 12.
