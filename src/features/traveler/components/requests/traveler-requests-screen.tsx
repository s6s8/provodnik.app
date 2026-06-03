import {
  EmptyCabinet,
  type Inspiration,
} from '../empty-cabinet/empty-cabinet'
import { groupTripsByPhase } from '../trip-card/group-by-phase'
import type { TripCardModel, TripPhase } from '../trip-card/trip-card-types'
import { CabinetSection } from './cabinet-section'
import type {
  TravelerRequestSummary,
  ConfirmedBookingSummary,
  JoinedGroupSummary,
} from '@/lib/supabase/traveler-requests'

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

export function TravelerRequestsScreen({
  activeRequests,
  confirmedBookings,
  joinedGroups = [],
  inspirations = [],
}: Props) {
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

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      {phaseOrder.map((phase) => {
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
      })}
    </div>
  )
}
