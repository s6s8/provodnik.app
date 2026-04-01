import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

import { sendMessage } from '@/lib/supabase/conversations'

function createMessagesSupabase() {
  const single = vi.fn().mockResolvedValue({
    data: {
      id: 'message-1',
      thread_id: '11111111-1111-4111-8111-111111111111',
      sender_id: '22222222-2222-4222-8222-222222222222',
      sender_role: 'guide',
      body: 'Привет, готов помочь с маршрутом.',
      metadata: {},
      created_at: '2026-04-01T12:00:00.000Z',
    },
    error: null,
  })
  const select = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select }))
  const from = vi.fn(() => ({ insert }))

  return { from, insert, select, single }
}

describe('sendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accepts valid input and inserts a trimmed message body', async () => {
    const supabase = createMessagesSupabase()
    createSupabaseServerClient.mockResolvedValue({ from: supabase.from })

    await expect(
      sendMessage(
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
        'guide',
        '  Привет, готов помочь с маршрутом.  ',
      ),
    ).resolves.toMatchObject({
      id: 'message-1',
      body: 'Привет, готов помочь с маршрутом.',
    })

    expect(supabase.insert).toHaveBeenCalledWith({
      thread_id: '11111111-1111-4111-8111-111111111111',
      sender_id: '22222222-2222-4222-8222-222222222222',
      sender_role: 'guide',
      body: 'Привет, готов помочь с маршрутом.',
    })
  })

  it('rejects an empty message body with the schema error', async () => {
    await expect(
      sendMessage(
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
        'guide',
        '   ',
      ),
    ).rejects.toThrow('Сообщение не должно быть пустым.')

    expect(createSupabaseServerClient).not.toHaveBeenCalled()
  })

  it('rejects an invalid sender role with the schema error', async () => {
    await expect(
      sendMessage(
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
        'owner' as never,
        'Сообщение',
      ),
    ).rejects.toThrow('Некорректная роль отправителя.')

    expect(createSupabaseServerClient).not.toHaveBeenCalled()
  })

  it('rejects an invalid thread id with the UUID error', async () => {
    await expect(
      sendMessage(
        'not-a-uuid',
        '22222222-2222-4222-8222-222222222222',
        'guide',
        'Сообщение',
      ),
    ).rejects.toThrow('Некорректный UUID.')

    expect(createSupabaseServerClient).not.toHaveBeenCalled()
  })
})
