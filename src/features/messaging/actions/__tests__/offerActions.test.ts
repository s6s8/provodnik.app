import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

import { acceptOffer } from '@/features/messaging/actions/offerActions'

type SupabaseChain = {
  from: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  selectEq: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  updateEq: ReturnType<typeof vi.fn>
  updateEq2: ReturnType<typeof vi.fn>
  updateMaybeSingle: ReturnType<typeof vi.fn>
}

function makeSupabase(opts: {
  user?: { id: string; email?: string } | null
  offer?: Record<string, unknown> | null
  request?: Record<string, unknown> | null
  updateError?: string | null
}): SupabaseChain {
  const user = opts.user ?? null
  const offer = opts.offer ?? null
  const request = opts.request ?? null

  const authGetUser = vi.fn().mockResolvedValue({
    data: { user },
    error: null,
  })

  const offerMaybeSingle = vi.fn().mockResolvedValue({
    data: offer,
    error: null,
  })
  const selectEq = vi.fn(() => ({ maybeSingle: offerMaybeSingle }))
  const select = vi.fn(() => ({ eq: selectEq }))

  const requestMaybeSingle = vi.fn().mockResolvedValue({
    data: request,
    error: null,
  })
  const requestSelectEq = vi.fn(() => ({ maybeSingle: requestMaybeSingle }))
  const requestSelect = vi.fn(() => ({ eq: requestSelectEq }))

  const updateResult = {
    data: null,
    error: opts.updateError ?? null,
  }
  const updateEq2 = vi.fn().mockResolvedValue(updateResult)
  const updateEq = vi.fn(() => ({ eq: updateEq2 }))
  const update = vi.fn(() => ({ eq: updateEq }))

  const fromFn = vi.fn((table: string) => {
    if (table === 'guide_offers') {
      return { select, update }
    }
    if (table === 'traveler_requests') {
      return { select: requestSelect }
    }
    return { select, update }
  })

  const supabase = {
    auth: { getUser: authGetUser },
    from: fromFn,
  }

  createSupabaseServerClient.mockResolvedValue(supabase)

  return {
    from: fromFn,
    select,
    selectEq,
    maybeSingle: offerMaybeSingle,
    update,
    updateEq,
    updateEq2,
    updateMaybeSingle: offerMaybeSingle,
  }
}

describe('acceptOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws Unauthorized when no user session', async () => {
    makeSupabase({ user: null })

    await expect(acceptOffer('offer-1')).rejects.toThrow('Unauthorized')
  })

  it('throws "Предложение не найдено." when offer does not exist', async () => {
    makeSupabase({ user: { id: 'user-1' }, offer: null })

    await expect(acceptOffer('offer-1')).rejects.toThrow('Предложение не найдено.')
  })

  it('throws "Предложение уже не в статусе ожидания." when offer.status is not pending', async () => {
    makeSupabase({
      user: { id: 'user-1' },
      offer: { id: 'offer-1', request_id: 'req-1', guide_id: 'guide-1', status: 'accepted', expires_at: null },
    })

    await expect(acceptOffer('offer-1')).rejects.toThrow('Предложение уже не в статусе ожидания.')
  })

  it('throws "Срок действия предложения истёк." when offer.expires_at is in the past', async () => {
    makeSupabase({
      user: { id: 'user-1' },
      offer: {
        id: 'offer-1',
        request_id: 'req-1',
        guide_id: 'guide-1',
        status: 'pending',
        expires_at: '2020-01-01T00:00:00Z',
      },
    })

    await expect(acceptOffer('offer-1')).rejects.toThrow('Срок действия предложения истёк.')
  })

  it('throws "Только автор запроса может принять предложение." when user.id !== request.traveler_id', async () => {
    makeSupabase({
      user: { id: 'wrong-user' },
      offer: {
        id: 'offer-1',
        request_id: 'req-1',
        guide_id: 'guide-1',
        status: 'pending',
        expires_at: null,
      },
      request: { traveler_id: 'traveler-1' },
    })

    await expect(acceptOffer('offer-1')).rejects.toThrow(
      'Только автор запроса может принять предложение.',
    )
  })

  it('succeeds when all guards pass', async () => {
    makeSupabase({
      user: { id: 'traveler-1' },
      offer: {
        id: 'offer-1',
        request_id: 'req-1',
        guide_id: 'guide-1',
        status: 'pending',
        expires_at: null,
      },
      request: { traveler_id: 'traveler-1' },
    })

    const result = await acceptOffer('offer-1')
    expect(result).toEqual({ success: true })
  })
})