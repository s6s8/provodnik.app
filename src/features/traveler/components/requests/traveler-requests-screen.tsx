'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  mapRequestToPhase,
  mapRequestToTrip,
} from '../trip-card/trip-card-mappers'
import type { TripCardModel } from '../trip-card/trip-card-types'

interface Props {
  activeRequests: TravelerRequestSummary[]
  confirmedBookings: ConfirmedBookingSummary[]
  joinedGroups?: JoinedGroupSummary[]
  inspirations?: Inspiration[]
}

type CategoryTab = 'active' | 'joined' | 'confirmed'

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
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
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
      <TabsList className="mb-4 grid w-full grid-cols-3">
        <TabsTrigger value="active" onClick={() => setCategoryTab('active')}>
          Активные
          {activeRequests.length > 0 ? ` (${activeRequests.length})` : ''}
        </TabsTrigger>
        <TabsTrigger value="joined" onClick={() => setCategoryTab('joined')}>
          Мои группы
          {joinedGroups.length > 0 ? ` (${joinedGroups.length})` : ''}
        </TabsTrigger>
        <TabsTrigger
          value="confirmed"
          onClick={() => setCategoryTab('confirmed')}
        >
          Подтверждённые
          {confirmedBookings.length > 0 ? ` (${confirmedBookings.length})` : ''}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        {activeRequests.length > 0 ? (
          <CategoryGrid>
            {activeRequests.map((request) => (
              <TripCard
                key={request.id}
                phase={mapRequestToPhase(request)}
                trip={mapRequestToTrip(request)}
              />
            ))}
          </CategoryGrid>
        ) : (
          <CategoryEmptyState>
            <p className="mb-4">У вас ещё нет запросов</p>
            <Button asChild>
              <Link href="/traveler/requests/new">Создать первый запрос</Link>
            </Button>
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
            <p className="mb-4">
              Вы пока не присоединились ни к одной группе
            </p>
            <Button asChild variant="outline">
              <Link href="/requests">Найти группу</Link>
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
            <p>Подтверждённых поездок пока нет</p>
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
    return <EmptyCabinet inspirations={inspirations} />
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <RequestsCategoryTabs
        activeRequests={activeRequests}
        confirmedBookings={confirmedBookings}
        joinedGroups={joinedGroups}
      />
    </div>
  )
}
