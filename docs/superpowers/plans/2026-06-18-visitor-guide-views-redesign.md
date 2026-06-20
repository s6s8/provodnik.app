# Visitor & Guide request-detail views — Immersive redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the **public visitor** and **guide** branches of `/requests/[requestId]` up to the immersive owner-view quality, persona-tuned: the visitor gets a sell-and-join page with a real bidding-guide social-proof teaser; the guide gets an assess-and-act page with a request-facts panel and the missing Edit/Withdraw bid actions.

**Architecture:** Reuse the canonical primitives already shipped (`ImmersiveHero`, `TripPanel`, `AvatarStack`, `GuideOfferCard`). Add three small primitives (`TripPanel` gains a `footer` slot; new `BiddingGuidesTeaser`, `RequestFactsPanel`). Add one read-only `SECURITY DEFINER` RPC for the visitor teaser (RLS blocks non-owners from reading offers). Add two app-layer server actions (`editOfferAction`, `withdrawOfferAction`) — the offer-update trigger already passes a guide editing their own offer straight through, so no trigger/schema change for those.

**Tech Stack:** Next.js 16 (App Router), Tailwind v4 (`@theme` tokens in `globals.css`), shadcn/ui, Supabase (shared prod DB), bun, vitest, lucide-react, Onest.

## Global Constraints

