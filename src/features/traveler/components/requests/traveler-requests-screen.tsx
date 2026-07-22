'use client'

import Link from 'next/link'
import { CalendarCheck, FileText, Users } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { formatRubNumber, kopecksToRub } from '@/data/money'
import { formatRussianDateRange, formatRussianDateTime } from '@/lib/dates'
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

function formatPrice(budgetMinor: number | null): string {
  if (budgetMinor == null) return 'По договоренности'
  const rub = kopecksToRub(budgetMinor)
  return `${formatRubNumber(rub)} ₽ / чел`
}

function mapRequestToCard(request: TravelerRequestSummary): RequestCardFinalProps {
  const members: RequestCardFinalMember[] = []
  const datesFlexible = request.date_flexibility != null && request.date_flexibility !== 'exact'

  return {
    href: `/requests/${request.id}`,
    location: request.destination,
    date: formatRussianDateRange(request.starts_on, request.ends_on),
    time: datesFlexible
      ? undefined
      : request.start_time
        ? `${request.start_time.slice(0, 5)}${request.end_time ? `–${request.end_time.slice(0, 5)}` : ''}`
        : undefined,
    groupType: request.mode,
    guideState: request.status === 'expired' ? 'expired' : request.status === 'booked' ? 'found' : request.offer_count > 0 ? 'offers' : 'waiting',
    offerCount: request.offer_count > 0 ? request.offer_count : undefined,
    datesFlexible,
    timeFlexible: datesFlexible,
    interests: request.interests,
    members,
    participantCount: request.participants_count,
    price: formatPrice(request.budget_minor),
    groupPrice: request.budget_minor != null
      ? `~${formatRubNumber(Math.round(kopecksToRub(request.budget_minor) * request.participants_count))} ₽ за группу`
      : undefined,
    publishedAt: request.created_at ? formatRussianDateTime(request.created_at) : undefined,
    unreadOfferCount: request.unread_offer_count,
  }
}

function mapJoinedGroupToTrip(group: JoinedGroupSummary): TripCardModel {
  return {
    id: group.id,
    kind: "request",
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

function CategoryGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3">{children}</div>
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
      <TabsList className="mb-4 flex w-full">
        <TabsTrigger
          value="active"
          className="px-2 sm:px-4"
          onClick={() => setCategoryTab('active')}
        >
          Активные
          {activeRequests.length > 0 ? ` (${activeRequests.length})` : ''}
        </TabsTrigger>
        <TabsTrigger
          value="confirmed"
          className="px-2 sm:px-4"
          onClick={() => setCategoryTab('confirmed')}
        >
          Подтверждено
          {confirmedBookings.length > 0 ? ` (${confirmedBookings.length})` : ''}
        </TabsTrigger>
        <TabsTrigger
          value="joined"
          className="px-2 sm:px-4"
          onClick={() => setCategoryTab('joined')}
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
          <EmptyState
            icon={<FileText className="size-6" />}
            title="У вас ещё нет запросов"
            description="Создайте запрос — гиды предложат свои условия, а вы выберете лучшее."
            action={
              <Button asChild>
                <Link href="/">Создать запрос</Link>
              </Button>
            }
          />
        )}
      </TabsContent>
      <TabsContent value="confirmed">
        {confirmedBookings.length > 0 ? (
          <CategoryGrid>
            {confirmedBookings.map((booking) => (
              <TripCard
                key={booking.booking_id}
                phase="upcoming"
                trip={{ ...mapBookingToTrip(booking), kind: "booking" }}
              />
            ))}
          </CategoryGrid>
        ) : (
          <EmptyState
            icon={<CalendarCheck className="size-6" />}
            title="Подтверждённых поездок пока нет"
            description="Когда вы примете предложение гида, поездка появится здесь."
          />
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
          <EmptyState
            icon={<Users className="size-6" />}
            title="Вы пока не присоединились ни к одной группе"
            description="Найдите сборную группу по душе и присоединяйтесь к попутчикам."
            action={
              <Button asChild variant="outline">
                <Link href="/requests">Найти группу</Link>
              </Button>
            }
          />
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
    return <EmptyCabinet inspirations={inspirations} />
  }

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6 px-4 py-6">
      <PageHeader title="Мои запросы" />
      <RequestsCategoryTabs
        activeRequests={activeRequests}
        confirmedBookings={confirmedBookings}
        joinedGroups={joinedGroups}
      />
    </div>
  )
}
