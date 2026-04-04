"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(senderName: string) {
  return senderName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "П";
}

interface MessageBubbleProps {
  body: string;
  senderName: string;
  senderAvatar?: string | null;
  timestamp: string;
  isOwn: boolean;
}

export function MessageBubble({
  body,
  senderName,
  senderAvatar,
  timestamp,
  isOwn,
}: MessageBubbleProps) {
  return (
    <div className={isOwn ? "flex justify-end" : "flex justify-start"}>
      <article
        className={
          isOwn
            ? "grid gap-2.5 max-w-[min(100%,38rem)] max-md:max-w-full px-4 py-3.5 rounded-[1.5rem] bg-[color-mix(in_srgb,var(--primary)_12%,var(--surface-high))] border border-[color-mix(in_srgb,var(--primary)_18%,transparent)] shadow-glass"
            : "grid gap-2.5 max-w-[min(100%,38rem)] max-md:max-w-full px-4 py-3.5 rounded-[1.5rem] bg-glass border border-glass-border shadow-glass"
        }
      >
        <div className="flex items-center gap-3">
          {!isOwn ? (
            <Avatar className="size-8" aria-hidden="true">
              {senderAvatar ? <AvatarImage src={senderAvatar} alt="" /> : null}
              <AvatarFallback className="bg-surface-low text-xs font-bold text-primary">
                {getInitials(senderName)}
              </AvatarFallback>
            </Avatar>
          ) : null}
          <div className="grid gap-0.5">
            <p className="text-[0.8125rem] font-semibold text-foreground">{isOwn ? "Вы" : senderName}</p>
            <time className="text-xs text-muted-foreground" dateTime={timestamp}>
              {formatTime(timestamp)}
            </time>
          </div>
        </div>
        <p className="whitespace-pre-wrap break-words text-[0.9375rem] leading-[1.65] text-foreground">
          {body}
        </p>
      </article>
    </div>
  );
}
