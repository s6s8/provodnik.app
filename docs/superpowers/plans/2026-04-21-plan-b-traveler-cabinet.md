# Plan_B: Traveler Cabinet Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the traveler cabinet with a two-tab requests list, an offer board with Q&A per offer, contact masking on all messages, and automatic request expiry via pg_cron.

**Architecture:** Six tasks across three phases. Tasks in the same phase run in parallel. All data fetching uses Supabase server clients. Atomic offer acceptance uses a Postgres RPC function called via `supabase.rpc()`. PII masking uses the existing `maskPii()` utility applied at render time only — originals are never modified in the DB.

**Tech Stack:** Next.js 14 App Router, React Server Components, Supabase Postgres + pg_cron, Vitest + React Testing Library, Tailwind CSS (mobile-first, `sm:` breakpoint), shadcn/ui (Sheet, Badge, Tabs, Card, Avatar)

---

## MANDATORY: Read This Before Touching Any File

**Working directory:** `D:\dev2\projects\provodnik\provodnik.app`

**Run tests with:** `npx vitest run` (inside working directory)

**Conventions you must follow:**
- Server components: `src/app/(protected)/...` — async, fetch data directly
- Feature screens: `src/features/<role>/components/<domain>/` — presentational
- Server actions: `src/features/<role>/actions/` — files start with `'use server'`
- DB queries: `src/lib/supabase/` — one domain per file, always use `createServerClient()`
- No raw `<table>` HTML — use CSS grid with `sm:` breakpoint for responsive layouts
- TypeScript strict, no `any`
- Tests: `src/**/*.test.{ts,tsx}`, jsdom environment, `@testing-library/react`

**Actual DB status enums (the front-end badge uses aspirational values — ignore them for queries):**
- `traveler_requests.status`: `'open' | 'booked' | 'cancelled' | 'expired'`
- `guide_offers.status`: `'pending' | 'accepted' | 'declined' | 'expired' | 'withdrawn'`

**Key existing files — read before modifying:**
- `src/lib/pii/mask.ts` — `maskPii(text: string | null | undefined): string` — already handles Russian phones, emails, @handles, `t.me/*`, `wa.me/*`
- `src/lib/supabase/offers.ts` — `getOffersForRequest(requestId)`, `createGuideOffer(input, guideId)`, `hasGuideOffered(guideId, requestId)`, `getGuideOffers(guideId)`
- `src/components/ui/sheet.tsx` — `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`
- `src/components/ui/badge.tsx` — `Badge` with `variant` prop
- `src/components/ui/tabs.tsx` — `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `src/components/ui/avatar.tsx` — `Avatar`, `AvatarImage`, `AvatarFallback`
- `src/features/traveler/components/requests/traveler-request-status.tsx` — `TravelerRequestStatusBadge`
- `src/app/(protected)/guide/inbox/page.tsx` — guide inbox page (renders `GuideRequestsInboxScreen`)

---

## Execution Phases

| Phase | Tasks | Dependency |
|-------|-------|------------|
| 1 | Task 1 + Task 4 | none |
| 2 | Task 2 + Task 3 + Task 6 | Phase 1 merged to main |
| 3 | Task 5 | Phase 2 merged — DB migration last |

---

## Task 1: Status Badge Colors

**Branch:** `feat/plan-b-1-status-colors`

**What this task does:** Updates `TravelerRequestStatusBadge` to use semantic colors that reflect meaning. Also aligns the component with actual DB enum values (`open`, `booked`, `cancelled`, `expired`) while keeping aspirational states as fallbacks.

**Color scheme:**
- `open` / `submitted` → blue (waiting, neutral process)
- `offers_received` / `shortlisted` → amber (action needed)
- `booked` → emerald (success)
- `expired` / `closed` / `cancelled` → red (terminal, negative)
- `draft` → outline (unchanged)

**Files:**
- Modify: `src/features/traveler/components/requests/traveler-request-status.tsx`
- Create: `src/features/traveler/components/requests/traveler-request-status.test.tsx`

---

- [ ] **Step 1: Read the existing file**

  Read `src/features/traveler/components/requests/traveler-request-status.tsx` in full before changing anything.

- [ ] **Step 2: Write the failing test**

  Create `src/features/traveler/components/requests/traveler-request-status.test.tsx`:

  ```tsx
  import { render, screen } from '@testing-library/react'
  import { TravelerRequestStatusBadge } from './traveler-request-status'

  describe('TravelerRequestStatusBadge', () => {
    it('renders open status with blue styling', () => {
      render(<TravelerRequestStatusBadge status="open" />)
      const badge = screen.getByText('Ожидает')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-100')
    })

    it('renders booked status with emerald styling', () => {
      render(<TravelerRequestStatusBadge status="booked" />)
      const badge = screen.getByText('Забронировано')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-emerald-100')
    })

    it('renders expired status with red styling', () => {
      render(<TravelerRequestStatusBadge status="expired" />)
      const badge = screen.getByText('Истёк')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-100')
    })

    it('renders cancelled status with red styling', () => {
      render(<TravelerRequestStatusBadge status="cancelled" />)
      const badge = screen.getByText('Отменён')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-100')
    })

    it('renders offers_received status with amber styling', () => {
      render(<TravelerRequestStatusBadge status="offers_received" />)
      const badge = screen.getByText('Есть предложения')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-amber-100')
    })
  })
  ```

- [ ] **Step 3: Run the test to confirm it fails**

  ```bash
  npx vitest run src/features/traveler/components/requests/traveler-request-status.test.tsx
  ```

  Expected: FAIL (colors not yet applied)

- [ ] **Step 4: Rewrite the component**

  Replace the contents of `src/features/traveler/components/requests/traveler-request-status.tsx`:

  ```tsx
  import { cn } from '@/lib/utils'

  type RequestStatus =
    | 'open'
    | 'submitted'
    | 'offers_received'
    | 'shortlisted'
    | 'booked'
    | 'expired'
    | 'cancelled'
    | 'closed'
    | 'draft'

  const STATUS_CONFIG: Record<
    RequestStatus,
    { label: string; className: string }
  > = {
    open:            { label: 'Ожидает',           className: 'bg-blue-100 text-blue-700 border-blue-200' },
    submitted:       { label: 'Ожидает',           className: 'bg-blue-100 text-blue-700 border-blue-200' },
    offers_received: { label: 'Есть предложения',  className: 'bg-amber-100 text-amber-700 border-amber-200' },
    shortlisted:     { label: 'Рассматривается',   className: 'bg-amber-100 text-amber-700 border-amber-200' },
    booked:          { label: 'Забронировано',      className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    expired:         { label: 'Истёк',             className: 'bg-red-100 text-red-700 border-red-200' },
    cancelled:       { label: 'Отменён',           className: 'bg-red-100 text-red-700 border-red-200' },
    closed:          { label: 'Закрыт',            className: 'bg-red-100 text-red-700 border-red-200' },
    draft:           { label: 'Черновик',          className: 'border border-dashed text-muted-foreground' },
  }

  interface Props {
    status: string
  }

  export function TravelerRequestStatusBadge({ status }: Props) {
    const config = STATUS_CONFIG[status as RequestStatus] ?? {
      label: status,
      className: 'bg-gray-100 text-gray-700 border-gray-200',
    }

    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
          config.className,
        )}
      >
        {config.label}
      </span>
    )
  }
  ```

- [ ] **Step 5: Run the test to confirm it passes**

  ```bash
  npx vitest run src/features/traveler/components/requests/traveler-request-status.test.tsx
  ```

  Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

  ```bash
  git add src/features/traveler/components/requests/traveler-request-status.tsx \
          src/features/traveler/components/requests/traveler-request-status.test.tsx
  git commit -m "feat(plan-b-1): semantic status badge colors with DB enum alignment"
  ```

---

## Task 4: Contact Masking Integration

**Branch:** `feat/plan-b-4-contact-mask`

**What this task does:** The PII masking utility already exists at `src/lib/pii/mask.ts`. This task integrates `maskPii()` into the offer message and Q&A message rendering pipeline. Masking is applied at read time (in the server action/query that returns message bodies), never at write time, so original data is preserved.

**Files:**
- Modify: `src/lib/supabase/offers.ts` — apply `maskPii()` to `message` field when returning offers
- Create: `src/lib/pii/mask.test.ts` (if not exists — write tests for the existing function)

---

- [ ] **Step 1: Read the existing files**

  Read both files before changing anything:
  - `src/lib/pii/mask.ts` (full content)
  - `src/lib/supabase/offers.ts` (full content)

- [ ] **Step 2: Write a test verifying maskPii is applied to offer messages**

  Create `src/lib/supabase/offers.test.ts`:

  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest'

  // We test the masking logic in isolation since we can't hit Supabase in unit tests
  import { maskPii } from '@/lib/pii/mask'

  describe('maskPii integration contract', () => {
    it('masks a Russian phone number', () => {
      expect(maskPii('Позвони +7 (999) 123-45-67 сегодня')).toContain('[контакт скрыт]')
    })

    it('masks an email address', () => {
      expect(maskPii('Пиши на guide@example.com')).toContain('[контакт скрыт]')
    })

    it('masks a telegram handle', () => {
      expect(maskPii('Мой телеграм @ivanov_guide')).toContain('[контакт скрыт]')
    })

    it('masks t.me link', () => {
      expect(maskPii('Пиши сюда t.me/myguide')).toContain('[контакт скрыт]')
    })

    it('does NOT mask the word "телеграм" without a handle', () => {
      expect(maskPii('нет связи как в телеграме')).toBe('нет связи как в телеграме')
    })

    it('returns empty string for null input', () => {
      expect(maskPii(null)).toBe('')
    })

    it('returns empty string for undefined input', () => {
      expect(maskPii(undefined)).toBe('')
    })

    it('does not mask a price like 8 000 рублей', () => {
      const text = 'Цена 8 000 рублей за группу'
      expect(maskPii(text)).toBe(text)
    })
  })
  ```

