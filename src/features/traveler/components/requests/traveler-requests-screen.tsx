'use client'

import {
  EmptyCabinet,
  type Inspiration,
} from '../empty-cabinet/empty-cabinet'
import { groupTripsByPhase } from '../trip-card/group-by-phase'
import type {
  TravelerRequestSummary,
  ConfirmedBookingSummary,
  JoinedGroupSummary,
} from '@/lib/supabase/traveler-requests'
import { PageHeader } from '@/components/shared/page-header'

import { CabinetSection } from './cabinet-section'

interface Props {
  activeRequests: TravelerRequestSummary[]
  confirmedBookings: ConfirmedBookingSummary[]
  joinedGroups?: JoinedGroupSummary[]
  terminalRequests?: TravelerRequestSummary[]
  inspirations?: Inspiration[]
}

const PHASE_SECTIONS = [
  { phase: 'today', label: 'Сегодня' },
  { phase: 'upcoming', label: 'Скоро' },
  { phase: 'awaiting_decision', label: 'Ждут вашего решения' },
  { phase: 'waiting_offers', label: 'В ожидании откликов' },
  { phase: 'completed', label: 'Завершённые' },
] as const

export function TravelerRequestsScreen({
  activeRequests,
  confirmedBookings,
  joinedGroups = [],
  terminalRequests = [],
  inspirations = [],
}: Props) {
  const hasTrips =
    activeRequests.length > 0 ||
    confirmedBookings.length > 0 ||
    joinedGroups.length > 0 ||
    terminalRequests.length > 0

  if (!hasTrips) {
    return <EmptyCabinet inspirations={inspirations} />
  }

  const grouped = groupTripsByPhase({
    activeRequests,
    confirmedBookings,
    joinedGroups,
    terminalRequests,
  })

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-8 px-4 py-6">
      <PageHeader title="Мои запросы" />
      {PHASE_SECTIONS.map(({ phase, label }) => {
        const trips = grouped[phase]
        if (trips.length === 0) return null

        return (
          <CabinetSection
            key={phase}
            phase={phase}
            label={label}
            trips={trips}
          />
        )
      })}
    </div>
  )
}
