import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'

const { createSupabaseServerClient, notifyBookingCreated, notifyNewOffer } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  notifyBookingCreated: vi.fn(),
  notifyNewOffer: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient }))
vi.mock('@/lib/notifications/triggers', () => ({ notifyBookingCreated, notifyNewOffer }))

import { maskPii } from '@/lib/pii/mask'
import {
  acceptOfferForTraveler,
  createGuideOffer,
  createOfferInputSchema,
} from '@/lib/supabase/offers'

describe('maskPii contract', () => {
  it('masks a Russian phone number with +7', () => {
    expect(maskPii('Позвони +7 (999) 123-45-67')).toContain('[контакт скрыт]')
  })

  it('masks a Russian phone starting with 8', () => {
    expect(maskPii('тел 89001234567')).toContain('[контакт скрыт]')
  })

  it('masks an email address', () => {
    expect(maskPii('guide@example.com')).toContain('[контакт скрыт]')
  })

  it('masks a telegram @handle', () => {
    expect(maskPii('мой телеграм @ivanov_guide')).toContain('[контакт скрыт]')
  })

  it('masks t.me link', () => {
    expect(maskPii('пиши t.me/myguide')).toContain('[контакт скрыт]')
  })

  it('does NOT mask the word телеграм without handle', () => {
    const text = 'нет связи как в телеграме'
    expect(maskPii(text)).toBe(text)
  })

  it('does NOT mask a price like 8 000 рублей', () => {
    const text = 'Цена 8 000 рублей за группу'
    expect(maskPii(text)).toBe(text)
  })

  it('returns empty string for null', () => {
    expect(maskPii(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(maskPii(undefined)).toBe('')
  })
})

describe('getOffersForRequest masks message field', () => {
  it('maskPii removes phone from offer message', () => {
    const rawMessage = 'Звоните +79001234567 в любое время'
    const masked = maskPii(rawMessage)
    expect(masked).not.toContain('+79001234567')
    expect(masked).toContain('[контакт скрыт]')
  })

  it('maskPii removes email from offer message', () => {
    const rawMessage = 'Пишите guide@mail.ru'
    const masked = maskPii(rawMessage)
    expect(masked).not.toContain('guide@mail.ru')
    expect(masked).toContain('[контакт скрыт]')
  })
})

// D21-10: accepting an offer is what creates the guide's booking, so the guide must
// get the booking notification from EVERY accept surface. The request page notified;
// the message thread called the same RPC and notified nobody. Both now route through
// this one helper so the notification can't be forgotten by the next caller.
describe('acceptOfferForTraveler', () => {
  function makeSupabase(rpcResult: {
    data: unknown
    error: { message: string } | null
  }) {
    const rpc = vi.fn().mockResolvedValue(rpcResult)
    createSupabaseServerClient.mockResolvedValue({ rpc })
    return rpc
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('notifies the guide exactly once with the committed booking id', async () => {
    const rpc = makeSupabase({ data: 'booking-1', error: null })

    await expect(acceptOfferForTraveler('offer-1')).resolves.toEqual({
      bookingId: 'booking-1',
      error: null,
    })

    expect(rpc).toHaveBeenCalledWith('accept_offer', { p_offer_id: 'offer-1' })
    expect(notifyBookingCreated).toHaveBeenCalledTimes(1)
    expect(notifyBookingCreated).toHaveBeenCalledWith('booking-1')
  })

  it.each([
    ['expired offer', { data: null, error: { message: 'offer_expired' } }],
    ['duplicate / losing race', { data: null, error: { message: 'offer_not_found' } }],
    ['not the request owner', { data: null, error: { message: 'unauthorized' } }],
    ['no booking committed', { data: null, error: null }],
  ])('sends no notification when acceptance fails: %s', async (_label, rpcResult) => {
    makeSupabase(rpcResult)

    const result = await acceptOfferForTraveler('offer-1')

    expect(result.bookingId).toBeNull()
    expect(result.error).toBeTruthy()
    expect(notifyBookingCreated).not.toHaveBeenCalled()
  })

  it('keeps the committed booking when notification delivery fails', async () => {
    makeSupabase({ data: 'booking-1', error: null })
    notifyBookingCreated.mockRejectedValueOnce(new Error('notification backend down'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(acceptOfferForTraveler('offer-1')).resolves.toEqual({
      bookingId: 'booking-1',
      error: null,
    })

    consoleError.mockRestore()
  })
})

// #46: the traveler learns about a new offer from the committed insert, not from
// whichever screen submitted it. createGuideOffer owns the post-commit notify so
// every submission path gets it exactly once.
describe('createGuideOffer', () => {
  const requestId = '00000000-0000-4000-8000-000000000001'
  const offerId = '00000000-0000-4000-8000-000000000002'
  const guideId = '00000000-0000-4000-8000-000000000003'
  const validInput = {
    request_id: requestId,
    price_total: 5000,
    message: 'Покажу город и расскажу историю.',
    valid_until: '2027-01-01',
    route_stops: [],
    inclusions: [],
    capacity: 2,
  }

  function makeInsertSupabase() {
    const single = vi.fn().mockResolvedValue({
      data: { id: offerId, request_id: requestId, guide_id: guideId, status: 'pending' },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    createSupabaseServerClient.mockResolvedValue({
      from: vi.fn(() => ({ insert })),
    })
    return { insert }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T09:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('notifies the traveler exactly once after the offer commits', async () => {
    makeInsertSupabase()

    await expect(createGuideOffer(validInput, guideId)).resolves.toMatchObject({
      id: offerId,
    })

    expect(notifyNewOffer).toHaveBeenCalledTimes(1)
    expect(notifyNewOffer).toHaveBeenCalledWith(requestId, offerId)
  })

  it('keeps the committed offer when notification delivery fails', async () => {
    makeInsertSupabase()
    notifyNewOffer.mockRejectedValueOnce(new Error('notification backend down'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(createGuideOffer(validInput, guideId)).resolves.toMatchObject({
      id: offerId,
    })

    consoleError.mockRestore()
  })
})

describe('createOfferInputSchema valid_until', () => {
  const base = {
    request_id: '00000000-0000-4000-8000-000000000001',
    price_total: 5000,
    message: 'Покажу город и расскажу историю.',
  }

  const parseValidUntil = (valid_until: string) =>
    createOfferInputSchema.safeParse({ ...base, valid_until })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stores a date-only expiry as the end of that Moscow day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T09:00:00Z'))
    const parsed = parseValidUntil('2026-07-25')
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.valid_until).toBe('2026-07-25T20:59:59.999Z')
  })

  it('accepts today, which is still valid until tonight in Moscow', () => {
    vi.useFakeTimers()
    // 13:00 MSK on 25 July — a guide picking today means "until tonight".
    vi.setSystemTime(new Date('2026-07-25T10:00:00Z'))
    expect(parseValidUntil('2026-07-25').success).toBe(true)
  })

  it('rejects a day that already ended in Moscow', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-25T10:00:00Z'))
    const parsed = parseValidUntil('2026-07-24')
    expect(parsed.success).toBe(false)
    expect(parsed.success === false && parsed.error.issues[0]?.message).toBe(
      'Expiry date must be in the future.',
    )
  })

  it('rejects an already elapsed timestamp', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-25T10:00:00Z'))
    expect(parseValidUntil('2026-07-25T09:59:59.999Z').success).toBe(false)
  })

  it('is idempotent — createGuideOffer re-parses the already normalized value', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T09:00:00Z'))
    const once = parseValidUntil('2026-07-25')
    expect(once.success).toBe(true)
    const twice = once.success ? parseValidUntil(once.data.valid_until) : null
    expect(twice?.success).toBe(true)
    expect(twice?.success && twice.data.valid_until).toBe('2026-07-25T20:59:59.999Z')
  })
})
