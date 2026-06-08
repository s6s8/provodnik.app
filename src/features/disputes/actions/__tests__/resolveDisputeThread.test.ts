import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}))

const { resolveDispute } = vi.hoisted(() => ({
  resolveDispute: vi.fn(),
}))

const { flags } = vi.hoisted(() => ({
  flags: { FEATURE_TR_DISPUTES: true },
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

vi.mock('@/lib/supabase/disputes', () => ({
  resolveDispute,
}))

vi.mock('@/lib/flags', () => ({
  flags,
}))

import { resolveDisputeThreadAction } from '@/features/disputes/actions/resolveDisputeThread'

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

  const fromFn = vi.fn((table: string) => {
    if (table === 'profiles') {
      return { select: profileSelect }
    }
    return { select: profileSelect }
  })

  const supabase = {
    auth: { getUser: authGetUser },
    from: fromFn,
  }

  createSupabaseServerClient.mockResolvedValue(supabase)
  return supabase
}

describe('resolveDisputeThreadAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    flags.FEATURE_TR_DISPUTES = true
  })

  it('throws "Feature disabled" when FEATURE_TR_DISPUTES is false', async () => {
    flags.FEATURE_TR_DISPUTES = false

    await expect(
      resolveDisputeThreadAction('dispute-1', 'resolved'),
    ).rejects.toThrow('Feature disabled')
  })

  it('throws Unauthorized when no user', async () => {
    makeSupabase({ user: null })

    await expect(
      resolveDisputeThreadAction('dispute-1', 'resolved'),
    ).rejects.toThrow('Unauthorized')
  })

  it('throws "Только администратор может разрешить спор." when JWT role is not admin AND profile.role is not admin', async () => {
    makeSupabase({
      user: { id: 'user-1', user_metadata: { role: 'traveler' }, app_metadata: { role: 'traveler' } },
      profile: { role: 'traveler' },
    })

    await expect(
      resolveDisputeThreadAction('dispute-1', 'resolved'),
    ).rejects.toThrow('Только администратор может разрешить спор.')
  })

  it('succeeds when JWT role is admin', async () => {
    makeSupabase({
      user: { id: 'admin-1', user_metadata: {}, app_metadata: { role: 'admin' } },
    })

    resolveDispute.mockResolvedValueOnce({})

    await resolveDisputeThreadAction('dispute-1', '  resolved summary  ')

    expect(resolveDispute).toHaveBeenCalledWith('dispute-1', 'admin-1', 'resolved summary')
  })

  it('rejects when only user_metadata role is admin', async () => {
    makeSupabase({
      user: { id: 'user-1', user_metadata: { role: 'admin' }, app_metadata: {} },
      profile: { role: 'traveler' },
    })

    await expect(
      resolveDisputeThreadAction('dispute-1', 'resolved'),
    ).rejects.toThrow('Только администратор может разрешить спор.')

    expect(resolveDispute).not.toHaveBeenCalled()
  })

  it('succeeds when profile.role is admin (AP-038 fallback path)', async () => {
    makeSupabase({
      user: { id: 'admin-1', user_metadata: { role: 'traveler' }, app_metadata: {} },
      profile: { role: 'admin' },
    })

    resolveDispute.mockResolvedValueOnce({})

    await resolveDisputeThreadAction('dispute-1', 'resolved')

    expect(resolveDispute).toHaveBeenCalledWith('dispute-1', 'admin-1', 'resolved')
  })
})