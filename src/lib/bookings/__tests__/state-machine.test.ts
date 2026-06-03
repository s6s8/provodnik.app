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
  authGetUser: ReturnType<typeof vi.fn>
  from: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  selectEq: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  profileSelect: ReturnType<typeof vi.fn>
  profileEq: ReturnType<typeof vi.fn>
  profileSingle: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  updateEq: ReturnType<typeof vi.fn>
  updateEq2: ReturnType<typeof vi.fn>
  updateSelect: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
}

function createBookingSupabase(
  fromStatus: BookingStatus,
  toStatus: BookingStatus,
  options: {
    userId?: string
    travelerId?: string
    guideId?: string
    role?: string
  } = {},
): SupabaseChain {
  const userId = options.userId ?? 'user-1'
  const travelerId = options.travelerId ?? 'traveler-1'
  const guideId = options.guideId ?? 'guide-1'
  const role = options.role ?? 'admin'
  const authGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  })
  const maybeSingle = vi.fn().mockResolvedValue({
    data: { id: 'booking-1', status: fromStatus, traveler_id: travelerId, guide_id: guideId },
    error: null,
  })
  const selectEq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq: selectEq }))

  const profileSingle = vi.fn().mockResolvedValue({
    data: { id: userId, role },
    error: null,
  })
  const profileEq = vi.fn(() => ({ maybeSingle: profileSingle }))
  const profileSelect = vi.fn(() => ({ eq: profileEq }))

  const single = vi.fn().mockResolvedValue({
    data: { id: 'booking-1', status: toStatus },
    error: null,
  })
  const updateSelect = vi.fn(() => ({ single }))
  const updateEq2 = vi.fn(() => ({ select: updateSelect }))
  const updateEq = vi.fn(() => ({ eq: updateEq2 }))
  const update = vi.fn(() => ({ eq: updateEq }))

  const from = vi.fn((table: string) =>
    table === 'profiles'
      ? {
          select: profileSelect,
        }
      : {
          select,
          update,
        },
  )

  return {
    authGetUser,
    from,
    select,
    selectEq,
    maybeSingle,
    profileSelect,
    profileEq,
    profileSingle,
    update,
    updateEq,
    updateEq2,
    updateSelect,
    single,
  }
}

describe('BOOKING_TRANSITIONS', () => {
  it('defines the expected transition map', () => {
    expect(BOOKING_TRANSITIONS).toEqual({
      pending: ['confirmed', 'cancelled', 'awaiting_guide_confirmation'],
      awaiting_guide_confirmation: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled', 'disputed', 'no_show'],
      completed: [],
      cancelled: [],
      disputed: ['cancelled'],
      no_show: [],
    })
  })
})

describe('canTransition', () => {
  const validTransitions: Array<[BookingStatus, BookingStatus]> = [
    ['pending', 'confirmed'],
    ['pending', 'cancelled'],
    ['pending', 'awaiting_guide_confirmation'],
    ['awaiting_guide_confirmation', 'confirmed'],
    ['awaiting_guide_confirmation', 'cancelled'],
    ['confirmed', 'completed'],
    ['confirmed', 'cancelled'],
    ['confirmed', 'disputed'],
    ['confirmed', 'no_show'],
    ['disputed', 'cancelled'],
  ]

  const invalidTransitions: Array<[BookingStatus, BookingStatus]> = [
    ['pending', 'completed'],
    ['pending', 'disputed'],
    ['confirmed', 'pending'],
    ['completed', 'cancelled'],
    ['cancelled', 'confirmed'],
    ['disputed', 'confirmed'],
    ['awaiting_guide_confirmation', 'completed'],
    ['no_show', 'confirmed'],
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
    ['pending', 'awaiting_guide_confirmation'],
    ['awaiting_guide_confirmation', 'confirmed'],
    ['awaiting_guide_confirmation', 'cancelled'],
    ['confirmed', 'completed'],
    ['confirmed', 'cancelled'],
    ['confirmed', 'disputed'],
    ['confirmed', 'no_show'],
    ['disputed', 'cancelled'],
  ]

  const invalidTransitions: Array<[BookingStatus, BookingStatus]> = [
    ['pending', 'completed'],
    ['pending', 'disputed'],
    ['completed', 'confirmed'],
    ['cancelled', 'pending'],
    ['disputed', 'completed'],
    ['awaiting_guide_confirmation', 'completed'],
    ['no_show', 'confirmed'],
  ]

  it.each(validTransitions)('persists a valid transition from %s to %s', async (from, to) => {
    const supabase = createBookingSupabase(from, to)
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: supabase.authGetUser,
      },
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
      auth: {
        getUser: supabase.authGetUser,
      },
      from: supabase.from,
    })

    await expect(transitionBooking('booking-1', to, 'user-1')).rejects.toThrow(
      `Invalid booking transition: ${from} → ${to}`,
    )

    expect(supabase.update).not.toHaveBeenCalled()
  })

  it('rejects a caller who does not own the booking', async () => {
    const supabase = createBookingSupabase('confirmed', 'completed', {
      userId: 'traveler-2',
      role: 'traveler',
    })
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: supabase.authGetUser,
      },
      from: supabase.from,
    })

    await expect(transitionBooking('booking-1', 'completed', 'traveler-2')).rejects.toThrow(
      'Нет доступа к изменению статуса бронирования.',
    )

    expect(supabase.update).not.toHaveBeenCalled()
  })
})
