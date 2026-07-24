import { beforeEach, describe, it, expect, vi } from 'vitest'

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

import { getActiveRequests, getConfirmedBookings, getTerminalRequests } from './traveler-requests'
import type { TravelerRequestSummary, ConfirmedBookingSummary } from './traveler-requests'

beforeEach(() => {
  createSupabaseServerClient.mockReset()
})

describe('TravelerRequestSummary type', () => {
  it('accepts open status', () => {
    const req: TravelerRequestSummary = {
      id: 'uuid', destination: 'Элиста', region: null, interests: ['История'],
      start_time: null, end_time: null, starts_on: '2026-06-01', ends_on: null, budget_minor: 10000,
      participants_count: 2, status: 'open', created_at: '2026-04-21T00:00:00Z',
      offer_count: 0, unread_offer_count: 0, guide_avatars: [], mode: 'private', group_max: null,
      open_to_join: false, date_locked: true,
    }
    expect(req.status).toBe('open')
  })

  it('accepts expired status', () => {
    const req: TravelerRequestSummary = {
      id: 'uuid2', destination: 'Волгоград', region: null, interests: ['Природа'],
      start_time: null, end_time: null, starts_on: '2026-01-01', ends_on: null, budget_minor: null,
      participants_count: 1, status: 'expired', created_at: '2026-01-01T00:00:00Z',
      offer_count: 0, unread_offer_count: 0, guide_avatars: [], mode: 'private', group_max: null,
      open_to_join: false, date_locked: true,
    }
    expect(req.status).toBe('expired')
  })

  it('guide_avatars holds max 3 entries', () => {
    const avatars = [
      { guide_id: '1', avatar_url: null, full_name: 'А' },
      { guide_id: '2', avatar_url: null, full_name: 'Б' },
      { guide_id: '3', avatar_url: null, full_name: 'В' },
    ]
    const req: TravelerRequestSummary = {
      id: 'uuid', destination: 'X', region: null, interests: ['X'],
      start_time: null, end_time: null, starts_on: '2026-06-01', ends_on: null, budget_minor: null,
      participants_count: 3, status: 'open', created_at: '2026-04-21T00:00:00Z',
      offer_count: 5, unread_offer_count: 0, guide_avatars: avatars, mode: 'assembly', group_max: 10,
      open_to_join: true, date_locked: false,
    }
    expect(req.guide_avatars).toHaveLength(3)
    expect(req.offer_count).toBe(5)
  })
})

describe('ConfirmedBookingSummary type', () => {
  it('holds required fields', () => {
    const booking: ConfirmedBookingSummary = {
      booking_id: 'uuid0', request_id: 'uuid1', destination: 'Астрахань', starts_on: '2026-07-10',
      price_minor: 15000, currency: 'RUB', guide_id: 'uuid2',
      guide_name: 'Иван', guide_avatar_url: null, booking_thread_id: null,
      status: 'confirmed',
    }
    expect(booking.price_minor).toBeGreaterThan(0)
  })
})

