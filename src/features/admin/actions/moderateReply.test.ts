import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

import { approveReply, rejectReply } from '@/features/admin/actions/moderateReply'

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

  const replyUpdateEqStatus = vi.fn().mockResolvedValue({ error: null })
  const replyUpdateEqId = vi.fn(() => ({ eq: replyUpdateEqStatus }))
  const replyUpdate = vi.fn(() => ({ eq: replyUpdateEqId }))

  const fromFn = vi.fn((table: string) => {
    if (table === 'profiles') {
      return { select: profileSelect }
    }
    if (table === 'review_replies') {
      return { update: replyUpdate }
    }
    return { select: profileSelect }
  })

  const supabase = {
    auth: { getUser: authGetUser },
    from: fromFn,
  }

  createSupabaseServerClient.mockResolvedValue(supabase)
  return {
    replyUpdate,
    supabase,
  }
}

describe('approveReply', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('publishes the reply when app_metadata role is admin', async () => {
    const { replyUpdate } = makeSupabase({
      user: { id: 'admin-1', user_metadata: {}, app_metadata: { role: 'admin' } },
    })

    await expect(approveReply('reply-1')).resolves.toEqual({ success: true })

    expect(replyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' }),
    )
  })

  it('succeeds when profiles.role is admin and app_metadata is empty', async () => {
    const { replyUpdate } = makeSupabase({
      user: { id: 'admin-1', user_metadata: {}, app_metadata: {} },
      profile: { role: 'admin' },
    })

    await expect(approveReply('reply-1')).resolves.toEqual({ success: true })

    expect(replyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' }),
    )
  })

  it('rejects when only user_metadata role is admin', async () => {
    const { replyUpdate } = makeSupabase({
      user: { id: 'user-1', user_metadata: { role: 'admin' }, app_metadata: {} },
      profile: { role: 'traveler' },
    })

    await expect(approveReply('reply-1')).rejects.toThrow('Forbidden')

    expect(replyUpdate).not.toHaveBeenCalled()
  })

  it('throws Unauthorized when no user', async () => {
    const { replyUpdate } = makeSupabase({ user: null })

    await expect(approveReply('reply-1')).rejects.toThrow('Unauthorized')

    expect(replyUpdate).not.toHaveBeenCalled()
  })
})

describe('rejectReply', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends the reply back to draft when admin', async () => {
    const { replyUpdate } = makeSupabase({
      user: { id: 'admin-1', user_metadata: {}, app_metadata: { role: 'admin' } },
    })

    await expect(rejectReply('reply-1')).resolves.toEqual({ success: true })

    expect(replyUpdate).toHaveBeenCalledWith({ status: 'draft' })
  })

  it('throws Forbidden for non-admin', async () => {
    const { replyUpdate } = makeSupabase({
      user: { id: 'user-1', user_metadata: {}, app_metadata: {} },
      profile: { role: 'traveler' },
    })

    await expect(rejectReply('reply-1')).rejects.toThrow('Forbidden')

    expect(replyUpdate).not.toHaveBeenCalled()
  })

  it('throws Unauthorized when no user', async () => {
    const { replyUpdate } = makeSupabase({ user: null })

    await expect(rejectReply('reply-1')).rejects.toThrow('Unauthorized')

    expect(replyUpdate).not.toHaveBeenCalled()
  })
})
