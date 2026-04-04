import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

import {
  BOOKING_TRANSITIONS,
  canTransition,
  transitionBooking,
  type BookingStatus,
} from '@/lib/bookings/state-machine'

type SupabaseChain = {
  from: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  selectEq: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  updateEq: ReturnType<typeof vi.fn>
  updateSelect: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
}

function createBookingSupabase(fromStatus: BookingStatus, toStatus: BookingStatus): SupabaseChain {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: { id: 'booking-1', status: fromStatus },
    error: null,
  })
  const selectEq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq: selectEq }))

  const single = vi.fn().mockResolvedValue({
    data: { id: 'booking-1', status: toStatus },
    error: null,
  })
  const updateSelect = vi.fn(() => ({ single }))
  const updateEq = vi.fn(() => ({ select: updateSelect }))
  const update = vi.fn(() => ({ eq: updateEq }))

  const from = vi.fn(() => ({
    select,
    update,
  }))

  return { from, select, selectEq, maybeSingle, update, updateEq, updateSelect, single }
}

describe('BOOKING_TRANSITIONS', () => {
  it('defines the expected transition map', () => {
    expect(BOOKING_TRANSITIONS).toEqual({
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled', 'disputed'],
      completed: [],
      cancelled: [],
      disputed: ['cancelled'],
    })
  })
})

describe('canTransition', () => {
  const validTransitions: Array<[BookingStatus, BookingStatus]> = [
    ['pending', 'confirmed'],
    ['pending', 'cancelled'],
    ['confirmed', 'completed'],
    ['confirmed', 'cancelled'],
    ['confirmed', 'disputed'],
    ['disputed', 'cancelled'],
  ]

  const invalidTransitions: Array<[BookingStatus, BookingStatus]> = [
    ['pending', 'completed'],
    ['pending', 'disputed'],
    ['confirmed', 'pending'],
    ['completed', 'cancelled'],
    ['cancelled', 'confirmed'],
    ['disputed', 'confirmed'],
  ]

  it.each(validTransitions)('allows %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true)
  })

  it.each(invalidTransitions)('rejects %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false)
  })
})

describe('transitionBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validTransitions: Array<[BookingStatus, BookingStatus]> = [
    ['pending', 'confirmed'],
    ['pending', 'cancelled'],
    ['confirmed', 'completed'],
    ['confirmed', 'cancelled'],
    ['confirmed', 'disputed'],
    ['disputed', 'cancelled'],
  ]

  const invalidTransitions: Array<[BookingStatus, BookingStatus]> = [
    ['pending', 'completed'],
    ['pending', 'disputed'],
    ['completed', 'confirmed'],
    ['cancelled', 'pending'],
    ['disputed', 'completed'],
  ]

  it.each(validTransitions)('persists a valid transition from %s to %s', async (from, to) => {
    const supabase = createBookingSupabase(from, to)
    createSupabaseServerClient.mockResolvedValue({
      from: supabase.from,
    })

    await expect(transitionBooking('booking-1', to, 'user-1')).resolves.toEqual({
      id: 'booking-1',
      status: to,
    })

    expect(supabase.update).toHaveBeenCalledWith({ status: to })
    expect(supabase.updateEq).toHaveBeenCalledWith('id', 'booking-1')
    expect(supabase.updateSelect).toHaveBeenCalledWith('id, status')
  })

  it.each(invalidTransitions)('throws for an invalid transition from %s to %s', async (from, to) => {
    const supabase = createBookingSupabase(from, from)
    createSupabaseServerClient.mockResolvedValue({
      from: supabase.from,
    })

    await expect(transitionBooking('booking-1', to, 'user-1')).rejects.toThrow(
      `Invalid booking transition: ${from} → ${to}`,
    )

    expect(supabase.update).not.toHaveBeenCalled()
  })
})