describe('getActiveRequests', () => {
  it('surfaces guide profile lookup errors', async () => {
    const profileError = new Error('profile policy denied')
    const requestQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 'request-1',
          destination: 'Элиста',
          region: null,
          interests: ['История'],
          starts_on: '2026-06-01',
          ends_on: null,
          start_time: null,
          budget_minor: 10000,
          participants_count: 2,
          status: 'open',
          created_at: '2026-04-21T00:00:00Z',
          format_preference: 'group',
          group_capacity: 8,
          open_to_join: true,
          date_locked: false,
        }],
        error: null,
      }),
    }
    const offersQuery: { select: ReturnType<typeof vi.fn>; in: ReturnType<typeof vi.fn> } = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn(),
    }
    offersQuery.in
      .mockReturnValueOnce(offersQuery)
      .mockResolvedValueOnce({
        data: [{ request_id: 'request-1', guide_id: 'guide-1' }],
        error: null,
      })
    const profilesQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: null, error: profileError }),
    }
    const from = vi.fn((table: string) => {
      if (table === 'traveler_requests') return requestQuery
      if (table === 'guide_offers') return offersQuery
      if (table === 'profiles') return profilesQuery
      throw new Error(`Unexpected table: ${table}`)
    })

    createSupabaseServerClient.mockResolvedValue({ from })

    await expect(getActiveRequests('traveler-1')).rejects.toBe(profileError)
  })

  it('returns open_to_join and date_locked flags', async () => {
    const requestQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 'request-1',
          destination: 'Элиста',
          region: null,
          interests: ['История'],
          starts_on: '2026-06-01',
          ends_on: null,
          start_time: null,
          budget_minor: 10000,
          participants_count: 2,
          status: 'open',
          created_at: '2026-04-21T00:00:00Z',
          format_preference: 'group',
          group_capacity: 8,
          open_to_join: true,
          date_locked: false,
        }],
        error: null,
      }),
    }
    const offersQuery: { select: ReturnType<typeof vi.fn>; in: ReturnType<typeof vi.fn> } = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn(),
    }
    offersQuery.in
      .mockReturnValueOnce(offersQuery)
      .mockResolvedValueOnce({ data: [], error: null })
    const from = vi.fn((table: string) => {
      if (table === 'traveler_requests') return requestQuery
      if (table === 'guide_offers') return offersQuery
      throw new Error(`Unexpected table: ${table}`)
    })

    createSupabaseServerClient.mockResolvedValue({ from })

    const [summary] = await getActiveRequests('traveler-flags-1')

    expect(summary.open_to_join).toBe(true)
    expect(summary.date_locked).toBe(false)
  })

  it('filters the active bucket to status=open only — never expired (#active-tab)', async () => {
    const requestQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const from = vi.fn((table: string) => {
      if (table === 'traveler_requests') return requestQuery
      throw new Error(`Unexpected table: ${table}`)
    })
    createSupabaseServerClient.mockResolvedValue({ from })

    await getActiveRequests('traveler-active-1')

    // The status filter must be an equality on 'open', not an .in([...]) that
    // re-admits 'expired' into the "Активные" tab (the reported bug).
    expect(requestQuery.eq).toHaveBeenCalledWith('status', 'open')
    const statusInCalls = requestQuery.in.mock.calls.filter((c) => c[0] === 'status')
    expect(statusInCalls).toHaveLength(0)
  })
})

