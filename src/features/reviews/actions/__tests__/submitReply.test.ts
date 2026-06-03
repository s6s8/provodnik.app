import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient,
}))

import { saveReplyDraft, submitReplyForReview } from '@/features/reviews/actions/submitReply'

function makeSupabase(opts: {
  user?: { id: string } | null
  reply?: Record<string, unknown> | null
  review?: Record<string, unknown> | null
  booking?: Record<string, unknown> | null
  updateResult?: { data: unknown; error: Error | null; count?: number | null }
  insertResult?: { data: unknown; error: Error | null }
}) {
  const user = opts.user ?? null
  const reply = opts.reply ?? null
  const review = opts.review ?? null
  const booking = opts.booking ?? null

  const authGetUser = vi.fn().mockResolvedValue({
    data: { user },
    error: null,
  })

  const replyMaybeSingle = vi.fn().mockResolvedValue({
    data: reply,
    error: null,
  })
  const replySelectQuery = {
    eq: vi.fn(() => replySelectQuery),
    maybeSingle: replyMaybeSingle,
    single: replyMaybeSingle,
  }
  const replySelect = vi.fn(() => replySelectQuery)

  const reviewMaybeSingle = vi.fn().mockResolvedValue({
    data: review,
    error: null,
  })
  const reviewSelectQuery = {
    eq: vi.fn(() => reviewSelectQuery),
    maybeSingle: reviewMaybeSingle,
  }
  const reviewSelect = vi.fn(() => reviewSelectQuery)

  const bookingMaybeSingle = vi.fn().mockResolvedValue({
    data: booking,
    error: null,
  })
  const bookingSelectQuery = {
    eq: vi.fn(() => bookingSelectQuery),
    maybeSingle: bookingMaybeSingle,
  }
  const bookingSelect = vi.fn(() => bookingSelectQuery)

  const updateEq2 = vi.fn().mockResolvedValue(
    opts.updateResult ?? { data: null, error: null, count: 1 },
  )
  const updateEq = vi.fn(() => ({ eq: updateEq2 }))
  const update = vi.fn(() => ({ eq: updateEq }))
  const insertSingle = vi.fn().mockResolvedValue(
    opts.insertResult ?? { data: { id: 'reply-new' }, error: null },
  )
  const insertSelect = vi.fn(() => ({ single: insertSingle }))
  const insert = vi.fn(() => ({ select: insertSelect }))

  const fromFn = vi.fn((table: string) => {
    if (table === 'review_replies') {
      return { select: replySelect, update, insert }
    }
    if (table === 'reviews') {
      return { select: reviewSelect }
    }
    if (table === 'bookings') {
      return { select: bookingSelect }
    }
    return { select: replySelect, update }
  })

  const supabase = {
    auth: { getUser: authGetUser },
    from: fromFn,
    __mocks: {
      insert,
      update,
    },
  }

  createSupabaseServerClient.mockResolvedValue(supabase)
  return supabase
}

describe('submitReplyForReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws Unauthorized when no user', async () => {
    makeSupabase({ user: null })

    await expect(submitReplyForReview('reply-1', 'review-1')).rejects.toThrow('Unauthorized')
  })

  it('throws "Ответ не найден." when reply maybeSingle returns null', async () => {
    makeSupabase({
      user: { id: 'guide-1' },
      reply: null,
    })

    await expect(submitReplyForReview('reply-1', 'review-1')).rejects.toThrow('Ответ не найден.')
  })

  it('throws "Нет доступа к этому ответу." when reply.guide_id !== user.id', async () => {
    makeSupabase({
      user: { id: 'guide-1' },
      reply: { id: 'reply-1', guide_id: 'other-guide', review_id: 'review-1' },
    })

    await expect(submitReplyForReview('reply-1', 'review-1')).rejects.toThrow(
      'Нет доступа к этому ответу.',
    )
  })

  it('throws "Ответ не относится к этому отзыву." when reply.review_id !== reviewId', async () => {
    makeSupabase({
      user: { id: 'guide-1' },
      reply: { id: 'reply-1', guide_id: 'guide-1', review_id: 'wrong-review' },
    })

    await expect(submitReplyForReview('reply-1', 'review-1')).rejects.toThrow(
      'Ответ не относится к этому отзыву.',
    )
  })

  it('throws "Нет доступа к этому отзыву." when booking.guide_id !== user.id', async () => {
    makeSupabase({
      user: { id: 'guide-1' },
      reply: { id: 'reply-1', guide_id: 'guide-1', review_id: 'review-1' },
      review: { booking_id: 'booking-1' },
      booking: { guide_id: 'other-guide' },
    })

    await expect(submitReplyForReview('reply-1', 'review-1')).rejects.toThrow(
      'Нет доступа к этому отзыву.',
    )
  })

  it('succeeds when all guards pass', async () => {
    const supabase = makeSupabase({
      user: { id: 'guide-1' },
      reply: { id: 'reply-1', guide_id: 'guide-1', review_id: 'review-1' },
      review: { booking_id: 'booking-1' },
      booking: { guide_id: 'guide-1' },
    })

    const result = await submitReplyForReview('reply-1', 'review-1')
    expect(result).toEqual({ success: true })

    expect(supabase.from).toHaveBeenCalledWith('review_replies')
  })

  it('throws when submitting a reply updates no owned row', async () => {
    makeSupabase({
      user: { id: 'guide-1' },
      reply: { id: 'reply-1', guide_id: 'guide-1', review_id: 'review-1' },
      review: { booking_id: 'booking-1' },
      booking: { guide_id: 'guide-1' },
      updateResult: { data: null, error: null, count: 0 },
    })

    await expect(submitReplyForReview('reply-1', 'review-1')).rejects.toThrow(
      'Ответ не найден или не доступен.',
    )
  })

  it('throws when saving an existing draft updates no owned row', async () => {
    makeSupabase({
      user: { id: 'guide-1' },
      review: { id: 'review-1', guide_id: 'guide-1' },
      reply: { id: 'reply-1' },
      updateResult: { data: null, error: null, count: 0 },
    })

    await expect(saveReplyDraft('review-1', 'Draft body')).rejects.toThrow(
      'Ответ не найден или не доступен.',
    )
  })

  it('throws when inserting a new draft returns no row', async () => {
    makeSupabase({
      user: { id: 'guide-1' },
      review: { id: 'review-1', guide_id: 'guide-1' },
      reply: null,
      insertResult: { data: null, error: null },
    })

    await expect(saveReplyDraft('review-1', 'Draft body')).rejects.toThrow(
      'Не удалось сохранить ответ.',
    )
  })
})