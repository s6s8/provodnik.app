"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { QaThread } from "@/lib/supabase/qa-threads";

interface Props {
  offerId: string;
  initialThread: QaThread | null;
  onSend: (threadId: string, body: string) => Promise<void>;
  onGetOrCreate: (offerId: string) => Promise<string>;
}

export function OfferQaSheet({
  offerId,
  initialThread,
  onSend,
  onGetOrCreate,
}: Props) {
  const [thread, setThread] = useState<QaThread | null>(initialThread);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSend() {
    if (!body.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        let threadId = thread?.thread_id;
        if (!threadId) {
          threadId = await onGetOrCreate(offerId);
        }
        await onSend(threadId, body.trim());
        setBody("");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Ошибка отправки";
        if (msg === "qa_thread_at_limit") {
          setError(
            "Достигнут лимит сообщений (8). Для продолжения диалога примите предложение.",
          );
        } else {
          setError(msg);
        }
      }
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Задать вопрос
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="flex h-[70vh] flex-col">
        <SheetHeader>
          <SheetTitle>Вопрос гиду</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto py-4">
          {thread?.at_limit ? (
            <p className="text-center text-xs text-muted-foreground">
              Достигнут лимит (8 сообщений). Примите предложение, чтобы
              продолжить.
            </p>
          ) : null}
          {(thread?.messages ?? []).map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.sender_role === "traveler"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.body}
            </div>
          ))}
          {(thread?.messages ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Задайте вопрос гиду
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="px-1 text-xs text-destructive">{error}</p>
        ) : null}

        {!thread?.at_limit ? (
          <div className="flex gap-2 border-t pt-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ваш вопрос..."
              className="min-h-[60px] flex-1 resize-none text-sm"
              disabled={isPending}
            />
            <Button
              onClick={handleSend}
              disabled={isPending || !body.trim()}
              size="sm"
            >
              {isPending ? "..." : "Отправить"}
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