describe('getConfirmedBookings', () => {
  it('requests confirmation-ready statuses and returns confirmed bookings', async () => {
    const bookingsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 'booking-1',
          offer_id: 'offer-1',
          request_id: 'request-1',
          subtotal_minor: 150000,
          currency: 'RUB',
          guide_id: 'guide-1',
          created_at: '2026-06-08T10:00:00Z',
          status: 'confirmed',
        }],
        error: null,
      }),
    }
    const requestsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [{
          id: 'request-1',
          destination: 'Элиста',
          starts_on: '2026-07-01',
          ends_on: null,
          start_time: null,
          participants_count: null,
          guide_template_snapshot: null,
        }],
        error: null,
      }),
    }
    const threadsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [{ id: 'thread-1', booking_id: 'booking-1' }],
        error: null,
      }),
    }
    const from = vi.fn((table: string) => {
      if (table === 'bookings') return bookingsQuery
      if (table === 'traveler_requests') return requestsQuery
      if (table === 'conversation_threads') return threadsQuery
      throw new Error(`Unexpected table: ${table}`)
    })
    const rpc = vi.fn().mockResolvedValue({
      data: [{ booking_id: 'booking-1', guide_id: 'guide-1', full_name: 'Иван', avatar_url: null }],
      error: null,
    })

    createSupabaseServerClient.mockResolvedValue({ from, rpc })

    const [booking] = await getConfirmedBookings('traveler-confirmed-1')

    expect(bookingsQuery.in).toHaveBeenCalledWith('status', [
      'pending',
      'awaiting_guide_confirmation',
      'confirmed',
      'completed',
      'cancelled',
    ])
    expect(bookingsQuery.in).not.toHaveBeenCalledWith('status', expect.arrayContaining(['draft']))
    expect(booking).toEqual({
      booking_id: 'booking-1',
      request_id: 'request-1',
      destination: 'Элиста',
      starts_on: '2026-07-01',
      ends_on: null,
      start_time: null,
      participants_count: null,
      price_minor: 150000,
      currency: 'RUB',
      guide_id: 'guide-1',
      guide_name: 'Иван',
      guide_avatar_url: null,
      booking_thread_id: 'thread-1',
      status: 'confirmed',
    })
  })

  it('prefers booking.starts_at over the request date for confirmed trip facts', async () => {
    const bookingsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 'booking-3',
          offer_id: 'offer-3',
          request_id: 'request-3',
          subtotal_minor: 150000,
          currency: 'RUB',
          guide_id: 'guide-1',
          created_at: '2026-06-08T10:00:00Z',
          status: 'confirmed',
          starts_at: '2026-07-15T09:00:00.000Z',
        }],
        error: null,
      }),
    }
    const requestsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [{
          id: 'request-3',
          destination: 'Элиста',
          starts_on: '2026-07-01',
          ends_on: '2026-07-01',
          start_time: '10:00',
          participants_count: 2,
          guide_template_snapshot: null,
        }],
        error: null,
      }),
    }
    const threadsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const from = vi.fn((table: string) => {
      if (table === 'bookings') return bookingsQuery
      if (table === 'traveler_requests') return requestsQuery
      if (table === 'conversation_threads') return threadsQuery
      throw new Error(`Unexpected table: ${table}`)
    })
    const rpc = vi.fn().mockResolvedValue({
      data: [{ booking_id: 'booking-3', guide_id: 'guide-1', full_name: 'Иван', avatar_url: null }],
      error: null,
    })

    createSupabaseServerClient.mockResolvedValue({ from, rpc })

    const [booking] = await getConfirmedBookings('traveler-confirmed-3')

    expect(booking.starts_on).toBe('2026-07-15')
    expect(booking.start_time).toBe('10:00')
    expect(booking.participants_count).toBe(2)
  })

  it('uses the frozen template snapshot title for a ready-excursion booking', async () => {
    const bookingsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 'booking-4',
          offer_id: 'offer-4',
          request_id: 'request-4',
          subtotal_minor: 450000,
          currency: 'RUB',
          guide_id: 'guide-1',
          created_at: '2026-06-08T10:00:00Z',
          status: 'confirmed',
          starts_at: null,
        }],
        error: null,
      }),
    }
    const requestsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [{
          id: 'request-4',
          destination: 'Элиста',
          starts_on: '2026-07-01',
          ends_on: '2026-07-01',
          start_time: null,
          participants_count: 2,
          guide_template_snapshot: {
            id: '44444444-4444-4444-8444-444444444444',
            title: 'Адык: степь и Калмыкия',
            description: 'Прогулка по степи',
            duration_text: '5 часов',
            meeting_point: 'Элиста',
            max_participants: 8,
            region: 'Калмыкия',
            price_scope: 'per_group',
            price_from_kopecks: 450000,
          },
        }],
        error: null,
      }),
    }
    const threadsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const from = vi.fn((table: string) => {
      if (table === 'bookings') return bookingsQuery
      if (table === 'traveler_requests') return requestsQuery
      if (table === 'conversation_threads') return threadsQuery
      throw new Error(`Unexpected table: ${table}`)
    })
    const rpc = vi.fn().mockResolvedValue({
      data: [{ booking_id: 'booking-4', guide_id: 'guide-1', full_name: null, avatar_url: null }],
      error: null,
    })

    createSupabaseServerClient.mockResolvedValue({ from, rpc })

    const [booking] = await getConfirmedBookings('traveler-confirmed-4')

    expect(booking.destination).toBe('Адык: степь и Калмыкия')
    expect(booking.guide_name).toBe('Локальный гид')
  })

  it('ignores a forged template snapshot without a title and falls back to the request destination', async () => {
    const bookingsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 'booking-5',
          offer_id: 'offer-5',
          request_id: 'request-5',
          subtotal_minor: 150000,
          currency: 'RUB',
          guide_id: 'guide-1',
          created_at: '2026-06-08T10:00:00Z',
          status: 'confirmed',
          starts_at: null,
        }],
        error: null,
      }),
    }
    const requestsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [{
          id: 'request-5',
          destination: 'Элиста',
          starts_on: '2026-07-01',
          ends_on: null,
          start_time: null,
          participants_count: 1,
          guide_template_snapshot: { title: '   ' },
        }],
        error: null,
      }),
    }
    const threadsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const from = vi.fn((table: string) => {
      if (table === 'bookings') return bookingsQuery
      if (table === 'traveler_requests') return requestsQuery
      if (table === 'conversation_threads') return threadsQuery
      throw new Error(`Unexpected table: ${table}`)
    })
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null })

    createSupabaseServerClient.mockResolvedValue({ from, rpc })

    const [booking] = await getConfirmedBookings('traveler-confirmed-5')

    expect(booking.destination).toBe('Элиста')
  })

  it('falls back to a readable title (never a lone em-dash) when the request row is missing', async () => {
    const bookingsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 'booking-2',
          offer_id: 'offer-2',
          request_id: 'request-gone',
          subtotal_minor: 150000,
          currency: 'RUB',
          guide_id: 'guide-1',
          created_at: '2026-06-08T10:00:00Z',
          status: 'confirmed',
        }],
        error: null,
      }),
    }
    const requestsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }), // request row unreadable/gone
    }
    const threadsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const from = vi.fn((table: string) => {
      if (table === 'bookings') return bookingsQuery
      if (table === 'traveler_requests') return requestsQuery
      if (table === 'conversation_threads') return threadsQuery
      throw new Error(`Unexpected table: ${table}`)
    })
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null })

    createSupabaseServerClient.mockResolvedValue({ from, rpc })

    const [booking] = await getConfirmedBookings('traveler-confirmed-2')

    expect(booking.destination).toBe('Поездка')
    expect(booking.destination).not.toBe('—')
  })
})