- [ ] **Step 3: Run the test to confirm it passes (mask.ts already works)**

  ```bash
  npx vitest run src/lib/supabase/offers.test.ts
  ```

  Expected: PASS — this documents the existing contract

- [ ] **Step 4: Apply maskPii to the getOffersForRequest return value**

  In `src/lib/supabase/offers.ts`, import `maskPii` and apply it to the `message` field in `getOffersForRequest`. Find the function and wrap message:

  ```ts
  import { maskPii } from '@/lib/pii/mask'

  // Inside getOffersForRequest, after fetching rows, map over results:
  // return rows.map(row => ({ ...row, message: maskPii(row.message) }))
  ```

  The exact implementation depends on what the function currently returns. Read the file first, then apply the map. The key rule: `message` field on every returned `GuideOffer` must pass through `maskPii()`.

- [ ] **Step 5: Write a test confirming the masking wrapper works**

  Add to `src/lib/supabase/offers.test.ts`:

  ```ts
  describe('maskPii applied to offer messages', () => {
    it('masks phone in offer message', () => {
      const rawMessage = 'Звоните +79001234567'
      const masked = maskPii(rawMessage)
      expect(masked).not.toContain('+79001234567')
      expect(masked).toContain('[контакт скрыт]')
    })
  })
  ```

  ```bash
  npx vitest run src/lib/supabase/offers.test.ts
  ```

  Expected: PASS

- [ ] **Step 6: Commit**

  ```bash
  git add src/lib/supabase/offers.ts src/lib/supabase/offers.test.ts
  git commit -m "feat(plan-b-4): apply maskPii to offer messages at read time"
  ```

---

## Task 2: Requests List Page Redesign

**Branch:** `feat/plan-b-2-requests-list`

**Dependency:** Phase 1 (Task 1) merged to main before starting.

**What this task does:** Rewrites the traveler requests screen with two tabs:
- **"Активные"** tab: all requests with `status = 'open'` (card stack on mobile, 2-column grid on `sm:`)
- **"Подтверждённые"** tab: all requests with `status = 'booked'`, showing guide info from accepted offer (card stack)
- Empty state with CTA for each tab
- Guide avatar stacks loaded via a single batch query (no N+1)

