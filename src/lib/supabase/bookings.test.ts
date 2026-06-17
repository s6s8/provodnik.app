import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

import { createBooking } from './bookings'

beforeEach(() => {
  createSupabaseServerClient.mockReset()
})

describe('createBooking', () => {
  it('inserts accepted offers as confirmed bookings', async () => {
    const insertedBooking = {
      id: 'booking-1',
      traveler_id: 'traveler-1',
      guide_id: 'guide-1',
      request_id: 'request-1',
      offer_id: 'offer-1',
      listing_id: null,
      status: 'confirmed',
      party_size: null,
      starts_at: null,
      ends_at: null,
      subtotal_minor: 150000,
      deposit_minor: null,
      remainder_minor: null,
      currency: 'RUB',
      cancellation_policy_snapshot: null,
      meeting_point: null,
      created_at: '2026-06-08T10:00:00Z',
      updated_at: '2026-06-08T10:00:00Z',
    }
    const bookingQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: insertedBooking, error: null }),
    }
    const requestQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { participants_count: 3 }, error: null }),
    }
    const from = vi.fn((table: string) => {
      if (table === 'bookings') return bookingQuery
      if (table === 'traveler_requests') return requestQuery
      throw new Error(`Unexpected table: ${table}`)
    })
    createSupabaseServerClient.mockResolvedValue({ from })

    await createBooking({
      request_id: 'request-1',
      offer_id: 'offer-1',
      guide_id: 'guide-1',
      subtotal_minor: 150000,
    }, 'traveler-1')

    expect(bookingQuery.insert).toHaveBeenCalledWith({
      traveler_id: 'traveler-1',
      guide_id: 'guide-1',
      request_id: 'request-1',
      offer_id: 'offer-1',
      status: 'confirmed',
      subtotal_minor: 150000,
      currency: 'RUB',
      party_size: 3,
    })
  })

  it('derives party_size from the request participants_count', async () => {
    const bookingQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'booking-2' }, error: null }),
    }
    const requestQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { participants_count: 5 }, error: null }),
    }
    const from = vi.fn((table: string) => {
      if (table === 'bookings') return bookingQuery
      if (table === 'traveler_requests') return requestQuery
      throw new Error(`Unexpected table: ${table}`)
    })
    createSupabaseServerClient.mockResolvedValue({ from })

    await createBooking({
      request_id: 'request-1',
      offer_id: 'offer-1',
      guide_id: 'guide-1',
      subtotal_minor: 150000,
    }, 'traveler-1')

    expect(requestQuery.select).toHaveBeenCalledWith('participants_count')
    expect(bookingQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({ party_size: 5 }),
    )
  })

  it('respects an explicitly provided party_size', async () => {
    const bookingQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'booking-3' }, error: null }),
    }
    const from = vi.fn((table: string) => {
      if (table === 'bookings') return bookingQuery
      throw new Error(`Unexpected table: ${table}`)
    })
    createSupabaseServerClient.mockResolvedValue({ from })

    await createBooking({
      request_id: 'request-1',
      offer_id: 'offer-1',
      guide_id: 'guide-1',
      subtotal_minor: 150000,
      party_size: 2,
    }, 'traveler-1')

    expect(bookingQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({ party_size: 2 }),
    )
  })
})
