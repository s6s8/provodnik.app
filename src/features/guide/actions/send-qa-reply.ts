'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getQaMessages, type QaThread } from '@/lib/supabase/qa-threads'
import { sendQaMessage } from '@/lib/supabase/qa-threads'
import { revalidatePath } from 'next/cache'

export async function getQaPanelDataAction(
  offerId: string,
): Promise<{ threadId: string; qa: QaThread } | null> {
  const supabase = await createSupabaseServerClient()
  const { data: thread } = await supabase
    .from('conversation_threads')
    .select('id')
    .eq('offer_id', offerId)
    .eq('subject_type', 'offer')
    .maybeSingle()
  if (!thread) return null
  const qa = await getQaMessages(thread.id)
  return { threadId: thread.id, qa }
}

export async function sendQaReplyAction(
  threadId: string,
  offerId: string,
  body: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify this guide owns the offer
  const { data: offer } = await supabase
    .from('guide_offers')
    .select('id')
    .eq('id', offerId)
    .eq('guide_id', user.id)
    .maybeSingle()

  if (!offer) throw new Error('Нет доступа к этому предложению')

  try {
    await sendQaMessage(threadId, user.id, 'guide', body)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'qa_thread_at_limit') throw new Error('Достигнут лимит сообщений (8).')
    throw new Error('Не удалось отправить ответ. Попробуйте ещё раз.')
  }

  revalidatePath('/guide/inbox')
}
