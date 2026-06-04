'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'

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
import { groupTripsByPhase } from '../trip-card/group-by-phase'
import { TripCard } from '../trip-card/trip-card'
import {
  mapBookingToTrip,
  mapRequestToPhase,
  mapRequestToTrip,
} from '../trip-card/trip-card-mappers'
import type { TripCardModel, TripPhase } from '../trip-card/trip-card-types'
import { CabinetSection } from './cabinet-section'

interface Props {
  activeRequests: TravelerRequestSummary[]
  confirmedBookings: ConfirmedBookingSummary[]
  joinedGroups?: JoinedGroupSummary[]
  inspirations?: Inspiration[]
}

const phaseOrder: TripPhase[] = [
  'today',
  'upcoming',
  'awaiting_decision',
  'waiting_offers',
  'completed',
]

const phaseLabels: Record<TripPhase, string> = {
  today: 'Сегодня',
  upcoming: 'Скоро',
  awaiting_decision: 'Ждут вашего решения',
  waiting_offers: 'В ожидании откликов',
  completed: 'Завершённые',
}

type ViewMode = 'feed' | 'tabs'
type CategoryTab = 'active' | 'joined' | 'confirmed'

const viewStorageKey = 'provodnik:traveler-requests-view'

function todayDateKey(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function joinedGroupPhase(group: JoinedGroupSummary): TripPhase {
  const startsOn = group.starts_on.slice(0, 10)
  const today = todayDateKey()

  if (startsOn === today) return 'today'
  if (startsOn > today) return 'upcoming'
  return 'completed'
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

function ViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode
  onChange: (viewMode: ViewMode) => void
}) {
  return (
    <div className="grid grid-cols-2 rounded-full border border-border/70 bg-muted/40 p-1">
      <button
        type="button"
        aria-pressed={viewMode === 'feed'}
        onClick={() => onChange('feed')}
        className="rounded-full px-4 py-2 text-sm font-semibold transition-colors aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm text-muted-foreground"
      >
        Лента
      </button>
      <button
        type="button"
        aria-pressed={viewMode === 'tabs'}
        onClick={() => onChange('tabs')}
        className="rounded-full px-4 py-2 text-sm font-semibold transition-colors aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm text-muted-foreground"
      >
        По категориям
      </button>
    </div>
  )
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
  const [viewMode, setViewMode] = useState<ViewMode>('feed')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedViewMode = window.localStorage.getItem(viewStorageKey)
    if (storedViewMode !== 'feed' && storedViewMode !== 'tabs') return

    const timeoutId = window.setTimeout(() => {
      setViewMode(storedViewMode)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const joinedTrips = joinedGroups.map((group) => ({
    phase: joinedGroupPhase(group),
    trip: mapJoinedGroupToTrip(group),
  }))
  const trips = groupTripsByPhase({ activeRequests, confirmedBookings })

  for (const { phase, trip } of joinedTrips) {
    trips[phase].push(trip)
  }

  const hasTrips = phaseOrder.some((phase) => trips[phase].length > 0)

  if (!hasTrips) {
    return <EmptyCabinet inspirations={inspirations} />
  }

  const handleViewModeChange = (nextViewMode: ViewMode) => {
    setViewMode(nextViewMode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(viewStorageKey, nextViewMode)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <ViewToggle viewMode={viewMode} onChange={handleViewModeChange} />
      {viewMode === 'feed' ? (
        phaseOrder.map((phase) => {
          const phaseTrips = trips[phase]
          if (phaseTrips.length === 0) return null

          return (
            <CabinetSection
              key={phase}
              phase={phase}
              label={phaseLabels[phase]}
              trips={phaseTrips}
            />
          )
        })
      ) : (
        <RequestsCategoryTabs
          activeRequests={activeRequests}
          confirmedBookings={confirmedBookings}
          joinedGroups={joinedGroups}
        />
      )}
    </div>
  )
}
