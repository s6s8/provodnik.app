"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="grid gap-2 p-3 border-t border-border">
      <Textarea
        id="chat-message-body"
        aria-label="Сообщение"
        className="min-h-[2.75rem] resize-none"
        placeholder="Напишите сообщение…"
        rows={1}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {error ? (
          <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>
        ) : (
          <span className="text-xs text-muted-foreground">Enter отправляет, Shift+Enter переносит строку.</span>
        )}
        <Button type="button" loading={isPending} onClick={handleSubmit}>
          Отправить
        </Button>
      </div>
    </div>
  );
}
