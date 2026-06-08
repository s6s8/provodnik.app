import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

import { approveListing } from '@/features/admin/actions/moderateListing'

function makeSupabase(opts: {
  user?: { id: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null
  profile?: Record<string, unknown> | null
}) {
  const user = opts.user ?? null
  const profile = opts.profile ?? null

  const authGetUser = vi.fn().mockResolvedValue({
    data: { user },
    error: null,
  })

  const profileMaybeSingle = vi.fn().mockResolvedValue({
    data: profile,
    error: null,
  })
  const profileSelectEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }))
  const profileSelect = vi.fn(() => ({ eq: profileSelectEq }))

  const listingUpdateEqStatus = vi.fn().mockResolvedValue({ error: null })
  const listingUpdateEqId = vi.fn(() => ({ eq: listingUpdateEqStatus }))
  const listingUpdate = vi.fn(() => ({ eq: listingUpdateEqId }))

  const fromFn = vi.fn((table: string) => {
    if (table === 'profiles') {
      return { select: profileSelect }
    }
    if (table === 'listings') {
      return { update: listingUpdate }
    }
    return { select: profileSelect }
  })

  const supabase = {
    auth: { getUser: authGetUser },
    from: fromFn,
  }

  createSupabaseServerClient.mockResolvedValue(supabase)
  return {
    listingUpdate,
    supabase,
  }
}

describe('approveListing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('succeeds when app_metadata role is admin', async () => {
    const { listingUpdate } = makeSupabase({
      user: { id: 'admin-1', user_metadata: {}, app_metadata: { role: 'admin' } },
    })

    await expect(approveListing('listing-1')).resolves.toEqual({ success: true })

    expect(listingUpdate).toHaveBeenCalledWith({ status: 'active' })
  })

  it('succeeds when profiles.role is admin and app_metadata is empty', async () => {
    const { listingUpdate } = makeSupabase({
      user: { id: 'admin-1', user_metadata: {}, app_metadata: {} },
      profile: { role: 'admin' },
    })

    await expect(approveListing('listing-1')).resolves.toEqual({ success: true })

    expect(listingUpdate).toHaveBeenCalledWith({ status: 'active' })
  })

  it('rejects when only user_metadata role is admin', async () => {
    const { listingUpdate } = makeSupabase({
      user: { id: 'user-1', user_metadata: { role: 'admin' }, app_metadata: {} },
      profile: { role: 'traveler' },
    })

    await expect(approveListing('listing-1')).rejects.toThrow('Forbidden')

    expect(listingUpdate).not.toHaveBeenCalled()
  })

  it('throws Unauthorized when no user', async () => {
    const { listingUpdate } = makeSupabase({ user: null })

    await expect(approveListing('listing-1')).rejects.toThrow('Unauthorized')

    expect(listingUpdate).not.toHaveBeenCalled()
  })
})
