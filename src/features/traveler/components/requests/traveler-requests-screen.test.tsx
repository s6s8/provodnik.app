import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  ConfirmedBookingSummary,
  JoinedGroupSummary,
  TravelerRequestSummary,
} from '@/lib/supabase/traveler-requests'

import { TravelerRequestsScreen } from './traveler-requests-screen'

const baseRequest: TravelerRequestSummary = {
  id: 'request-1',
  destination: 'Элиста',
  region: 'Калмыкия',
  interests: ['буддизм'],
  starts_on: '2026-06-10',
  start_time: null,
  end_time: null,
  ends_on: null,
  budget_minor: null,
  participants_count: 2,
  status: 'open',
  created_at: '2026-05-28T10:00:00.000Z',
  offer_count: 0,
  unread_offer_count: 0,
  guide_avatars: [],
  mode: 'private',
  group_max: null,
}

const baseBooking: ConfirmedBookingSummary = {
  booking_id: 'booking-1',
  request_id: 'request-1',
  destination: 'Москва',
  starts_on: '2026-06-10',
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
  starts_on: '2026-06-10',
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

describe('TravelerRequestsScreen — lifecycle feed', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-28T12:00:00+04:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the empty cabinet without phase sections when there are no trips', () => {
    render(
      <TravelerRequestsScreen
        activeRequests={[]}
        confirmedBookings={[]}
      />,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Куда поедем?' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Сегодня ·')).toBeNull()
    expect(screen.queryByRole('tablist')).toBeNull()
  })

  it('renders lifecycle phase sections instead of category tabs', () => {
    render(
      <TravelerRequestsScreen
        activeRequests={[
          {
            ...baseRequest,
            id: 'awaiting-decision',
            destination: 'Казань',
            offer_count: 2,
          },
          {
            ...baseRequest,
            id: 'waiting-offers',
            destination: 'Тула',
            offer_count: 0,
          },
        ]}
        confirmedBookings={[
          {
            ...baseBooking,
            booking_id: 'today-booking',
            destination: 'Сочи',
            starts_on: '2026-05-28',
          },
          {
            ...baseBooking,
            booking_id: 'upcoming-booking',
            destination: 'Суздаль',
            starts_on: '2026-06-10',
          },
        ]}
        joinedGroups={[baseJoinedGroup]}
      />,
    )

    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.getByText('Сегодня · 1')).toBeInTheDocument()
    expect(screen.getByText('Скоро · 2')).toBeInTheDocument()
    expect(screen.getByText('Ждут вашего решения · 1')).toBeInTheDocument()
    expect(screen.getByText('В ожидании откликов · 1')).toBeInTheDocument()
    expect(screen.getByText('Сочи')).toBeInTheDocument()
    expect(screen.getByText('Суздаль')).toBeInTheDocument()
    expect(screen.getByText('Кострома')).toBeInTheDocument()
    expect(screen.getByText('Казань')).toBeInTheDocument()
    expect(screen.getByText('Тула')).toBeInTheDocument()
  })

  it('does not render legacy category-tab empty-state copy', () => {
    render(
      <TravelerRequestsScreen
        activeRequests={[baseRequest]}
        confirmedBookings={[]}
      />,
    )

    expect(screen.queryByText('У вас ещё нет запросов')).toBeNull()
    expect(screen.queryByText('Подтверждённых поездок пока нет')).toBeNull()
    expect(screen.queryByText('Вы пока не присоединились ни к одной группе')).toBeNull()
  })
})