- **Repo/branch:** `D:\dev2\projects\provodnik`. Branch this work off **`origin/main`** (which now contains the owner redesign) as `redesign/visitor-guide-views`. Runtime `bun`. Verify with `bun run typecheck`, `bun run test:run`, `bun dev`.
- **Design system is fixed:** navy `--primary`, amber `--gold`, green `--success`, Onest, 16px card radius, 10px button radius. **Semantic utilities only** (`bg-primary`, `text-on-surface-muted`, `bg-surface`, `text-success`, `border-border`…). No raw hex / `bg-[#…]` in `.tsx`. Reuse the Part-1 primitives.
- **Scope (user decision):** re-skin **+ cheap functional fixes only** — guide Edit/Withdraw, prominent visitor Join, bidding-guide teaser. **No** structured-bid rebuild, **no** bid-data-model change.
- **DB:** user is fine with additive DB changes. Only one is needed: the teaser RPC. Apply it via `node scripts/apply-migration-via-management-api.mjs <file>` through the mac-mini mgmt-API token (the proven channel) — **gated on explicit go**, like the prior view migration. Verify on the live PostgREST/RPC API after apply.
- **Privacy:** the teaser RPC reveals bidders **only for open/сборная requests** (`open_to_join = true`); private requests return nothing. No offer contents (price/message) ever leave the RPC.
- **Zero fabrication:** teaser shows only real bidding guides from the RPC; if zero, render nothing (no "be the first" filler unless it's truthful).
- **Preserve behavior:** keep `JoinGroupButton`, `DecisionCard` join logic, `BidFormPanel` submit, `GuideOfferQaPanel`, verification gate, views/competing counts, mobile sticky bars.
- **Russian UI**; match existing copy.

## File structure

- `supabase/migrations/20260618140000_bidding_guides_rpc.sql` (create) + rollback — the teaser RPC.
- `src/lib/supabase/requests-public.ts` (create) — `getBiddingGuidesForRequest(requestId)` typed wrapper around the RPC.
- `src/features/guide/offer-actions.ts` (modify) — add `editOfferAction`, `withdrawOfferAction`.
- `src/features/guide/components/requests/bid-form-panel.tsx` (modify) — accept an optional `editOffer` to run in edit mode.
- `src/components/shared/trip-panel.tsx` (modify) — add optional `footer` slot.
- `src/components/shared/bidding-guides-teaser.tsx` (create) — visitor social-proof row.
- `src/components/shared/request-facts-panel.tsx` (create) — guide constraints panel.
- `src/features/requests/components/request-detail-screen.tsx` (modify) — rebuild `PublicDetailBranch` (≈296-426) and `GuideDetailBranch` (≈861-1070); extend their prop variants.
- `src/app/(site)/requests/[requestId]/page.tsx` (modify) — fetch bidding guides for the public branch; fetch the guide's full own-offer for edit prefill; pass new props.
- `src/lib/supabase/database.types.ts` (modify) — add the RPC to `Functions` (so the typed client knows it).
- Tests: `src/features/guide/offer-actions.test.ts`, `src/components/shared/bidding-guides-teaser.test.tsx`, `src/features/requests/components/request-detail-screen.test.tsx` (update guide/public fixtures).

---

# Workstream A — Data layer (RPC + guide actions)

### Task A1: Write the teaser RPC migration + rollback (no apply)

**Files:**
- Create: `supabase/migrations/20260618140000_bidding_guides_rpc.sql`
- Create: `supabase/rollbacks/20260618140000_bidding_guides_rpc.sql`

**Interfaces:**
- Produces: `public.get_bidding_guides_for_request(p_request_id uuid)` returning `table(user_id uuid, full_name text, avatar_url text, average_rating numeric, review_count integer, slug text)`.

- [ ] **Step 1:** Write the migration:

```sql
-- Read-only, privacy-scoped social proof for the public visitor view: which
-- approved guides have a live (pending) bid on an OPEN/сборная request.
-- Returns only already-public profile fields; no offer contents. SECURITY DEFINER
-- because non-owners are RLS-blocked from reading guide_offers directly.
create or replace function public.get_bidding_guides_for_request(p_request_id uuid)
returns table (
  user_id uuid, full_name text, avatar_url text,
  average_rating numeric, review_count integer, slug text
)
language sql stable security definer set search_path = public
as $$
  select distinct on (gp.user_id)
    gp.user_id, p.full_name, p.avatar_url, gp.average_rating, gp.review_count, gp.slug
  from public.guide_offers o
  join public.guide_profiles gp on gp.user_id = o.guide_id
  left join public.profiles p on p.id = gp.user_id
  join public.traveler_requests tr on tr.id = o.request_id
  where o.request_id = p_request_id
    and o.status = 'pending'::public.offer_status
    and gp.verification_status = 'approved'
    and tr.open_to_join = true
  order by gp.user_id, gp.average_rating desc nulls last;
$$;

revoke all on function public.get_bidding_guides_for_request(uuid) from public;
grant execute on function public.get_bidding_guides_for_request(uuid) to anon, authenticated;
```

- [ ] **Step 2:** Rollback = `drop function if exists public.get_bidding_guides_for_request(uuid);`.
- [ ] **Step 3:** Eyeball column names vs `schema.sql` (`guide_offers.guide_id/status`, `guide_profiles.user_id/verification_status/average_rating/review_count/slug`, `profiles.full_name/avatar_url`, `traveler_requests.open_to_join`). Do not apply.
- [ ] **Step 4:** Commit `feat(db): bidding-guides social-proof RPC (privacy-scoped, read-only)`.

### Task A2: Apply the RPC — **USER-GATED**

- [ ] **Step 1:** On explicit go: `node scripts/apply-migration-via-management-api.mjs supabase/migrations/20260618140000_bidding_guides_rpc.sql` (mgmt-API token on the mini).
- [ ] **Step 2:** Verify live: `POST /rest/v1/rpc/get_bidding_guides_for_request` with `{"p_request_id":"d2000000-0000-4000-8000-000000000002"}` → 200 returning the 3 demo guides; same call on a **private** request id (`…0003`, `open_to_join=false`) → returns `[]`.
- [ ] **Step 3:** No commit (DB op); note applied status in this plan.

### Task A3: `editOfferAction` + `withdrawOfferAction`

**Files:**
- Modify: `src/features/guide/offer-actions.ts` (add after `submitOfferAction`)

**Interfaces:**
- Consumes: existing `getCurrentUserId()`, `createOfferInputSchema`, `checkOfferAgainstLocks()`, `createSupabaseServerClient()`, `rubToKopecks` (already imported in the file).
- Produces: `editOfferAction(offerId: string, requestId: string, formData: FormData): Promise<SubmitOfferResult>`, `withdrawOfferAction(offerId: string, requestId: string): Promise<{ ok: true } | { error: string }>`.

- [ ] **Step 1: Write the failing tests** in `src/features/guide/offer-actions.test.ts` (follow the existing mock style in that file — mock `createSupabaseServerClient` + `getCurrentUserId`):

```ts
it("withdrawOfferAction sets the guide's own pending offer to withdrawn", async () => {
  const { update } = mockSupabaseUpdate({ id: "offer-1", guide_id: "guide-1", status: "pending" });
  mockCurrentUser("guide-1");
  const res = await withdrawOfferAction("offer-1", "req-1");
  expect(res).toEqual({ ok: true });
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: "withdrawn" }));
});

it("editOfferAction rejects when the offer is not pending", async () => {
  mockSupabaseSelect({ id: "offer-1", guide_id: "guide-1", status: "accepted", request_id: "req-1" });
  mockCurrentUser("guide-1");
  const fd = new FormData(); fd.set("price_total", "5000"); fd.set("message", "обновлённое предложение"); fd.set("valid_until", "2027-01-01");
  const res = await editOfferAction("offer-1", "req-1", fd);
  expect("error" in res).toBe(true);
});
```

- [ ] **Step 2:** Run `bun run test:run -- offer-actions` → FAIL (functions undefined).
- [ ] **Step 3:** Implement both. `withdrawOfferAction`: load the offer (`select id, guide_id, status, request_id`), assert `guide_id === currentUser` and `status === 'pending'`, then `.update({ status: "withdrawn" }).eq("id", offerId).eq("guide_id", guideId)`, `revalidatePath('/requests/'+requestId)` and `/guide/inbox`. `editOfferAction`: same ownership+pending guard, re-parse the FormData exactly like `submitOfferAction` (price_total/message/valid_until/capacity/route_stops/inclusions/starts_at/ends_at/duration) through `createOfferInputSchema`, run `checkOfferAgainstLocks`, then `.update({ price_minor: rubToKopecks(price_total), message, expires_at, capacity, inclusions, route_stops, route_duration_minutes, starts_at, ends_at }).eq("id", offerId).eq("guide_id", guideId)`. Return `{ ok: true }` / `{ error }`. (No trigger change — trigger line 103 passes the owning guide through.)
- [ ] **Step 4:** Run `bun run test:run -- offer-actions` → PASS.
- [ ] **Step 5:** Commit `feat(guide): edit + withdraw offer server actions`.

### Task A4: Typed RPC wrapper + database.types

**Files:**
- Create: `src/lib/supabase/requests-public.ts`
- Modify: `src/lib/supabase/database.types.ts` (add the function to `public.Functions`)

**Interfaces:**
- Produces: `type BiddingGuide = { user_id: string; full_name: string | null; avatar_url: string | null; average_rating: number | null; review_count: number | null; slug: string | null }` and `getBiddingGuidesForRequest(supabase, requestId): Promise<BiddingGuide[]>`.

- [ ] **Step 1:** Add to `database.types.ts` `public.Functions`:
```ts
get_bidding_guides_for_request: {
  Args: { p_request_id: string };
  Returns: { user_id: string; full_name: string | null; avatar_url: string | null; average_rating: number | null; review_count: number | null; slug: string | null }[];
};
```
- [ ] **Step 2:** Implement `getBiddingGuidesForRequest`: `const { data } = await supabase.rpc("get_bidding_guides_for_request", { p_request_id: requestId }); return data ?? [];`. Wrap in try/catch returning `[]` (non-fatal — never block the page).
- [ ] **Step 3:** `bun run typecheck` → 0. Commit `feat(requests): typed wrapper for bidding-guides RPC`.

---

# Workstream B — Primitives

### Task B1: `TripPanel` gains a `footer` slot
**Files:** Modify `src/components/shared/trip-panel.tsx`.
**Interfaces:** add `footer?: ReactNode` to props; render it (when present) below the availability section inside a top-hairline `div className="border-t border-border px-[22px] py-[18px]"`. Owner passes nothing (info-only unchanged); visitor passes price + Join CTA.
- [ ] Add the prop + render block. `bun run typecheck` → 0. Commit `feat(ui): TripPanel footer slot`.

### Task B2: `BiddingGuidesTeaser`
**Files:** Create `src/components/shared/bidding-guides-teaser.tsx`. Consumes `BiddingGuide[]` + `AvatarStack`.
**Interfaces:** `BiddingGuidesTeaser({ guides }: { guides: BiddingGuide[] })`. Renders **nothing if `guides.length === 0`**. Else: eyebrow "ВАШИ ПРОВОДНИКИ", a line `{n} {pluralize(n,'проверенный гид','проверенных гида','проверенных гидов')} уже предлагают программу`, and a row of read-only mini cards — avatar (initials fallback), name, "Проверен" green chip, ★`average_rating` (amber) · `{review_count} отзывов`. No price, no select button (visitor can't pick). Semantic tokens only.
- [ ] **Step 1:** Write a fixture test: 3 guides → renders names + count line + ★ ratings; `[]` → renders nothing. `bun run test:run -- bidding-guides-teaser` after.
- [ ] **Step 2:** Build it. Browser-verify on the visitor page later (Task C). Commit `feat(ui): BiddingGuidesTeaser primitive`.

### Task B3: `RequestFactsPanel`
**Files:** Create `src/components/shared/request-facts-panel.tsx`. Mirrors `TripPanel` styling (white-glass card, hairline sections), different fields.
**Interfaces:** `RequestFactsPanel({ dateLabel, flexible, timeLabel?, groupLabel, budgetLabel, formatLabel, interests, viewsLabel, competingLabel })`. Sections: **"Запрос"** (rows: calendar date `+ (flexible ? "· гибкие даты" : "· точная дата")`, clock time, users group, wallet budget, format badge) · **interests** pills · hairline · **"Конкуренция"** strip (eye `viewsLabel`, users `competingLabel`). Icons lucide (`CalendarDays, Clock, Users, Wallet, Eye`).
- [ ] Build per spec; `bun run typecheck` → 0. Browser-verify in Task D. Commit `feat(ui): RequestFactsPanel primitive`.

---

# Workstream C — Rebuild the Public visitor branch

### Task C1: Wire bidding guides into the public data path
**Files:** Modify `src/app/(site)/requests/[requestId]/page.tsx`; Modify the `public` + `admin` variants of `RequestDetailScreenProps` in `request-detail-screen.tsx`.
**Interfaces:** add `biddingGuides: BiddingGuide[]` to the `public` (and `admin`) prop variant; default `[]`.
- [ ] **Step 1:** In the default export's public render path (`buildViewModel` block) and the admin path, call `getBiddingGuidesForRequest(supabase, requestId)` and pass `biddingGuides={...}`.
- [ ] **Step 2:** Add `biddingGuides: BiddingGuide[]` to the `public`/`admin` prop variants and thread into `PublicDetailBranch({ requestId, viewModel, biddingGuides })`. `bun run typecheck` → 0. Commit `feat(requests): pass bidding guides to public view`.

### Task C2: Rebuild `PublicDetailBranch` with the immersive shell
**Files:** Modify `request-detail-screen.tsx` `PublicDetailBranch` (≈296-426).
**Consumes:** `ImmersiveHero`, `TripPanel` (with `footer`), `BiddingGuidesTeaser`, existing `DecisionCard`/`JoinGroupButton` logic, `AvatarStack`, `faqItems`.
- [ ] **Step 1:** Replace the 240px hero with `<ImmersiveHero className="-mt-nav-h" imageUrl={viewModel.cityImageUrl} breadcrumb={["Поездки", viewModel.regionLabel, viewModel.title]} title={viewModel.title} intro={viewModel.notes || undefined}>` whose child is `<TripPanel … footer={<price + JoinGroupButton/Войти-CTA>} />` (availability from `viewModel.memberCount`/members; price from `formatPublicPrice(viewModel.pricePerPersonRub)`; CTA = the existing join/login control from `DecisionCard`).
- [ ] **Step 2:** Below in a `mx-auto max-w-page px-5 md:px-8 pb-32` container: `<BiddingGuidesTeaser guides={biddingGuides} />`, then the restyled **"Как это работает"** trust band (reuse the 3 steps + add the off-platform-pay reassurance line) and the FAQ `<details>` list (token-restyled).
- [ ] **Step 3:** Keep the mobile sticky **Join** bar (reuse `JoinGroupButton`), now styled like `StickyActionBar`.
- [ ] **Step 4:** `bun run typecheck` → 0. Browser-verify (Task E) the visitor page (logged out + as a non-owner traveller): hero, join panel, teaser faces, sticky join. Commit `feat(requests): immersive public visitor view + social-proof teaser`.

---

# Workstream D — Rebuild the Guide branch (+ edit/withdraw)

### Task D1: Fetch the guide's full own-offer for edit prefill
**Files:** Modify `page.tsx` `getGuideDetailData`; add `existingOffer?: GuideOfferRow | null` to the `guide` prop variant.
- [ ] In `getGuideDetailData`, when the guide has an offer, also `select("*")` that offer row (RLS lets a guide read their own) and return it; pass `existingOffer` into the guide branch. `bun run typecheck` → 0. Commit `feat(guide): load own offer for edit`.

### Task D2: `BidFormPanel` edit mode
**Files:** Modify `src/features/guide/components/requests/bid-form-panel.tsx`.
**Interfaces:** add optional `editOffer?: GuideOfferRow`. When present: prefill all fields from it, change the heading to "Редактировать предложение", and submit via `editOfferAction(editOffer.id, requestId, formData)` instead of `submitOfferAction(requestId, formData)`.
- [ ] Add the prop + prefill + branch the submit call. `bun run typecheck` → 0; `bun run test:run` green. Commit `feat(guide): bid form edit mode`.

### Task D3: Rebuild `GuideDetailBranch` with the immersive shell + actions
**Files:** Modify `request-detail-screen.tsx` `GuideDetailBranch` (≈861-1070).
**Consumes:** `ImmersiveHero`, `RequestFactsPanel`, `BidFormPanel` (now edit-capable), `GuideOfferQaPanel`, `withdrawOfferAction`, `cityImage`, existing `formatViewsLabel`/`formatCompetingOffersLabel`/`INTEREST_LABEL_BY_ID`.
- [ ] **Step 1:** Replace the back-link + `Card` with `<ImmersiveHero className="-mt-nav-h" imageUrl={cityImage(request.destination)} breadcrumb={["Запросы", request.destination]} title={request.destination} intro={request.description || undefined}>` + child `<RequestFactsPanel … />` (dates+flexible, time, `${request.groupSize} чел.`, `request.budgetLabel`, format badge, interests, `formatViewsLabel(viewsCount)`, `formatCompetingOffersLabel(competingOffers, validOfferId!==null)`).
- [ ] **Step 2:** Below in `mx-auto max-w-page px-5 md:px-8 pb-24`, render the **action zone** by state:
  - not-approved → disabled "Доступно после верификации" + verify link (unchanged copy).
  - approved, no offer → primary "Сделать предложение" → `setPanelOpen(true)`.
  - has offer → the "Ваш отклик" summary (keep current fields) + **two buttons: "Редактировать"** (`setPanelOpen(true)` with `editOffer={existingOffer}`) and **"Отозвать"** (calls `withdrawOfferAction(validOfferId, request.id)` inside a confirm, then `router.refresh()`), + `<GuideOfferQaPanel offerId={validOfferId} />`.
- [ ] **Step 3:** Keep `<BidFormPanel>` mount; pass `editOffer={existingOffer ?? undefined}` when editing.
- [ ] **Step 4:** `bun run typecheck` → 0. Commit `feat(requests): immersive guide view + edit/withdraw bid`.

---

# Workstream E — Tests, verification, ship

### Task E1: Update fixtures + suite
**Files:** Modify `request-detail-screen.test.tsx` (guide test: add `existingOffer`/`biddingGuides` where required by the new prop variants; public test: add `biddingGuides: []`).
- [ ] `bun run test:run` → green. `bun run typecheck` → 0. Commit `test(requests): fixtures for visitor/guide redesign`.

### Task E2: Full live verification (after Task A2 applied)
- [ ] **Browser smoke (chrome-devtools, prod or localhost, isolated contexts):**
  - **Visitor** (`…0002` logged out + as a non-owner): immersive hero, JoinPanel price+Join, **teaser shows the 3 real bidding guides** with ★ + "Проверен", "Как это работает" + FAQ, sticky Join (mobile).
  - **Visitor on a private request** (`…0003`): teaser renders **nothing** (privacy).
  - **Guide** (`…0002` as `guide.belova` — no bid yet): hero + RequestFactsPanel (budget, group, competition strip) + "Сделать предложение"; submit a bid in a throwaway then **Edit** it (values prefill, save) and **Withdraw** it (offer gone, count drops). Use a demo guide so writes are reversible; re-seed if needed.
  - **Guide with existing bid** (`guide.baatr` on `…0002`): "Ваш отклик" + Редактировать/Отозвать + Q&A.
- [ ] **Responsive** 375/768/1160 for both. **No fabrication** (teaser empty when no real bidders).

### Task E3: Ship
- [ ] Branch `redesign/visitor-guide-views` → push (token-in-URL to bypass Git Credential Manager: `git push "https://x-access-token:$(gh auth token)@github.com/s6s8/provodnik.app.git" <branch>`) → `gh pr create` → wait all checks green (`gh pr checks`) → `gh pr merge --squash --delete-branch` → poll prod for deploy → re-verify live. Commit messages carry **no** `claude/cursor/co-author` trailers (provodnik pre-merge scan).

---

## Self-Review notes
- **Spec coverage:** visitor sell+join (C2) · prominent Join CTA (B1 footer + C2) · faces teaser (A1/A2/A4/B2/C1) · privacy-scoped (A1 `open_to_join`) · guide immersive (D3) · request-facts panel (B3) · Edit (A3/D2/D3) · Withdraw (A3/D3) · guide hero full-immersive (D3) · no schema change beyond the one additive RPC (A1) · zero fabrication (B2 empty-render).
- **Trigger confirmed:** `guard_traveler_offer_update` line 103 passes the owning guide through → edit/withdraw need no trigger change.
- **Type consistency:** `BiddingGuide` shape identical in A4/B2/C1; `editOfferAction(offerId, requestId, formData)` / `withdrawOfferAction(offerId, requestId)` identical in A3/D2/D3; `TripPanel.footer` in B1 consumed in C2.
- **Gate:** Task A2 (RPC apply) needs explicit go before runtime verification of the teaser.
- **Placeholder scan:** none — all code/fields named against real schema + existing functions.
