import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createUserMock,
  updateUserByIdMock,
  upsertMock,
  fromMock,
  signInWithPasswordMock,
  createSupabaseAdminClient,
  createSupabaseServerClient,
} = vi.hoisted(() => {
  const createUserMock = vi.fn()
  const updateUserByIdMock = vi.fn()
  const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const fromMock = vi.fn(() => ({ upsert: upsertMock }))
  const signInWithPasswordMock = vi.fn()

  const adminClient = {
    auth: {
      admin: {
        createUser: createUserMock,
        updateUserById: updateUserByIdMock,
      },
    },
    from: fromMock,
  }

  const serverClient = {
    auth: { signInWithPassword: signInWithPasswordMock },
  }

  return {
    createUserMock,
    updateUserByIdMock,
    upsertMock,
    fromMock,
    signInWithPasswordMock,
    createSupabaseAdminClient: vi.fn(() => adminClient),
    createSupabaseServerClient: vi.fn(async () => serverClient),
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient,
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

import { signUpAction } from '@/features/auth/actions/signUpAction'

const baseInput = {
  email: 'traveler@example.com',
  password: 'super-secret',
  fullName: 'Анна Смирнова',
  phone: '+7 900 123-45-67',
} as const

function assertNoSupabaseSideEffects() {
  expect(createSupabaseAdminClient).not.toHaveBeenCalled()
  expect(createSupabaseServerClient).not.toHaveBeenCalled()
  expect(createUserMock).not.toHaveBeenCalled()
  expect(updateUserByIdMock).not.toHaveBeenCalled()
  expect(fromMock).not.toHaveBeenCalled()
  expect(upsertMock).not.toHaveBeenCalled()
  expect(signInWithPasswordMock).not.toHaveBeenCalled()
}

describe('signUpAction — forbidden_role guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    upsertMock.mockResolvedValue({ data: null, error: null })
  })

  it('rejects role:guide with forbidden_role', async () => {
    const result = await signUpAction({ ...baseInput, role: 'guide' })

    expect(result).toEqual({ ok: false, error: 'forbidden_role' })
    assertNoSupabaseSideEffects()
  })

  it('rejects role:admin with forbidden_role', async () => {
    const result = await signUpAction({ ...baseInput, role: 'admin' })

    expect(result).toEqual({ ok: false, error: 'forbidden_role' })
    assertNoSupabaseSideEffects()
  })

  it('rejects any non-traveler value (e.g. empty / unknown) with forbidden_role', async () => {
    const blank = await signUpAction({ ...baseInput, role: '' })
    expect(blank).toEqual({ ok: false, error: 'forbidden_role' })

    const unknown = await signUpAction({ ...baseInput, role: 'partner' })
    expect(unknown).toEqual({ ok: false, error: 'forbidden_role' })

    assertNoSupabaseSideEffects()
  })

  it('allows role:traveler — existing happy path proceeds through admin client', async () => {
    createUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    updateUserByIdMock.mockResolvedValue({ data: null, error: null })
    signInWithPasswordMock.mockResolvedValue({ data: {}, error: null })

    const result = await signUpAction({ ...baseInput, role: 'traveler' })

    expect(result).toEqual({ ok: true, dashboardPath: '/traveler/requests' })
    expect(createSupabaseAdminClient).toHaveBeenCalledTimes(1)
    expect(createUserMock).toHaveBeenCalledTimes(1)
    expect(signInWithPasswordMock).toHaveBeenCalledTimes(1)

    // guide_profiles must never be touched on the traveler path.
    const tablesTouched = (fromMock.mock.calls as unknown as Array<[string]>).map((call) => call[0])
    expect(tablesTouched).toContain('profiles')
    expect(tablesTouched).not.toContain('guide_profiles')
  })
})
