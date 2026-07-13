"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { COPY } from "@/lib/copy";
import { formatRussianDateTime } from "@/lib/dates";
import type { GroupMessage } from "@/lib/supabase/request-thread";
import type { MessageSenderRole } from "@/lib/supabase/types";

function senderLabel(
  senderId: string | null,
  senderRole: MessageSenderRole,
  currentUserId: string,
): string {
  if (senderId && senderId === currentUserId) return "Вы";
  switch (senderRole) {
    case "guide":
      return COPY.guide;
    case "admin":
      return "Администратор";
    default:
      return "Участник";
  }
}

/**
 * #42 — Open-group shared discussion. One thread per request; the owner and
 * joined members coordinate here in the open. Private per-offer QA stays private.
 */
export function RequestGroupThread({
  messages,
  currentUserId,
  onSend,
}: {
  messages: GroupMessage[];
  currentUserId: string;
  onSend: (body: string) => Promise<{ error: string | null }>;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await onSend(trimmed);
      if (result.error) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 pt-[54px]">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        Обсуждение группы
      </div>
      <div className="rounded-card border border-border bg-surface-lowest p-6">
        {messages.length === 0 ? (
          <p className="text-sm text-on-surface-muted">
            Пока нет сообщений. Напишите первым — обсудите детали поездки с группой.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((message) => {
              const mine = message.senderId === currentUserId;
              return (
                <li key={message.id} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className={
                        mine
                          ? "text-sm font-semibold text-primary"
                          : "text-sm font-semibold text-on-surface"
                      }
                    >
                      {senderLabel(message.senderId, message.senderRole, currentUserId)}
                    </span>
                    <span className="text-xs text-on-surface-muted">
                      {formatRussianDateTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-[1.6] text-on-surface">
                    {message.body}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={5000}
            rows={3}
            placeholder="Написать группе…"
            aria-label="Сообщение группе"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || body.trim().length === 0}>
              {pending ? "Отправка…" : "Отправить"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
