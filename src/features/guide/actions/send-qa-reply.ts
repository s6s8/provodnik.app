'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { sendQaMessage } from '@/lib/supabase/qa-threads'
import { revalidatePath } from 'next/cache'

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
