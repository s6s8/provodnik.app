import { groupTripsByPhase } from '../trip-card/group-by-phase'
import type { TripPhase } from '../trip-card/trip-card-types'
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

export function TravelerRequestsScreen({
  activeRequests,
  confirmedBookings,
}: Props) {
  const trips = groupTripsByPhase({ activeRequests, confirmedBookings })

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
