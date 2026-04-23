import { describe, it, expect } from 'vitest'
import type { TravelerRequestSummary, ConfirmedBookingSummary } from './traveler-requests'

describe('TravelerRequestSummary type', () => {
  it('accepts open status', () => {
    const req: TravelerRequestSummary = {
      id: 'uuid', destination: 'Элиста', region: null, interests: ['История'],
      start_time: null, starts_on: '2026-06-01', ends_on: null, budget_minor: 10000,
      participants_count: 2, status: 'open', created_at: '2026-04-21T00:00:00Z',
      offer_count: 0, guide_avatars: [], mode: 'private', group_max: null,
    }
    expect(req.status).toBe('open')
  })

  it('accepts expired status', () => {
    const req: TravelerRequestSummary = {
      id: 'uuid2', destination: 'Волгоград', region: null, interests: ['Природа'],
      start_time: null, starts_on: '2026-01-01', ends_on: null, budget_minor: null,
      participants_count: 1, status: 'expired', created_at: '2026-01-01T00:00:00Z',
      offer_count: 0, guide_avatars: [], mode: 'private', group_max: null,
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
