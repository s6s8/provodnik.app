import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type {
  ConfirmedBookingSummary,
  JoinedGroupSummary,
  TravelerRequestSummary,
} from '@/lib/supabase/traveler-requests'

import { TravelerRequestsScreen } from './traveler-requests-screen'

function isoDateFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10)
}

const baseRequest: TravelerRequestSummary = {
  id: 'request-1',
  destination: 'Элиста',
  region: 'Калмыкия',
  interests: ['буддизм'],
  starts_on: isoDateFromNow(10),
  start_time: null,
  end_time: null,
  ends_on: null,
  budget_minor: null,
  participants_count: 2,
  status: 'open',
  created_at: '2026-05-28T10:00:00.000Z',
  offer_count: 0,
  guide_avatars: [],
  mode: 'private',
  group_max: null,
}

const baseBooking: ConfirmedBookingSummary = {
  booking_id: 'booking-1',
  request_id: 'request-1',
  destination: 'Москва',
  starts_on: isoDateFromNow(7),
  price_minor: 2450000,
  currency: 'RUB',
  guide_id: 'guide-1',
  guide_name: 'Демо Гид',
  guide_avatar_url: '/avatars/guide.jpg',
  booking_thread_id: null,
}

const baseJoinedGroup: JoinedGroupSummary = {
  id: 'joined-group-1',
  destination: 'Кострома',
  region: 'Золотое кольцо',
  starts_on: isoDateFromNow(8),
  start_time: '11:00',
  ends_on: null,
  budget_minor: 1800000,
  participants_count: 3,
  group_max: 6,
  status: 'open',
  joined_at: '2026-05-28T11:00:00.000Z',
  owner_id: 'traveler-owner-1',
  owner_name: 'Мария К.',
  owner_avatar_url: '/avatars/maria.jpg',
}

describe('TravelerRequestsScreen — category tabs', () => {
  it('renders the empty cabinet without category tabs when there are no trips', () => {
    render(
      <TravelerRequestsScreen
        activeRequests={[]}
        confirmedBookings={[]}
      />,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Куда поедем?' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).toBeNull()
  })

  it('renders category tabs directly with counts only for non-empty categories', () => {
    render(
      <TravelerRequestsScreen
        activeRequests={[baseRequest]}
        confirmedBookings={[]}
        joinedGroups={[]}
      />,
    )

    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: 'Активные (1)' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: 'Мои группы' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: 'Подтверждённые' }),
    ).toBeInTheDocument()
  })

  it('selects the active tab by default and shows the active request destination', () => {
    render(
      <TravelerRequestsScreen
        activeRequests={[baseRequest]}
        confirmedBookings={[]}
      />,
    )

    expect(screen.getByRole('tab', { name: 'Активные (1)' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByText('Элиста')).toBeInTheDocument()
  })

  it('switches between joined groups and confirmed bookings tabs', () => {
    render(
      <TravelerRequestsScreen
        activeRequests={[baseRequest]}
        confirmedBookings={[baseBooking]}
        joinedGroups={[baseJoinedGroup]}
      />,
    )

    const categoryTabs = screen.getAllByRole('tab')
    expect(categoryTabs[0]?.textContent).toMatch('Активные')
    expect(categoryTabs[1]?.textContent).toMatch('Подтверждённые')
    expect(categoryTabs[2]?.textContent).toMatch('Мои группы')

    fireEvent.click(screen.getByRole('tab', { name: 'Мои группы (1)' }))

    expect(screen.getByText('Кострома')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Подтверждённые (1)' }))

    expect(screen.getByText('Москва')).toBeInTheDocument()
  })

  it('selects joined groups by default when there are no active requests', () => {
    render(
      <TravelerRequestsScreen
        activeRequests={[]}
        confirmedBookings={[]}
        joinedGroups={[baseJoinedGroup]}
      />,
    )

    expect(screen.getByRole('tab', { name: 'Мои группы (1)' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByText('Кострома')).toBeInTheDocument()
  })
})
