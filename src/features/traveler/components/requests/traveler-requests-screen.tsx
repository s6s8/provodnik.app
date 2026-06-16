'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  RequestCardFinal,
  type RequestCardFinalMember,
  type RequestCardFinalProps,
} from '@/components/shared/request-card-final'
import type {
  TravelerRequestSummary,
  ConfirmedBookingSummary,
  JoinedGroupSummary,
} from '@/lib/supabase/traveler-requests'

import {
  EmptyCabinet,
  type Inspiration,
} from '../empty-cabinet/empty-cabinet'
import { TripCard } from '../trip-card/trip-card'
import {
  mapBookingToTrip,
} from '../trip-card/trip-card-mappers'
import type { TripCardModel } from '../trip-card/trip-card-types'

interface Props {
  activeRequests: TravelerRequestSummary[]
  confirmedBookings: ConfirmedBookingSummary[]
  joinedGroups?: JoinedGroupSummary[]
  inspirations?: Inspiration[]
}

type CategoryTab = 'active' | 'joined' | 'confirmed'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function getCreatedAtTime(request: TravelerRequestSummary): number {
  const time = Date.parse(request.created_at)
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time
}

function getPriorityBucket(
  request: TravelerRequestSummary,
  freshCutoff: number
): number {
  if (request.offer_count > 0) return 0
  return getCreatedAtTime(request) >= freshCutoff ? 1 : 2
}

function sortByPriority(
  requests: TravelerRequestSummary[]
): TravelerRequestSummary[] {
  const freshCutoff = Date.now() - SEVEN_DAYS_MS

  return [...requests].sort((a, b) => {
    const priorityDiff =
      getPriorityBucket(a, freshCutoff) - getPriorityBucket(b, freshCutoff)

    if (priorityDiff !== 0) return priorityDiff

    return getCreatedAtTime(b) - getCreatedAtTime(a)
  })
}

function formatDateRange(startsOn: string, endsOn?: string | null): string {
  const start = new Date(startsOn)
  if (Number.isNaN(start.getTime())) return startsOn
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const s = start.toLocaleDateString('ru-RU', opts)
  if (!endsOn || endsOn === startsOn) return s
  const end = new Date(endsOn)
  if (Number.isNaN(end.getTime())) return s
  return `${s} – ${end.toLocaleDateString('ru-RU', opts)}`
}

function formatPrice(budgetMinor: number | null): string {
  if (budgetMinor == null) return 'По договоренности'
  const rub = budgetMinor / 100
  return `${new Intl.NumberFormat('ru-RU').format(rub)} ₽ / чел`
}

function formatPublishedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
}

function mapRequestToCard(request: TravelerRequestSummary): RequestCardFinalProps {
  const members: RequestCardFinalMember[] = []

  return {
    href: `/requests/${request.id}`,
    location: request.destination,
    date: formatDateRange(request.starts_on, request.ends_on),
    time: request.start_time ? `${request.start_time.slice(0, 5)}${request.end_time ? `–${request.end_time.slice(0, 5)}` : ''}` : undefined,
    groupType: request.mode,
    guideState: request.status === 'booked' ? 'found' : request.offer_count > 0 ? 'offers' : 'waiting',
    offerCount: request.offer_count > 0 ? request.offer_count : undefined,
    datesFlexible: request.date_flexibility != null && request.date_flexibility !== 'exact',
    interests: request.interests,
    members,
    participantCount: request.participants_count,
    price: formatPrice(request.budget_minor),
    groupPrice: request.budget_minor != null
      ? `~${new Intl.NumberFormat('ru-RU').format(Math.round(request.budget_minor * request.participants_count / 100))} ₽ за группу`
      : undefined,
    publishedAt: request.created_at ? formatPublishedAt(request.created_at) : undefined,
    unreadOfferCount: request.unread_offer_count,
  }
}

function mapJoinedGroupToTrip(group: JoinedGroupSummary): TripCardModel {
  return {
    id: group.id,
    destination: group.destination,
    startsOn: group.starts_on,
    endsOn: group.ends_on,
    startTime: group.start_time,
    participantsCount: group.participants_count,
    budget:
      group.budget_minor == null
        ? null
        : { amount: group.budget_minor, currency: 'RUB' },
    isOwnRequest: false,
    guideName: null,
    guideAvatarUrl: null,
    organizerName: group.owner_name,
  }
}

function CategoryEmptyState({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="rounded-[var(--card-radius)] border border-dashed border-[var(--outline)] bg-[var(--surface-lowest)] p-8 text-center text-sm text-[var(--on-surface-muted)] shadow-[var(--card-shadow)]">
      {children}
    </div>
  )
}

function CategoryGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4">{children}</div>
}

