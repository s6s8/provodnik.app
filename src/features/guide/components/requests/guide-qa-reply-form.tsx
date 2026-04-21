'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  threadId: string
  offerId: string
  onReply: (threadId: string, offerId: string, body: string) => Promise<void>
}

export function GuideQaReplyForm({ threadId, offerId, onReply }: Props) {
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!body.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        await onReply(threadId, offerId, body.trim())
        setBody('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка отправки')
      }
    })
  }

  return (
    <div className="space-y-2 pt-2 border-t">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Ваш ответ..."
        rows={2}
        className="resize-none text-sm"
        disabled={isPending}
      />
      <Button size="sm" onClick={handleSubmit} disabled={isPending || !body.trim()}>
        {isPending ? 'Отправка...' : 'Ответить'}
      </Button>
    </div>
  )
}