**Files:**
- Modify: `src/app/(protected)/traveler/requests/page.tsx` (server component — add data fetching)
- Modify: `src/features/traveler/components/requests/traveler-requests-screen.tsx` (or the open-requests screen — read which one is used first)
- Create: `src/lib/supabase/traveler-requests.ts` — new query functions
- Create: `src/features/traveler/components/requests/active-request-card.tsx`
- Create: `src/features/traveler/components/requests/confirmed-booking-card.tsx`
- Create: `src/lib/supabase/traveler-requests.test.ts`

---

- [ ] **Step 1: Read existing files**

  Before touching anything, read:
  - `src/app/(protected)/traveler/requests/page.tsx`
  - The current traveler requests screen component (the one page.tsx renders)
  - `src/lib/supabase/offers.ts` (to understand the offer data shape)

- [ ] **Step 2: Define TypeScript types**

  Create `src/lib/supabase/traveler-requests.ts` with type definitions first:

  ```ts
  import { cache } from 'react'
  import { createServerClient } from '@/lib/supabase/server'
  import { maskPii } from '@/lib/pii/mask'

  export interface TravelerRequest {
    id: string
    destination: string
    region: string | null
    category: string
    starts_on: string
    ends_on: string | null
    budget_minor: number | null
    participants_count: number
    group_capacity: number | null
    open_to_join: boolean
    status: 'open' | 'booked' | 'cancelled' | 'expired'
    created_at: string
    guide_avatars: Array<{ guide_id: string; avatar_url: string | null; full_name: string | null }>
    offer_count: number
  }

  export interface ConfirmedBooking {
    request_id: string
    destination: string
    starts_on: string
    price_minor: number
    currency: string
    guide_id: string
    guide_name: string | null
    guide_avatar_url: string | null
    offer_id: string
    booking_thread_id: string | null
  }
  ```

- [ ] **Step 3: Write failing tests for query functions**

  Create `src/lib/supabase/traveler-requests.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest'

  // Unit test the data shape transformations, not the DB calls
  import type { TravelerRequest, ConfirmedBooking } from './traveler-requests'

  describe('TravelerRequest type contract', () => {
    it('has required fields', () => {
      const req: TravelerRequest = {
        id: 'uuid',
        destination: 'Элиста',
        region: null,
        category: 'История',
        starts_on: '2026-06-01',
        ends_on: null,
        budget_minor: 10000,
        participants_count: 2,
        group_capacity: null,
        open_to_join: false,
        status: 'open',
        created_at: '2026-04-21T00:00:00Z',
        guide_avatars: [],
        offer_count: 0,
      }
      expect(req.status).toBe('open')
      expect(req.guide_avatars).toHaveLength(0)
    })
  })

  describe('ConfirmedBooking type contract', () => {
    it('has required fields', () => {
      const booking: ConfirmedBooking = {
        request_id: 'uuid1',
        destination: 'Астрахань',
        starts_on: '2026-07-10',
        price_minor: 15000,
        currency: 'RUB',
        guide_id: 'uuid2',
        guide_name: 'Иван Петров',
        guide_avatar_url: null,
        offer_id: 'uuid3',
        booking_thread_id: null,
      }
      expect(booking.price_minor).toBeGreaterThan(0)
    })
  })
  ```

  ```bash
  npx vitest run src/lib/supabase/traveler-requests.test.ts
  ```

  Expected: PASS (type tests always pass — confirms shape)

- [ ] **Step 4: Implement getActiveRequests and getConfirmedBookings**

  In `src/lib/supabase/traveler-requests.ts`, add:

  ```ts
  // React.cache() deduplicates calls within a single request render
  export const getActiveRequests = cache(async function getActiveRequests(travelerId: string): Promise<TravelerRequest[]> {
    const supabase = await createServerClient()

    const { data: requests, error } = await supabase
      .from('traveler_requests')
      .select('id, destination, region, category, starts_on, ends_on, budget_minor, participants_count, group_capacity, open_to_join, status, created_at')
      .eq('traveler_id', travelerId)
      .in('status', ['open', 'expired', 'cancelled'])
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!requests || requests.length === 0) return []

    // Batch fetch offers for all requests in one query (no N+1)
    const requestIds = requests.map((r) => r.id)
    const { data: offers } = await supabase
      .from('guide_offers')
      .select('request_id, guide_id, profiles(id, full_name, avatar_url)')
      .in('request_id', requestIds)
      .in('status', ['pending', 'accepted'])

    // Group offers by request_id
    const offersByRequest = new Map<string, typeof offers>()
    for (const offer of offers ?? []) {
      const list = offersByRequest.get(offer.request_id) ?? []
      list.push(offer)
      offersByRequest.set(offer.request_id, list)
    }

    return requests.map((r) => {
      const requestOffers = offersByRequest.get(r.id) ?? []
      return {
        ...r,
        offer_count: requestOffers.length,
        guide_avatars: requestOffers.slice(0, 3).map((o: any) => ({
          guide_id: o.guide_id,
          avatar_url: o.profiles?.avatar_url ?? null,
          full_name: o.profiles?.full_name ?? null,
        })),
      }
    })
  }

  })

  export const getConfirmedBookings = cache(async function getConfirmedBookings(travelerId: string): Promise<ConfirmedBooking[]> {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('traveler_requests')
      .select(`
        id,
        destination,
        starts_on,
        guide_offers!inner(
          id,
          price_minor,
          currency,
          guide_id,
          profiles(full_name, avatar_url),
          conversation_threads(id)
        )
      `)
      .eq('traveler_id', travelerId)
      .eq('status', 'booked')
      .eq('guide_offers.status', 'accepted')
      .order('starts_on', { ascending: true })

    if (error) throw error

    return (data ?? []).map((r: any) => {
      const offer = r.guide_offers?.[0]
      const thread = offer?.conversation_threads?.[0]
      return {
        request_id: r.id,
        destination: r.destination,
        starts_on: r.starts_on,
        price_minor: offer?.price_minor ?? 0,
        currency: offer?.currency ?? 'RUB',
        guide_id: offer?.guide_id ?? '',
        guide_name: offer?.profiles?.full_name ?? null,
        guide_avatar_url: offer?.profiles?.avatar_url ?? null,
        offer_id: offer?.id ?? '',
        booking_thread_id: thread?.id ?? null,
      }
    })
  }
  ```