function RequestsCategoryTabs({
  activeRequests,
  confirmedBookings,
  joinedGroups,
}: {
  activeRequests: TravelerRequestSummary[]
  confirmedBookings: ConfirmedBookingSummary[]
  joinedGroups: JoinedGroupSummary[]
}) {
  const defaultTab =
    activeRequests.length === 0 && joinedGroups.length > 0 ? 'joined' : 'active'
  const [categoryTab, setCategoryTab] = useState<CategoryTab>(defaultTab)
  const sortedActiveRequests = sortByPriority(activeRequests)

  const handleCategoryTabChange = (nextTab: string) => {
    if (
      nextTab === 'active' ||
      nextTab === 'joined' ||
      nextTab === 'confirmed'
    ) {
      setCategoryTab(nextTab)
    }
  }

  return (
    <Tabs value={categoryTab} onValueChange={handleCategoryTabChange}>
      <TabsList className="mb-5 grid h-auto w-full grid-cols-3 gap-1 rounded-[18px] border border-[var(--outline)] bg-[var(--surface-lowest)] p-1 shadow-[var(--card-shadow)]">
        <TabsTrigger
          value="active"
          onClick={() => setCategoryTab('active')}
          className="rounded-[14px] px-3 py-2.5 text-sm font-semibold text-[var(--on-surface-muted)] transition-colors data-[state=active]:bg-[var(--brand-50)] data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-none"
        >
          Активные
          {activeRequests.length > 0 ? ` (${activeRequests.length})` : ''}
        </TabsTrigger>
        <TabsTrigger
          value="confirmed"
          onClick={() => setCategoryTab('confirmed')}
          className="rounded-[14px] px-3 py-2.5 text-sm font-semibold text-[var(--on-surface-muted)] transition-colors data-[state=active]:bg-[var(--brand-50)] data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-none"
        >
          Подтверждённые
          {confirmedBookings.length > 0 ? ` (${confirmedBookings.length})` : ''}
        </TabsTrigger>
        <TabsTrigger
          value="joined"
          onClick={() => setCategoryTab('joined')}
          className="rounded-[14px] px-3 py-2.5 text-sm font-semibold text-[var(--on-surface-muted)] transition-colors data-[state=active]:bg-[var(--brand-50)] data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-none"
        >
          Мои группы
          {joinedGroups.length > 0 ? ` (${joinedGroups.length})` : ''}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        {activeRequests.length > 0 ? (
          <CategoryGrid>
            {sortedActiveRequests.map((request) => (
              <RequestCardFinal key={request.id} {...mapRequestToCard(request)} />
            ))}
          </CategoryGrid>
        ) : (
          <CategoryEmptyState>
            <p className="mb-4 text-base font-medium text-[var(--on-surface)]">
              У вас ещё нет запросов
            </p>
            <Button
              asChild
              className="rounded-[14px] bg-[var(--primary)] px-6 py-3 font-semibold text-white shadow-none transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
            >
              <Link href="/">Создать первый запрос</Link>
            </Button>
          </CategoryEmptyState>
        )}
      </TabsContent>
      <TabsContent value="confirmed">
        {confirmedBookings.length > 0 ? (
          <CategoryGrid>
            {confirmedBookings.map((booking) => (
              <TripCard
                key={booking.booking_id}
                phase="upcoming"
                trip={mapBookingToTrip(booking)}
              />
            ))}
          </CategoryGrid>
        ) : (
          <CategoryEmptyState>
            <p className="text-base font-medium text-[var(--on-surface)]">
              Подтверждённых поездок пока нет
            </p>
          </CategoryEmptyState>
        )}
      </TabsContent>
      <TabsContent value="joined">
        {joinedGroups.length > 0 ? (
          <CategoryGrid>
            {joinedGroups.map((group) => (
              <TripCard
                key={group.id}
                phase="upcoming"
                trip={mapJoinedGroupToTrip(group)}
              />
            ))}
          </CategoryGrid>
        ) : (
          <CategoryEmptyState>
            <p className="mb-4 text-base font-medium text-[var(--on-surface)]">
              Вы пока не присоединились ни к одной группе
            </p>
            <Button
              asChild
              variant="outline"
              className="rounded-[14px] border-[var(--outline)] bg-[var(--surface-lowest)] px-6 py-3 font-semibold text-[var(--primary)] transition hover:-translate-y-0.5 hover:bg-[var(--brand-50)]"
            >
              <Link href="/requests">Найти группу</Link>
            </Button>
          </CategoryEmptyState>
        )}
      </TabsContent>
    </Tabs>
  )
}

export function TravelerRequestsScreen({
  activeRequests,
  confirmedBookings,
  joinedGroups = [],
  inspirations = [],
}: Props) {
  const hasTrips =
    activeRequests.length > 0 ||
    confirmedBookings.length > 0 ||
    joinedGroups.length > 0

  if (!hasTrips) {
    return (
      <section className="bg-[var(--surface)] px-4 py-8 text-[var(--on-surface)]">
        <EmptyCabinet inspirations={inspirations} />
      </section>
    )
  }

  return (
    <section className="bg-[var(--surface)] px-4 py-8 text-[var(--on-surface)]">
      <div className="mx-auto max-w-3xl space-y-7">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--primary)]">
            Кабинет путешественника
          </p>
          <div className="space-y-2">
            <h1 className="text-[clamp(30px,4.4vw,44px)] font-semibold leading-[1.04] text-[var(--on-surface)]">
              Мои поездки
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--on-surface-muted)]">
              Статусы запросов, предложений и подтверждённых поездок собраны в одном месте.
            </p>
          </div>
        </header>
        <RequestsCategoryTabs
          activeRequests={activeRequests}
          confirmedBookings={confirmedBookings}
          joinedGroups={joinedGroups}
        />
      </div>
    </section>
  )
}
