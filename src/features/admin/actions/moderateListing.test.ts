import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerClient, createSupabaseAdminClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient,
}))

import { approveListing, rejectListing } from '@/features/admin/actions/moderateListing'
import { PUBLIC_LISTING_STATUS } from '@/lib/supabase/types'

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

  // Service-role client: listing_moderation_events has INSERT/SELECT policies and
  // no UPDATE policy, so the reason can only be attached with RLS bypassed.
  const eventIsNull = vi.fn().mockResolvedValue({ error: null })
  const eventEqStatus = vi.fn(() => ({ is: eventIsNull, order: eventOrder }))
  const eventOrder = vi.fn(() => ({ limit: vi.fn().mockResolvedValue({ error: null }) }))
  const eventEqListing = vi.fn(() => ({ eq: eventEqStatus }))
  const eventUpdate = vi.fn(() => ({ eq: eventEqListing }))
  const adminFrom = vi.fn(() => ({ update: eventUpdate }))
  createSupabaseAdminClient.mockReturnValue({ from: adminFrom })

  return {
    listingUpdate,
    supabase,
    adminFrom,
    eventUpdate,
  }
}

describe('approveListing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Item 14: the queue wrote `active` while every public reader (getActiveListings,
  // sitemap, all listing_* RLS policies) gates on `published`. So a queue-approved
  // excursion was approved AND publicly invisible, with nothing in the UI saying so.
  // The status the queue writes must be the status the public catalog reads.
  it('approves into the status the public catalog actually reads', async () => {
    const { listingUpdate } = makeSupabase({
      user: { id: 'admin-1', user_metadata: {}, app_metadata: { role: 'admin' } },
    })

    await approveListing('listing-1')

    expect(listingUpdate).toHaveBeenCalledWith({ status: PUBLIC_LISTING_STATUS })
    expect(listingUpdate).not.toHaveBeenCalledWith({ status: 'active' })
  })

  it('succeeds when app_metadata role is admin', async () => {
    const { listingUpdate } = makeSupabase({
      user: { id: 'admin-1', user_metadata: {}, app_metadata: { role: 'admin' } },
    })

    await expect(approveListing('listing-1')).resolves.toEqual({ success: true })

    expect(listingUpdate).toHaveBeenCalledWith({ status: 'published' })
  })

  it('succeeds when profiles.role is admin and app_metadata is empty', async () => {
    const { listingUpdate } = makeSupabase({
      user: { id: 'admin-1', user_metadata: {}, app_metadata: {} },
      profile: { role: 'admin' },
    })

    await expect(approveListing('listing-1')).resolves.toEqual({ success: true })

    expect(listingUpdate).toHaveBeenCalledWith({ status: 'published' })
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

describe('rejectListing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // The UI validates the reason as required (ModerationQueueItem), and the guide
  // can read listing_moderation_events for their own listing — but the action took
  // the reason as `_reason` and dropped it, so the guide was never told why.
  // NB: listings.rejection_reason does NOT exist (types.ts declares a column the
  // schema never had); the reason belongs on the event row the trigger writes.
  it('persists the rejection reason so the guide can see it', async () => {
    const { listingUpdate, adminFrom, eventUpdate } = makeSupabase({
      user: { id: 'admin-1', user_metadata: {}, app_metadata: { role: 'admin' } },
    })

    await expect(rejectListing('listing-1', '  Фото не соответствует маршруту  ')).resolves.toEqual({
      success: true,
    })

    expect(listingUpdate).toHaveBeenCalledWith({ status: 'rejected' })
    expect(adminFrom).toHaveBeenCalledWith('listing_moderation_events')
    expect(eventUpdate).toHaveBeenCalledWith({ reason: 'Фото не соответствует маршруту' })
  })

  it('refuses an empty reason instead of rejecting silently', async () => {
    const { listingUpdate } = makeSupabase({
      user: { id: 'admin-1', user_metadata: {}, app_metadata: { role: 'admin' } },
    })

    await expect(rejectListing('listing-1', '   ')).rejects.toThrow(/причин/i)

    expect(listingUpdate).not.toHaveBeenCalled()
  })

  it('never rejects for a non-admin', async () => {
    const { listingUpdate } = makeSupabase({
      user: { id: 'user-1', user_metadata: { role: 'admin' }, app_metadata: {} },
      profile: { role: 'traveler' },
    })

    await expect(rejectListing('listing-1', 'причина')).rejects.toThrow('Forbidden')

    expect(listingUpdate).not.toHaveBeenCalled()
  })
})