describe('getTerminalRequests', () => {
  it('filters the history bucket to cancelled and expired only', async () => {
    const requestQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const from = vi.fn((table: string) => {
      if (table === 'traveler_requests') return requestQuery
      throw new Error(`Unexpected table: ${table}`)
    })
    createSupabaseServerClient.mockResolvedValue({ from })

    await getTerminalRequests('traveler-terminal-1')

    expect(requestQuery.in).toHaveBeenCalledWith('status', ['cancelled', 'expired'])
  })

  it('returns terminal own requests for the completed feed', async () => {
    const requestQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 'request-cancelled',
          destination: 'Казань',
          region: null,
          interests: ['history_culture'],
          starts_on: '2026-05-01',
          ends_on: null,
          start_time: null,
          end_time: null,
          budget_minor: null,
          participants_count: 2,
          status: 'cancelled',
          created_at: '2026-04-21T00:00:00Z',
          format_preference: 'private',
          group_capacity: null,
          open_to_join: false,
          date_locked: true,
          date_flexibility: 'exact',
        }],
        error: null,
      }),
    }
    const from = vi.fn((table: string) => {
      if (table === 'traveler_requests') return requestQuery
      throw new Error(`Unexpected table: ${table}`)
    })
    createSupabaseServerClient.mockResolvedValue({ from })

    const [summary] = await getTerminalRequests('traveler-terminal-2')

    expect(summary).toMatchObject({
      id: 'request-cancelled',
      destination: 'Казань',
      status: 'cancelled',
      offer_count: 0,
    })
  })
})