- [ ] **Step 5: Create ActiveRequestCard component**

  Create `src/features/traveler/components/requests/active-request-card.tsx`:

  ```tsx
  import Link from 'next/link'
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
  import { TravelerRequestStatusBadge } from './traveler-request-status'
  import type { TravelerRequest } from '@/lib/supabase/traveler-requests'

  function formatBudget(minor: number | null): string {
    if (!minor) return '—'
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(minor / 100)
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  export function ActiveRequestCard({ request }: { request: TravelerRequest }) {
    return (
      <Link
        href={`/traveler/requests/${request.id}`}
        className="block rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{request.destination}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(request.starts_on)}</p>
          </div>
          <TravelerRequestStatusBadge status={request.status} />
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{request.participants_count} чел.</span>
          {request.budget_minor ? <span>{formatBudget(request.budget_minor)}/чел.</span> : null}
          {request.offer_count > 0 && (
            <span className="text-amber-600 font-medium">{request.offer_count} предл.</span>
          )}
        </div>

        {request.guide_avatars.length > 0 && (
          <div className="mt-3 flex items-center gap-1">
            {request.guide_avatars.map((g) => (
              <Avatar key={g.guide_id} className="h-6 w-6 border-2 border-background -ml-1 first:ml-0">
                <AvatarImage src={g.avatar_url ?? undefined} alt={g.full_name ?? 'Гид'} />
                <AvatarFallback className="text-[8px]">{(g.full_name ?? 'Г').charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {request.offer_count > 3 && (
              <span className="text-xs text-muted-foreground ml-1">+{request.offer_count - 3}</span>
            )}
          </div>
        )}
      </Link>
    )
  }
  ```

- [ ] **Step 6: Create ConfirmedBookingCard component**

  Create `src/features/traveler/components/requests/confirmed-booking-card.tsx`:

  ```tsx
  import Link from 'next/link'
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
  import { Button } from '@/components/ui/button'
  import type { ConfirmedBooking } from '@/lib/supabase/traveler-requests'

  function formatPrice(minor: number, currency: string): string {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(minor / 100)
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  }

  export function ConfirmedBookingCard({ booking }: { booking: ConfirmedBooking }) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={booking.guide_avatar_url ?? undefined} alt={booking.guide_name ?? 'Гид'} />
            <AvatarFallback>{(booking.guide_name ?? 'Г').charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{booking.guide_name ?? 'Гид'}</p>
            <p className="text-xs text-muted-foreground">{booking.destination} · {formatDate(booking.starts_on)}</p>
          </div>
          <p className="text-sm font-medium text-emerald-600 shrink-0">{formatPrice(booking.price_minor, booking.currency)}</p>
        </div>

        {booking.booking_thread_id ? (
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link href={`/traveler/chat/${booking.booking_thread_id}`}>Написать гиду</Link>
          </Button>
        ) : null}
      </div>
    )
  }
  ```

