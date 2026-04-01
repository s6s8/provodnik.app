"use client";

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
    <div className={isOwn ? "message-bubble-row message-bubble-row-own" : "message-bubble-row"}>
      <article className={isOwn ? "message-bubble-shell message-bubble-shell-own" : "message-bubble-shell"}>
        <div className="message-bubble-meta">
          {!isOwn ? (
            <div className="message-bubble-avatar" aria-hidden="true">
              {senderAvatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={senderAvatar}
                  alt=""
                  className="message-bubble-avatar-image"
                />
              ) : (
                <span>{getInitials(senderName)}</span>
              )}
            </div>
          ) : null}
          <div className="message-bubble-authoring">
            <p className="message-bubble-author">{isOwn ? "Вы" : senderName}</p>
            <time className="message-bubble-time" dateTime={timestamp}>
              {formatTime(timestamp)}
            </time>
          </div>
        </div>
        <p className="message-bubble-body">{body}</p>
      </article>
    </div>
  );
}
