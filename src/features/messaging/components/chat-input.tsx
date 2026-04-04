"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";

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
    <div className="chat-input-shell">
      <label className="chat-input-label" htmlFor="chat-message-body">
        Новое сообщение
      </label>
      <textarea
        id="chat-message-body"
        className="chat-input-field"
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
      <div className="chat-input-footer">
        {error ? <p className="chat-input-error">{error}</p> : <span className="chat-input-hint">Enter отправляет, Shift+Enter переносит строку.</span>}
        <button
          type="button"
          className="btn-primary"
          disabled={isPending}
          onClick={handleSubmit}
        >
          {isPending ? "Отправляем…" : "Отправить"}
        </button>
      </div>
    </div>
  );
}
