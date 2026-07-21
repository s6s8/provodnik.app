import { beforeEach, describe, it, expect, vi } from 'vitest'

const { createSupabaseServerClient, notifyBookingCreated } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  notifyBookingCreated: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient }))
vi.mock('@/lib/notifications/triggers', () => ({ notifyBookingCreated }))

import { maskPii } from '@/lib/pii/mask'
import { acceptOfferForTraveler } from '@/lib/supabase/offers'

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
