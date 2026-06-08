import { beforeEach, describe, it, expect, vi } from 'vitest'

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

import { getActiveRequests, getConfirmedBookings } from './traveler-requests'
import type { TravelerRequestSummary, ConfirmedBookingSummary } from './traveler-requests'

beforeEach(() => {
  createSupabaseServerClient.mockReset()
})

describe('TravelerRequestSummary type', () => {
  it('accepts open status', () => {
    const req: TravelerRequestSummary = {
      id: 'uuid', destination: 'Элиста', region: null, interests: ['История'],
      start_time: null, starts_on: '2026-06-01', ends_on: null, budget_minor: 10000,
      participants_count: 2, status: 'open', created_at: '2026-04-21T00:00:00Z',
      offer_count: 0, guide_avatars: [], mode: 'private', group_max: null,
      open_to_join: false, date_locked: true,
    }
    expect(req.status).toBe('open')
  })

  it('accepts expired status', () => {
    const req: TravelerRequestSummary = {
      id: 'uuid2', destination: 'Волгоград', region: null, interests: ['Природа'],
      start_time: null, starts_on: '2026-01-01', ends_on: null, budget_minor: null,
      participants_count: 1, status: 'expired', created_at: '2026-01-01T00:00:00Z',
      offer_count: 0, guide_avatars: [], mode: 'private', group_max: null,
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
      start_time: null, starts_on: '2026-06-01', ends_on: null, budget_minor: null,
      participants_count: 3, status: 'open', created_at: '2026-04-21T00:00:00Z',
      offer_count: 5, guide_avatars: avatars, mode: 'assembly', group_max: 10,
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
    }
    expect(booking.price_minor).toBeGreaterThan(0)
  })
})

describe('getActiveRequests', () => {
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

    const [summary] = await getActiveRequests('traveler-1')

    expect(summary.open_to_join).toBe(true)
    expect(summary.date_locked).toBe(false)
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
        }],
        error: null,
      }),
    }
    const requestsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [{ id: 'request-1', destination: 'Элиста', starts_on: '2026-07-01' }],
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

    expect(bookingsQuery.in).toHaveBeenCalledWith('status', ['awaiting_guide_confirmation', 'confirmed'])
    expect(bookingsQuery.in).not.toHaveBeenCalledWith('status', expect.arrayContaining(['pending']))
    expect(booking).toEqual({
      booking_id: 'booking-1',
      request_id: 'request-1',
      destination: 'Элиста',
      starts_on: '2026-07-01',
      price_minor: 150000,
      currency: 'RUB',
      guide_id: 'guide-1',
      guide_name: 'Иван',
      guide_avatar_url: null,
      booking_thread_id: 'thread-1',
    })
  })
})
