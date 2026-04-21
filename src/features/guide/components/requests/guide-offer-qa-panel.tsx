'use client'

import { useEffect, useState } from 'react'
import { type QaThread } from '@/lib/supabase/qa-threads'
import { getQaPanelDataAction } from '../../actions/send-qa-reply'
import { sendQaReplyAction } from '../../actions/send-qa-reply'
import { GuideQaReplyForm } from './guide-qa-reply-form'

interface Props {
  offerId: string
}

export function GuideOfferQaPanel({ offerId }: Props) {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [qa, setQa] = useState<QaThread | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getQaPanelDataAction(offerId).then((result) => {
      if (cancelled) return
      if (result) {
        setThreadId(result.threadId)
        setQa(result.qa)
      } else {
        setThreadId(null)
        setQa(null)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [offerId])

  if (loading) {
    return <p className="text-xs text-muted-foreground py-2">Загрузка вопросов...</p>
  }

  if (!threadId || !qa) {
    return <p className="text-sm text-muted-foreground py-2">Вопросов пока нет</p>
  }

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
          threadId={threadId}
          offerId={offerId}
          onReply={sendQaReplyAction}
        />
      )}
    </div>
  )
}
