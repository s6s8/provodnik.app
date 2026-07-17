import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

import { acceptOffer } from '@/features/messaging/actions/offerActions'

// acceptOffer now delegates to the atomic accept_offer RPC (single authority). It
// no longer runs its own offer/request lookup or offer-only status flip — it just
// authenticates, calls the RPC, and maps the RPC's errors to user messages.
function makeSupabase(opts: {
  user?: { id: string } | null
  rpcData?: unknown
  rpcError?: { message: string } | null
}) {
  const rpc = vi.fn().mockResolvedValue({
    data: opts.rpcData ?? null,
    error: opts.rpcError ?? null,
  })
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user ?? null }, error: null }),
    },
    rpc,
  }
  createSupabaseServerClient.mockResolvedValue(supabase)
  return { supabase, rpc }
}

describe('acceptOffer (single authority via accept_offer RPC)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws Unauthorized when no user session', async () => {
    makeSupabase({ user: null })
    await expect(acceptOffer('offer-1')).rejects.toThrow('Unauthorized')
  })

  it('calls accept_offer with only the offer id and returns the booking id', async () => {
    const { rpc } = makeSupabase({ user: { id: 'trav-1' }, rpcData: 'booking-9' })
    await expect(acceptOffer('offer-1')).resolves.toEqual({
      success: true,
      bookingId: 'booking-9',
    })
    expect(rpc).toHaveBeenCalledWith('accept_offer', { p_offer_id: 'offer-1' })
  })

  it('maps offer_expired to the expiry message', async () => {
    makeSupabase({ user: { id: 'trav-1' }, rpcError: { message: 'offer_expired' } })
    await expect(acceptOffer('offer-1')).rejects.toThrow('Срок действия предложения истёк.')
  })

  it('maps offer_not_found to the not-pending message', async () => {
    makeSupabase({ user: { id: 'trav-1' }, rpcError: { message: 'offer_not_found' } })
    await expect(acceptOffer('offer-1')).rejects.toThrow(
      'Предложение уже не в статусе ожидания.',
    )
  })

  it('maps unauthorized to the ownership message', async () => {
    makeSupabase({ user: { id: 'trav-1' }, rpcError: { message: 'unauthorized' } })
    await expect(acceptOffer('offer-1')).rejects.toThrow(
      'Только автор запроса может принять предложение.',
    )
  })
})