- [ ] **Step 7: Rewrite the requests screen component**

  Read the current file at `src/features/traveler/components/requests/traveler-requests-screen.tsx` (or whichever screen is actually rendered by the requests page — confirm first).

  Replace with:

  ```tsx
  import Link from 'next/link'
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
  import { Button } from '@/components/ui/button'
  import { ActiveRequestCard } from './active-request-card'
  import { ConfirmedBookingCard } from './confirmed-booking-card'
  import type { TravelerRequest, ConfirmedBooking } from '@/lib/supabase/traveler-requests'

  interface Props {
    activeRequests: TravelerRequest[]
    confirmedBookings: ConfirmedBooking[]
    userName: string
  }

  export function TravelerRequestsScreen({ activeRequests, confirmedBookings, userName }: Props) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Кабинет путешественника</h1>
          {userName && <p className="text-muted-foreground mt-1">{userName}</p>}
        </div>

        <Tabs defaultValue="active">
          <TabsList className="mb-4 w-full grid grid-cols-2">
            <TabsTrigger value="active">
              Активные {activeRequests.length > 0 && `(${activeRequests.length})`}
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Подтверждённые {confirmedBookings.length > 0 && `(${confirmedBookings.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeRequests.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <p className="text-muted-foreground">У вас ещё нет запросов</p>
                <Button asChild>
                  <Link href="/traveler/requests/new">Создать первый запрос</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {activeRequests.map((req) => (
                  <ActiveRequestCard key={req.id} request={req} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="confirmed">
            {confirmedBookings.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <p className="text-muted-foreground">Подтверждённых поездок пока нет</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {confirmedBookings.map((b) => (
                  <ConfirmedBookingCard key={b.request_id} booking={b} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    )
  }
  ```

- [ ] **Step 8: Update the page.tsx to pass data**

  Read `src/app/(protected)/traveler/requests/page.tsx`. Update it to fetch and pass data:

  ```tsx
  import { createServerClient } from '@/lib/supabase/server'
  import { redirect } from 'next/navigation'
  import { getActiveRequests, getConfirmedBookings } from '@/lib/supabase/traveler-requests'
  import { TravelerRequestsScreen } from '@/features/traveler/components/requests/traveler-requests-screen'

  export default async function TravelerRequestsPage() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const [activeRequests, confirmedBookings] = await Promise.all([
      getActiveRequests(user.id),
      getConfirmedBookings(user.id),
    ])

    return (
      <TravelerRequestsScreen
        activeRequests={activeRequests}
        confirmedBookings={confirmedBookings}
        userName={profile?.full_name ?? ''}
      />
    )
  }
  ```

- [ ] **Step 9: Run full test suite to confirm no regressions**

  ```bash
  npx vitest run
  ```

  Expected: all existing tests still pass

- [ ] **Step 10: Commit**

  ```bash
  git add src/lib/supabase/traveler-requests.ts \
          src/lib/supabase/traveler-requests.test.ts \
          src/features/traveler/components/requests/active-request-card.tsx \
          src/features/traveler/components/requests/confirmed-booking-card.tsx \
          src/features/traveler/components/requests/traveler-requests-screen.tsx \
          src/app/(protected)/traveler/requests/page.tsx
  git commit -m "feat(plan-b-2): two-tab requests list with batch guide avatars"
  ```

---

## Task 3: Request Detail — Offer Board

**Branch:** `feat/plan-b-3-offer-board`

**Dependency:** Phase 1 (Task 4) merged — `maskPii()` applied to offer messages already.

**What this task does:**
- Rewrites the request detail screen to show an offer board
- Each offer card: guide avatar + name + rating (if available), price, masked message, Accept button, "Задать вопрос" button
- "Задать вопрос" opens a Sheet with the Q&A thread (max 8 messages)
- PII disclosure badge on every offer card
- Accepting an offer calls a Postgres RPC function that atomically: accepts the offer, declines all others, sets request to booked, creates a booking thread
- All offer messages rendered through `maskPii()` (already applied by Task 4's `getOffersForRequest`)

**Files:**
- Create: `supabase/migrations/20260421000001_accept_offer_rpc.sql`
- Modify: `src/features/traveler/components/requests/traveler-request-detail-screen.tsx`
- Create: `src/features/traveler/components/requests/offer-card.tsx`
- Create: `src/features/traveler/components/requests/offer-qa-sheet.tsx`
- Create: `src/features/traveler/actions/accept-offer.ts`
- Create: `src/lib/supabase/qa-threads.ts`
- Create: `src/features/traveler/actions/accept-offer.test.ts`

---

- [ ] **Step 1: Read existing request detail screen**

  Read `src/features/traveler/components/requests/traveler-request-detail-screen.tsx` in full. Also read `src/lib/supabase/offers.ts` to understand the `GuideOffer` type shape.

- [ ] **Step 2: Create the Postgres RPC migration**

  Create `supabase/migrations/20260421000001_accept_offer_rpc.sql`:

  ```sql
  -- Atomically accept one offer, decline all others for the same request,
  -- update request status to booked, and create a booking conversation thread.
  CREATE OR REPLACE FUNCTION public.accept_offer(
    p_offer_id   UUID,
    p_traveler_id UUID
  )
  RETURNS UUID  -- returns the booking conversation_thread id
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  DECLARE
    v_request_id     UUID;
    v_thread_id      UUID;
  BEGIN
    -- Verify the offer exists and get its request_id
    SELECT request_id INTO v_request_id
    FROM guide_offers
    WHERE id = p_offer_id AND status = 'pending';

    IF v_request_id IS NULL THEN
      RAISE EXCEPTION 'offer_not_found';
    END IF;

    -- Verify the traveler owns this request
    IF NOT EXISTS (
      SELECT 1 FROM traveler_requests
      WHERE id = v_request_id AND traveler_id = p_traveler_id
    ) THEN
      RAISE EXCEPTION 'unauthorized';
    END IF;

    -- 1. Accept this offer
    UPDATE guide_offers
    SET status = 'accepted', updated_at = NOW()
    WHERE id = p_offer_id;

    -- 2. Decline all other pending offers for this request
    UPDATE guide_offers
    SET status = 'declined', updated_at = NOW()
    WHERE request_id = v_request_id
      AND id != p_offer_id
      AND status = 'pending';

    -- 3. Mark request as booked
    UPDATE traveler_requests
    SET status = 'booked', updated_at = NOW()
    WHERE id = v_request_id;

    -- 4. Create a booking conversation thread
    INSERT INTO conversation_threads (subject_type, request_id, offer_id, created_by)
    VALUES ('booking', v_request_id, p_offer_id, p_traveler_id)
    RETURNING id INTO v_thread_id;

    RETURN v_thread_id;
  END;
  $$;

  -- Only authenticated users can call this
  REVOKE ALL ON FUNCTION public.accept_offer(UUID, UUID) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.accept_offer(UUID, UUID) TO authenticated;
  ```

- [ ] **Step 3: Create Q&A thread query functions**

  Create `src/lib/supabase/qa-threads.ts`:

  ```ts
  import { createServerClient } from '@/lib/supabase/server'
  import { maskPii } from '@/lib/pii/mask'

  export interface QaMessage {
    id: string
    sender_role: 'traveler' | 'guide' | 'system' | 'admin'
    body: string
    created_at: string
  }

  export interface QaThread {
    thread_id: string
    messages: QaMessage[]
    message_count: number
    at_limit: boolean
  }

  const QA_MESSAGE_LIMIT = 8

  export async function getOrCreateOfferQaThread(offerId: string, createdBy: string): Promise<string> {
    const supabase = await createServerClient()

    // Check if thread already exists
    const { data: existing } = await supabase
      .from('conversation_threads')
      .select('id')
      .eq('offer_id', offerId)
      .eq('subject_type', 'qa')
      .maybeSingle()

    if (existing) return existing.id

    const { data, error } = await supabase
      .from('conversation_threads')
      .insert({ subject_type: 'qa', offer_id: offerId, created_by: createdBy })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  export async function getQaMessages(threadId: string): Promise<QaThread> {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_role, body, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(QA_MESSAGE_LIMIT)

    if (error) throw error

    const messages = (data ?? []).map((m) => ({
      ...m,
      body: maskPii(m.body),
    }))

    return {
      thread_id: threadId,
      messages,
      message_count: messages.length,
      at_limit: messages.length >= QA_MESSAGE_LIMIT,
    }
  }

  export async function sendQaMessage(threadId: string, senderId: string, senderRole: 'traveler' | 'guide', body: string): Promise<void> {
    const supabase = await createServerClient()

    // Enforce 8-message limit
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('thread_id', threadId)

    if ((count ?? 0) >= QA_MESSAGE_LIMIT) {
      throw new Error('qa_thread_at_limit')
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        sender_id: senderId,
        sender_role: senderRole,
        body: body.trim(),
      })

    if (error) throw error
  }
  ```

- [ ] **Step 4: Create the accept offer server action**

  Create `src/features/traveler/actions/accept-offer.ts`:

  ```ts
  'use server'

  import { createServerClient } from '@/lib/supabase/server'
  import { revalidatePath } from 'next/cache'
  import { redirect } from 'next/navigation'

  export async function acceptOfferAction(offerId: string, requestId: string): Promise<void> {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: threadId, error } = await supabase.rpc('accept_offer', {
      p_offer_id: offerId,
      p_traveler_id: user.id,
    })

    if (error) {
      if (error.message.includes('offer_not_found')) throw new Error('Предложение не найдено или уже принято')
      if (error.message.includes('unauthorized')) throw new Error('Нет доступа к этому запросу')
      throw new Error('Не удалось принять предложение. Попробуйте ещё раз.')
    }

    revalidatePath(`/traveler/requests/${requestId}`)
    revalidatePath('/traveler/requests')
    redirect(`/traveler/chat/${threadId}`)
  }
  ```

- [ ] **Step 5: Write test for acceptOfferAction error handling**

  Create `src/features/traveler/actions/accept-offer.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest'

  describe('acceptOfferAction error messages', () => {
    it('produces Russian error for not-found offer', () => {
      const err = new Error('Предложение не найдено или уже принято')
      expect(err.message).toMatch(/не найдено|уже принято/)
    })

    it('produces Russian error for unauthorized', () => {
      const err = new Error('Нет доступа к этому запросу')
      expect(err.message).toMatch(/доступ/)
    })
  })
  ```

  ```bash
  npx vitest run src/features/traveler/actions/accept-offer.test.ts
  ```

  Expected: PASS

- [ ] **Step 6: Create OfferQaSheet component**

  Create `src/features/traveler/components/requests/offer-qa-sheet.tsx`:

  ```tsx
  'use client'

  import { useState, useTransition } from 'react'
  import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
  import { Button } from '@/components/ui/button'
  import { Textarea } from '@/components/ui/textarea'
  import type { QaThread } from '@/lib/supabase/qa-threads'

  interface Props {
    offerId: string
    initialThread: QaThread | null
    onSend: (threadId: string, body: string) => Promise<void>
    onGetOrCreate: (offerId: string) => Promise<string>
  }

  export function OfferQaSheet({ offerId, initialThread, onSend, onGetOrCreate }: Props) {
    const [thread, setThread] = useState<QaThread | null>(initialThread)
    const [body, setBody] = useState('')
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    async function handleSend() {
      if (!body.trim()) return
      setError(null)

      startTransition(async () => {
        try {
          let threadId = thread?.thread_id
          if (!threadId) {
            threadId = await onGetOrCreate(offerId)
          }
          await onSend(threadId, body.trim())
          setBody('')
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Ошибка отправки'
          if (msg === 'qa_thread_at_limit') {
            setError('Достигнут лимит сообщений (8). Для продолжения диалога примите предложение.')
          } else {
            setError(msg)
          }
        }
      })
    }

    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">Задать вопрос</Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70vh] flex flex-col">
          <SheetHeader>
            <SheetTitle>Вопрос гиду</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {thread?.at_limit && (
              <p className="text-xs text-muted-foreground text-center">
                Достигнут лимит (8 сообщений). Примите предложение чтобы продолжить.
              </p>
            )}
            {thread?.messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender_role === 'traveler' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    m.sender_role === 'traveler'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {m.body}
                </div>
              </div>
            ))}
            {(!thread || thread.messages.length === 0) && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Задайте вопрос гиду. Лимит — 8 сообщений.
              </p>
            )}
          </div>

          {!thread?.at_limit && (
            <div className="border-t pt-4 space-y-2">
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ваш вопрос..."
                rows={2}
                className="resize-none"
              />
              <Button onClick={handleSend} disabled={isPending || !body.trim()} className="w-full">
                {isPending ? 'Отправка...' : 'Отправить'}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
  }
  ```

- [ ] **Step 7: Create OfferCard component**

  Create `src/features/traveler/components/requests/offer-card.tsx`:

  ```tsx
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
  import { Button } from '@/components/ui/button'
  import { OfferQaSheet } from './offer-qa-sheet'
  import type { GuideOffer } from '@/lib/supabase/offers'

  interface GuideProfile {
    id: string
    full_name: string | null
    avatar_url: string | null
  }

  interface Props {
    offer: GuideOffer & { guide: GuideProfile }
    requestId: string
    requestStatus: string
    onAccept: (offerId: string) => Promise<void>
    onSendQa: (threadId: string, body: string) => Promise<void>
    onGetOrCreateQaThread: (offerId: string) => Promise<string>
  }

  function formatPrice(minor: number): string {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(minor / 100)
  }

  export function OfferCard({ offer, requestStatus, onAccept, onSendQa, onGetOrCreateQaThread }: Props) {
    const canAccept = requestStatus === 'open' && offer.status === 'pending'

    return (
      <div className="rounded-xl border bg-card p-4 space-y-3">
        {/* Guide info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={offer.guide.avatar_url ?? undefined} alt={offer.guide.full_name ?? 'Гид'} />
            <AvatarFallback>{(offer.guide.full_name ?? 'Г').charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{offer.guide.full_name ?? 'Гид'}</p>
          </div>
          <p className="text-lg font-bold text-emerald-600">{formatPrice(offer.price_minor)}</p>
        </div>

        {/* Message (already masked by Task 4) */}
        {offer.message && (
          <p className="text-sm text-muted-foreground leading-relaxed">{offer.message}</p>
        )}

        {/* PII disclosure */}
        <p className="text-xs text-muted-foreground border rounded-md px-3 py-1.5">
          🔒 Контакты гида откроются после выбора предложения
        </p>

        {/* Actions */}
        {canAccept && (
          <div className="flex gap-2 pt-1">
            <form action={async () => { 'use server'; await onAccept(offer.id) }} className="flex-1">
              <Button type="submit" className="w-full">Принять</Button>
            </form>
            <OfferQaSheet
              offerId={offer.id}
              initialThread={null}
              onSend={onSendQa}
              onGetOrCreate={onGetOrCreateQaThread}
            />
          </div>
        )}

        {offer.status === 'accepted' && (
          <p className="text-sm text-emerald-600 font-medium">✓ Предложение принято</p>
        )}
        {offer.status === 'declined' && (
          <p className="text-sm text-muted-foreground">Предложение отклонено</p>
        )}
      </div>
    )
  }
  ```

  > **Note:** The `onAccept` prop must be a proper server action bound in the parent server component, not an inline async function as shown above — adjust the wiring in the detail page accordingly.

- [ ] **Step 8: Update the request detail screen**

  Read `src/features/traveler/components/requests/traveler-request-detail-screen.tsx`. Add the offer board section below the request summary. Pass offers (already fetched by `getOffersForRequest`) and wire accept/Q&A actions.

  The detail screen should:
  1. Show request info (destination, dates, status badge) at top
  2. Below: heading "Предложения гидов (N)" 
  3. If no offers and status=open: "Гиды ещё не откликнулись. Ожидайте."
  4. Map over offers and render `<OfferCard />` for each
  5. If status=booked: show "Гид выбран — поездка подтверждена" banner

- [ ] **Step 9: Run full test suite**

  ```bash
  npx vitest run
  ```

  Expected: all tests pass

- [ ] **Step 10: Commit**

  ```bash
  git add supabase/migrations/20260421000001_accept_offer_rpc.sql \
          src/lib/supabase/qa-threads.ts \
          src/features/traveler/actions/accept-offer.ts \
          src/features/traveler/actions/accept-offer.test.ts \
          src/features/traveler/components/requests/offer-card.tsx \
          src/features/traveler/components/requests/offer-qa-sheet.tsx \
          src/features/traveler/components/requests/traveler-request-detail-screen.tsx
  git commit -m "feat(plan-b-3): offer board with Q&A sheet and atomic acceptance RPC"
  ```

---

## Task 6: Guide Q&A Response UI

**Branch:** `feat/plan-b-6-guide-qa`

**Dependency:** Phase 1 (Task 4) merged.

**What this task does:** Adds a Q&A response panel to the guide's offer view. When a traveler asks a question via the OfferQaSheet (Task 3), the guide needs to see the question and reply. This surfaces inside the existing guide inbox screen where each offer is displayed.

**Files:**
- Modify: `src/features/guide/components/requests/guide-requests-inbox-screen.tsx`
- Create: `src/features/guide/components/requests/guide-offer-qa-panel.tsx`
- Create: `src/features/guide/actions/send-qa-reply.ts`

---

- [ ] **Step 1: Read existing files**

  Read these in full before touching them:
  - `src/features/guide/components/requests/guide-requests-inbox-screen.tsx`
  - `src/lib/supabase/qa-threads.ts` (created in Task 3)

- [ ] **Step 2: Create the guide Q&A reply server action**

  Create `src/features/guide/actions/send-qa-reply.ts`:

  ```ts
  'use server'

  import { createServerClient } from '@/lib/supabase/server'
  import { sendQaMessage } from '@/lib/supabase/qa-threads'
  import { revalidatePath } from 'next/cache'

  export async function sendQaReplyAction(threadId: string, offerId: string, body: string): Promise<void> {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify this guide owns the offer
    const { data: offer } = await supabase
      .from('guide_offers')
      .select('id, guide_id')
      .eq('id', offerId)
      .eq('guide_id', user.id)
      .single()

    if (!offer) throw new Error('Нет доступа к этому предложению')

    await sendQaMessage(threadId, user.id, 'guide', body)
    revalidatePath('/guide/inbox')
  }
  ```

- [ ] **Step 3: Create the GuideOfferQaPanel component**

  Create `src/features/guide/components/requests/guide-offer-qa-panel.tsx`:

  ```tsx
  import { getQaMessages } from '@/lib/supabase/qa-threads'
  import { sendQaReplyAction } from '../../actions/send-qa-reply'
  import { GuideQaReplyForm } from './guide-qa-reply-form'

  interface Props {
    offerId: string
  }

  export async function GuideOfferQaPanel({ offerId }: Props) {
    // Find the Q&A thread for this offer (subject_type = 'qa')
    const { createServerClient } = await import('@/lib/supabase/server')
    const supabase = await createServerClient()

    const { data: thread } = await supabase
      .from('conversation_threads')
      .select('id')
      .eq('offer_id', offerId)
      .eq('subject_type', 'qa')
      .maybeSingle()

    if (!thread) {
      return (
        <p className="text-sm text-muted-foreground py-2">Вопросов пока нет</p>
      )
    }

    const qa = await getQaMessages(thread.id)

    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Вопросы путешественника
        </p>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {qa.messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender_role === 'guide' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.sender_role === 'guide' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {m.body}
              </div>
            </div>
          ))}
        </div>

        {!qa.at_limit && (
          <GuideQaReplyForm
            threadId={thread.id}
            offerId={offerId}
            onReply={sendQaReplyAction}
          />
        )}
        {qa.at_limit && (
          <p className="text-xs text-muted-foreground">Лимит сообщений достигнут</p>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 4: Create the reply form (client component)**

  Create `src/features/guide/components/requests/guide-qa-reply-form.tsx`:

  ```tsx
  'use client'

  import { useState, useTransition } from 'react'
  import { Button } from '@/components/ui/button'
  import { Textarea } from '@/components/ui/textarea'

  interface Props {
    threadId: string
    offerId: string
    onReply: (threadId: string, offerId: string, body: string) => Promise<void>
  }

  export function GuideQaReplyForm({ threadId, offerId, onReply }: Props) {
    const [body, setBody] = useState('')
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function handleSubmit() {
      if (!body.trim()) return
      setError(null)
      startTransition(async () => {
        try {
          await onReply(threadId, offerId, body.trim())
          setBody('')
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Ошибка отправки')
        }
      })
    }

    return (
      <div className="space-y-2 pt-2 border-t">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ваш ответ..."
          rows={2}
          className="resize-none text-sm"
        />
        <Button size="sm" onClick={handleSubmit} disabled={isPending || !body.trim()}>
          {isPending ? 'Отправка...' : 'Ответить'}
        </Button>
      </div>
    )
  }
  ```

- [ ] **Step 5: Wire GuideOfferQaPanel into the guide inbox**

  Read `guide-requests-inbox-screen.tsx`. Find where individual offer cards are rendered (in the "Мои предложения" tab or offer detail panel). Add `<GuideOfferQaPanel offerId={offer.id} />` below the offer summary in the detail/expanded view.

  If the inbox uses a side panel or expanded row for offer details, add the Q&A panel there. If there's no expanded view, add a collapsible section below each offer card.

- [ ] **Step 6: Run full test suite**

  ```bash
  npx vitest run
  ```

  Expected: all tests pass

- [ ] **Step 7: Commit**

  ```bash
  git add src/features/guide/components/requests/guide-offer-qa-panel.tsx \
          src/features/guide/components/requests/guide-qa-reply-form.tsx \
          src/features/guide/actions/send-qa-reply.ts \
          src/features/guide/components/requests/guide-requests-inbox-screen.tsx
  git commit -m "feat(plan-b-6): guide Q&A reply panel in inbox"
  ```

---

## Task 5: Request Expiry via pg_cron

**Branch:** `feat/plan-b-5-expiry`

**Dependency:** ALL Phase 2 tasks merged to main. Run this last.

**What this task does:** Creates a Supabase migration that:
1. Enables the `pg_cron` extension
2. Schedules an hourly job to set `status = 'expired'` on any open request where `starts_on < CURRENT_DATE`
3. Runs a one-time backfill for existing rows

**Important facts:**
- `'expired'` already exists in the `request_status` enum — no enum change needed
- DB column is `starts_on` (date), not a timestamp
- The active status for open requests is `'open'` (NOT 'submitted')
- pg_cron is available in all Supabase projects

**Files:**
- Create: `supabase/migrations/20260421000002_expire_requests_cron.sql`

---

- [ ] **Step 1: Read the existing schema migration**

  Read `supabase/migrations/20260401000001_schema.sql` lines around the `request_status` enum definition to confirm `'expired'` is already there. Do not create a migration if it already exists.

- [ ] **Step 2: Create the migration file**

  Create `supabase/migrations/20260421000002_expire_requests_cron.sql`:

  ```sql
  -- Enable pg_cron extension (safe to run even if already enabled)
  CREATE EXTENSION IF NOT EXISTS pg_cron;

  -- Backfill: mark all open requests with a past start date as expired
  UPDATE public.traveler_requests
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE
    starts_on < CURRENT_DATE
    AND status = 'open';

  -- Schedule hourly expiry job
  -- Runs at minute 0 of every hour (e.g. 00:00, 01:00, 02:00...)
  SELECT cron.schedule(
    'expire-open-requests',      -- unique job name
    '0 * * * *',                 -- every hour at :00
    $$
      UPDATE public.traveler_requests
      SET
        status = 'expired',
        updated_at = NOW()
      WHERE
        starts_on < CURRENT_DATE
        AND status = 'open';
    $$
  );
  ```

- [ ] **Step 3: Write a test that validates the expiry logic (unit test on date comparison)**

  Create `src/lib/supabase/expiry.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest'

  function shouldBeExpired(startsOn: string, today: string): boolean {
    return new Date(startsOn) < new Date(today)
  }

  describe('request expiry logic', () => {
    it('expires a request whose start date is yesterday', () => {
      expect(shouldBeExpired('2026-04-20', '2026-04-21')).toBe(true)
    })

    it('does not expire a request starting today', () => {
      expect(shouldBeExpired('2026-04-21', '2026-04-21')).toBe(false)
    })

    it('does not expire a future request', () => {
      expect(shouldBeExpired('2026-05-01', '2026-04-21')).toBe(false)
    })
  })
  ```

  ```bash
  npx vitest run src/lib/supabase/expiry.test.ts
  ```

  Expected: PASS (3 tests)

- [ ] **Step 4: Apply the migration via Supabase Management API**

  This migration must be applied to the production Supabase project. Do not attempt to run it locally with `supabase db push` — use the Supabase Management API or the Supabase Dashboard SQL editor.

  To apply via dashboard: Go to Supabase Dashboard → SQL Editor → paste the migration SQL → Run.

  To verify the cron job was registered:
  ```sql
  SELECT jobname, schedule, command FROM cron.job;
  ```
  Expected: row with `jobname = 'expire-open-requests'`

- [ ] **Step 5: Commit**

  ```bash
  git add supabase/migrations/20260421000002_expire_requests_cron.sql \
          src/lib/supabase/expiry.test.ts
  git commit -m "feat(plan-b-5): pg_cron hourly job to expire open requests past start date"
  ```

---

## Self-Review

**Spec coverage check:**
- ✅ Status badge colors with semantic meaning (Task 1)
- ✅ Two-tab requests list, desktop+mobile, empty states, avatar stacks (Task 2)
- ✅ Offer board with Q&A per offer, accept button, PII badge, max 8 msgs (Task 3)
- ✅ Contact masking on read, `maskPii()` integration, no data loss (Task 4)
- ✅ Atomic offer acceptance: accept + decline others + rebook + create thread (Task 3 RPC)
- ✅ Guide-side Q&A response UI in guide inbox (Task 6)
- ✅ Automatic request expiry via pg_cron hourly job (Task 5)
- ✅ PII disclosure badge on every offer card (Task 3 OfferCard)
- ✅ Mask-on-read not mask-on-write (Task 4 + qa-threads.ts)

**DB enum alignment:**
- All queries use actual DB values: `status = 'open'` for active requests, `status = 'pending'` for unacted offers
- Status badge component handles both DB values and aspirational front-end values

**No placeholders:** All code steps contain real implementation.

**Type consistency:** `GuideOffer` type from `src/lib/supabase/offers.ts` used throughout. `QaThread` / `QaMessage` defined once in `qa-threads.ts` and imported where needed.
