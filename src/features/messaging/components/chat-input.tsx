"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

type SendMessageAction = (
  threadId: string,
  body: string,
) => Promise<{ success: true } | { success: false; error: string }>;

interface ChatInputProps {
  threadId: string;
  sendMessageAction: SendMessageAction;
}

export function ChatInput({ threadId, sendMessageAction }: ChatInputProps) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const trimmed = body.trim();
    if (!trimmed) {
      setError("Введите сообщение.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await sendMessageAction(threadId, trimmed);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["thread-messages", threadId] });
      await queryClient.invalidateQueries({ queryKey: ["message-threads"] });
    });
  };

  return (
    <div className="grid gap-3 p-4 border-t border-glass-border">
      <label className="text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" htmlFor="chat-message-body">
        Новое сообщение
      </label>
      <textarea
        id="chat-message-body"
        className="w-full min-h-[7rem] resize-y p-3.5 px-4 rounded-[1.5rem] border border-glass-border bg-surface-high/[0.82] text-foreground outline-none focus:border-primary"
        placeholder="Напишите сообщение гиду"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
          }
        }}
        rows={3}
      />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {error ? (
          <p className="text-[0.8125rem] font-semibold text-destructive">{error}</p>
        ) : (
          <span className="text-xs text-muted-foreground">Enter отправляет, Shift+Enter переносит строку.</span>
        )}
        <Button type="button" disabled={isPending} onClick={handleSubmit}>
          {isPending ? "Отправляем…" : "Отправить"}
        </Button>
      </div>
    </div>
  );
}
