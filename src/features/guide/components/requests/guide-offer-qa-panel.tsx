import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getQaMessages } from '@/lib/supabase/qa-threads'
import { sendQaReplyAction } from '../../actions/send-qa-reply'
import { GuideQaReplyForm } from './guide-qa-reply-form'

interface Props {
  offerId: string
}

export async function GuideOfferQaPanel({ offerId }: Props) {
  const supabase = await createSupabaseServerClient()

  // subject_type = 'offer' — this is the correct enum value for Q&A threads
  // There is NO 'qa' value in the thread_subject enum
  const { data: thread } = await supabase
    .from('conversation_threads')
    .select('id')
    .eq('offer_id', offerId)
    .eq('subject_type', 'offer')
    .maybeSingle()

  if (!thread) {
    return (
      <p className="text-sm text-muted-foreground py-2">Вопросов пока нет</p>
    )
  }

  const qa = await getQaMessages(thread.id)

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Вопросы путешественника
      </p>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {qa.messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender_role === 'guide' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.sender_role === 'guide'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
        {qa.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Вопросов пока нет</p>
        ) : null}
      </div>

      {qa.at_limit ? (
        <p className="text-xs text-muted-foreground">Лимит сообщений достигнут (8)</p>
      ) : (
        <GuideQaReplyForm
          threadId={thread.id}
          offerId={offerId}
          onReply={sendQaReplyAction}
        />
      )}
    </div>
  )
}
