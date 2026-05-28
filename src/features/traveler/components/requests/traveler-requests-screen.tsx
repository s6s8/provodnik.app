import { TripCard } from '../trip-card/trip-card'
import { groupTripsByPhase } from '../trip-card/group-by-phase'
import type { TripCardModel, TripPhase } from '../trip-card/trip-card-types'
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

function Section({
  phase,
  label,
  trips,
}: {
  phase: TripPhase
  label: string
  trips: TripCardModel[]
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h2>
      <div className="grid gap-3">
        {trips.map((trip) => (
          <TripCard key={trip.id} phase={phase} trip={trip} />
        ))}
      </div>
    </section>
  )
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
          <Section
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
