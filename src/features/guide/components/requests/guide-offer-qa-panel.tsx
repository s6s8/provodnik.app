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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await getQaPanelDataAction(offerId)
        if (cancelled) return
        if (result) {
          setThreadId(result.threadId)
          setQa(result.qa)
        } else {
          setThreadId(null)
          setQa(null)
        }
      } catch {
        if (cancelled) return
        setThreadId(null)
        setQa(null)
        setError('Не удалось загрузить вопросы')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [offerId])

  async function handleReply(replyThreadId: string, replyOfferId: string, body: string) {
    await sendQaReplyAction(replyThreadId, replyOfferId, body)
    const result = await getQaPanelDataAction(offerId)
    if (result) {
      setThreadId(result.threadId)
      setQa(result.qa)
      setError(null)
    } else {
      setThreadId(null)
      setQa(null)
    }
  }

  if (loading) {
    return <p className="text-xs text-muted-foreground py-2">Загрузка вопросов...</p>
  }

  if (error) {
    return <p className="text-sm text-destructive py-2">{error}</p>
  }

  if (!threadId || !qa) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Вопросы путешественника
      </p>

      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
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
      </div>

      {qa.at_limit ? (
        <p className="text-xs text-muted-foreground">Лимит сообщений достигнут (8)</p>
      ) : (
        <GuideQaReplyForm
          threadId={threadId}
          offerId={offerId}
          onReply={handleReply}
        />
      )}
    </div>
  )
}
