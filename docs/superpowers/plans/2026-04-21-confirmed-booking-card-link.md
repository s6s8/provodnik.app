# Confirmed Booking Card Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the confirmed booking card in the "Подтверждённые" tab clickable — it should navigate to the booking detail page at `/traveler/bookings/[bookingId]`.

**Architecture:** The `booking_id` (UUID) is already fetched from the DB in `getConfirmedBookings` but never mapped into the returned `ConfirmedBookingSummary` object. Adding it to the type and the mapper is the only data-layer change. The card component then wraps its outer element with a Next.js `<Link>`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Vitest + React Testing Library, Tailwind CSS.

---

## File Structure

| File | Change |
|------|--------|
| `src/lib/supabase/traveler-requests.ts` | Add `booking_id: string` to `ConfirmedBookingSummary` interface; add `booking_id: b.id` to mapper return |
| `src/features/traveler/components/requests/confirmed-booking-card.tsx` | Replace outer `<div>` with `<Link href="/traveler/bookings/{booking.booking_id}">` |
| `src/features/traveler/components/requests/confirmed-booking-card.test.tsx` | New test file — assert card renders an `<a>` pointing to correct URL |

---

### Task 1: Add `booking_id` to the data layer

**Files:**
- Modify: `src/lib/supabase/traveler-requests.ts:32-42` (interface)
- Modify: `src/lib/supabase/traveler-requests.ts:177-188` (mapper)

- [ ] **Step 1: Write the failing test**

Create `src/features/traveler/components/requests/confirmed-booking-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { ConfirmedBookingCard } from './confirmed-booking-card'
import type { ConfirmedBookingSummary } from '@/lib/supabase/traveler-requests'

const booking: ConfirmedBookingSummary = {
  booking_id: 'aabbccdd-0000-0000-0000-000000000001',
  request_id: '30000000-0000-4000-8000-000000000000',
  destination: 'Москва, Россия',
  starts_on: '2026-07-20',
  price_minor: 2450000,
  currency: 'RUB',
  guide_id: '00000000-0000-4000-8000-000000000002',
  guide_name: 'Демо Гид',
  guide_avatar_url: null,
  booking_thread_id: null,
}

describe('ConfirmedBookingCard', () => {
  it('wraps the card in a link to the booking detail page', () => {
    render(<ConfirmedBookingCard booking={booking} />)
    const link = screen.getByRole('link', { name: /москва/i })
    expect(link).toHaveAttribute('href', '/traveler/bookings/aabbccdd-0000-0000-0000-000000000001')
  })

  it('shows guide name and price', () => {
    render(<ConfirmedBookingCard booking={booking} />)
    expect(screen.getByText('Демо Гид')).toBeInTheDocument()
    expect(screen.getByText(/24 500/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd provodnik.app && npx vitest run src/features/traveler/components/requests/confirmed-booking-card.test.tsx
```

Expected: FAIL — `booking_id` does not exist on `ConfirmedBookingSummary`, TypeScript error.

- [ ] **Step 3: Add `booking_id` to the interface**

In `src/lib/supabase/traveler-requests.ts`, change lines 32–42:

```ts
export interface ConfirmedBookingSummary {
  booking_id: string          // ← add this line
  request_id: string
  destination: string
  starts_on: string
  price_minor: number
  currency: string
  guide_id: string
  guide_name: string | null
  guide_avatar_url: string | null
  booking_thread_id: string | null
}
```

- [ ] **Step 4: Add `booking_id` to the mapper return**

In `src/lib/supabase/traveler-requests.ts`, change the `return` block inside `bookings.map((b) => { ... })` (currently lines 177–188):

```ts
  return bookings.map((b) => {
    const req = b.request_id ? requestMap.get(b.request_id) : null
    const profile = profileMap.get(b.guide_id) ?? { full_name: null, avatar_url: null }
    return {
      booking_id: b.id,                           // ← add this line
      request_id: b.request_id ?? b.id,
      destination: req?.destination ?? '—',
      starts_on: req?.starts_on ?? '',
      price_minor: b.subtotal_minor ?? 0,
      currency: b.currency ?? 'RUB',
      guide_id: b.guide_id ?? '',
      guide_name: profile.full_name,
      guide_avatar_url: profile.avatar_url,
      booking_thread_id: threadMap.get(b.id) ?? null,
    }
  })
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd provodnik.app && npx vitest run src/features/traveler/components/requests/confirmed-booking-card.test.tsx
```

Expected: FAIL still — card renders `<div>` not `<a>`. That is correct — Task 2 fixes the component.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/traveler-requests.ts src/features/traveler/components/requests/confirmed-booking-card.test.tsx
git commit -m "feat(traveler): add booking_id to ConfirmedBookingSummary + card link test"
```

---

### Task 2: Make the booking card a link

**Files:**
- Modify: `src/features/traveler/components/requests/confirmed-booking-card.tsx`

Current file for reference:

```tsx
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { ConfirmedBookingSummary } from '@/lib/supabase/traveler-requests'

function formatPrice(minor: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(minor / 100)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function ConfirmedBookingCard({ booking }: { booking: ConfirmedBookingSummary }) {
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
        <p className="text-sm font-medium text-emerald-600 shrink-0">
          {formatPrice(booking.price_minor, booking.currency)}
        </p>
      </div>

      {booking.booking_thread_id && (
        <Button asChild variant="outline" size="sm" className="mt-3 w-full">
          <Link href={`/traveler/chat/${booking.booking_thread_id}`}>Написать гиду</Link>
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 1: Replace the outer `<div>` with `<Link>`**

Replace the entire file content with:

```tsx
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { ConfirmedBookingSummary } from '@/lib/supabase/traveler-requests'

function formatPrice(minor: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(minor / 100)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function ConfirmedBookingCard({ booking }: { booking: ConfirmedBookingSummary }) {
  return (
    <Link
      href={`/traveler/bookings/${booking.booking_id}`}
      className="block rounded-xl border bg-card p-4 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={booking.guide_avatar_url ?? undefined} alt={booking.guide_name ?? 'Гид'} />
          <AvatarFallback>{(booking.guide_name ?? 'Г').charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{booking.guide_name ?? 'Гид'}</p>
          <p className="text-xs text-muted-foreground">{booking.destination} · {formatDate(booking.starts_on)}</p>
        </div>
        <p className="text-sm font-medium text-emerald-600 shrink-0">
          {formatPrice(booking.price_minor, booking.currency)}
        </p>
      </div>

      {booking.booking_thread_id && (
        <Button asChild variant="outline" size="sm" className="mt-3 w-full" onClick={(e) => e.stopPropagation()}>
          <Link href={`/traveler/chat/${booking.booking_thread_id}`}>Написать гиду</Link>
        </Button>
      )}
    </Link>
  )
}
```

Note: `onClick={(e) => e.stopPropagation()` on the chat button prevents the outer link navigation firing when tapping "Написать гиду".

- [ ] **Step 2: Run all tests**

```bash
cd provodnik.app && npx vitest run src/features/traveler/components/requests/confirmed-booking-card.test.tsx
```

Expected: 2 PASS.

- [ ] **Step 3: Run full test suite to check for regressions**

```bash
cd provodnik.app && npx vitest run
```

Expected: all tests pass (160 existing + 2 new = 162 total). Zero failures.

- [ ] **Step 4: Type-check**

```bash
cd provodnik.app && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/traveler/components/requests/confirmed-booking-card.tsx
git commit -m "fix(traveler): make confirmed booking card a clickable link to booking detail"
```
