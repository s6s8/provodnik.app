import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

import { getUserThreads, sendMessage } from '@/lib/supabase/conversations'

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

function createThreadListSupabase() {
  const userId = '22222222-2222-4222-8222-222222222222'
  const threadId = '11111111-1111-4111-8111-111111111111'
  const latestMessage = {
    thread_id: threadId,
    sender_id: '33333333-3333-4333-8333-333333333333',
    body: 'Последнее сообщение',
    created_at: '2026-04-01T12:00:00.000Z',
  }
  const fixtures = {
    participantThread: [
      {
        thread_id: threadId,
        user_id: userId,
        joined_at: '2026-04-01T10:00:00.000Z',
        last_read_at: null,
        thread: {
          id: threadId,
          subject_type: 'request',
          request_id: '44444444-4444-4444-8444-444444444444',
          offer_id: null,
          booking_id: null,
          dispute_id: null,
          created_by: userId,
          created_at: '2026-04-01T10:00:00.000Z',
          updated_at: '2026-04-01T12:00:00.000Z',
        },
      },
    ],
    participantsWithProfiles: [
      {
        thread_id: threadId,
        user_id: userId,
        joined_at: '2026-04-01T10:00:00.000Z',
        last_read_at: null,
        profile: { id: userId, full_name: 'Путешественник' },
      },
      {
        thread_id: threadId,
        user_id: '33333333-3333-4333-8333-333333333333',
        joined_at: '2026-04-01T10:01:00.000Z',
        last_read_at: null,
        profile: { id: '33333333-3333-4333-8333-333333333333', full_name: 'Гид' },
      },
    ],
    latestMessages: [latestMessage],
    threadsWithLatestMessage: [
      {
        id: threadId,
        latest_message: [latestMessage],
      },
    ],
  }
  let participantQueryCount = 0

  const makeQuery = (data: unknown[]) => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      in: vi.fn(() => query),
      order: vi.fn(() => query),
      limit: vi.fn(() => query),
      then: vi.fn((resolve, reject) =>
        Promise.resolve({ data, error: null }).then(resolve, reject),
      ),
    }
    return query
  }

  const queries: Record<string, ReturnType<typeof makeQuery>[]> = {
    thread_participants: [],
    messages: [],
    conversation_threads: [],
  }

  const from = vi.fn((table: string) => {
    if (table === 'thread_participants') {
      participantQueryCount += 1
      const query = makeQuery(
        participantQueryCount === 1
          ? fixtures.participantThread
          : fixtures.participantsWithProfiles,
      )
      queries.thread_participants.push(query)
      return query
    }

    if (table === 'messages') {
      const query = makeQuery(fixtures.latestMessages)
      queries.messages.push(query)
      return query
    }

    if (table === 'conversation_threads') {
      const query = makeQuery(fixtures.threadsWithLatestMessage)
      queries.conversation_threads.push(query)
      return query
    }

    return makeQuery([])
  })

  return { from, queries }
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

describe('getUserThreads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads only the latest message per thread instead of all message rows', async () => {
    const supabase = createThreadListSupabase()
    createSupabaseServerClient.mockResolvedValue({ from: supabase.from })

    await expect(
      getUserThreads('22222222-2222-4222-8222-222222222222'),
    ).resolves.toHaveLength(1)

    expect(supabase.from).not.toHaveBeenCalledWith('messages')
    expect(supabase.from).toHaveBeenCalledWith('conversation_threads')
    expect(supabase.queries.conversation_threads[0]?.limit).toHaveBeenCalledWith(
      1,
      { referencedTable: 'latest_message' },
    )
  })
})
