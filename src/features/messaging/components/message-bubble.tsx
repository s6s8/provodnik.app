"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { GuideOfferRow, MessageRow } from "@/lib/supabase/types";

import { OfferCard } from "./OfferCard";
import {
  SystemEventMessage,
  type SystemEventPayload,
} from "./SystemEventMessage";

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(senderName: string) {
  return (
    senderName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "П"
  );
}

function parseOfferSentPayload(
  payload: Record<string, unknown>,
): {
  offer_id: string;
  price_minor: number;
  currency: string;
  description: string | null;
  status: GuideOfferRow["status"];
  valid_until: string | null;
} | null {
  if (typeof payload.offer_id !== "string") return null;
  const priceMinor = payload.price_minor;
  if (typeof priceMinor !== "number" || !Number.isFinite(priceMinor)) return null;
  if (typeof payload.currency !== "string") return null;
  const description =
    payload.description === null || typeof payload.description === "string"
      ? (payload.description as string | null)
      : null;
  if (typeof payload.status !== "string") return null;
  const validUntil =
    payload.valid_until === null || typeof payload.valid_until === "string"
      ? (payload.valid_until as string | null)
      : null;
  return {
    offer_id: payload.offer_id,
    price_minor: priceMinor,
    currency: payload.currency,
    description,
    status: payload.status as GuideOfferRow["status"],
    valid_until: validUntil,
  };
}

function tryGetOfferSentMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  if (m.system_event_type !== "offer_sent") return null;
  const rawPayload = m.system_event_payload;
  if (!rawPayload || typeof rawPayload !== "object") return null;
  return parseOfferSentPayload(rawPayload as Record<string, unknown>);
}

// Legacy props interface kept for backward compatibility with chat-window's
// existing MessageWithSender shape where sender_profile is available.
interface LegacyMessageBubbleProps {
  body: string;
  senderName: string;
  senderAvatar?: string | null;
  timestamp: string;
  isOwn: boolean;
  metadata?: unknown;
  senderId?: string | null;
  currentUserId?: string;
}

// New interface that accepts the full MessageRow and currentUserId.
interface MessageRowProps {
  message: MessageRow;
  currentUserId: string;
  senderName?: string;
  senderAvatar?: string | null;
}

type MessageBubbleProps = LegacyMessageBubbleProps | MessageRowProps;

function isMessageRowProps(props: MessageBubbleProps): props is MessageRowProps {
  return "message" in props;
}

export function MessageBubble(props: MessageBubbleProps) {
  // New usage: MessageRow + currentUserId
  if (isMessageRowProps(props)) {
    const { message, currentUserId, senderName = "Участник", senderAvatar } = props;

    if (message.sender_role === "system") {
      const payload = message.metadata as SystemEventPayload;
      return (
        <SystemEventMessage
          eventType={payload.event_type}
          payload={payload}
          createdAt={message.created_at}
        />
      );
    }

    const offerPayload = tryGetOfferSentMetadata(message.metadata);
    if (offerPayload) {
      const isOwn = message.sender_id === currentUserId;
      const viewerRole: "traveler" | "guide" =
        message.sender_id === currentUserId ? "guide" : "traveler";
      return (
        <div className={isOwn ? "flex justify-end" : "flex justify-start"}>
          <OfferCard
            offerId={offerPayload.offer_id}
            priceMinor={offerPayload.price_minor}
            currency={offerPayload.currency}
            description={offerPayload.description}
            status={offerPayload.status}
            validUntil={offerPayload.valid_until}
            viewerRole={viewerRole}
          />
        </div>
      );
    }

    const isOwn = message.sender_id === currentUserId;
    return (
      <UserBubble
        body={message.body}
        senderName={senderName}
        senderAvatar={senderAvatar ?? null}
        timestamp={message.created_at}
        isOwn={isOwn}
      />
    );
  }

  // Legacy usage: flat props (used by existing chat-window.tsx)
  const { body, senderName, senderAvatar, timestamp, isOwn, metadata, senderId, currentUserId } = props;

  const offerPayload = tryGetOfferSentMetadata(metadata);
  if (offerPayload && currentUserId) {
    const viewerRole: "traveler" | "guide" =
      senderId != null && senderId === currentUserId ? "guide" : "traveler";
    return (
      <div className={isOwn ? "flex justify-end" : "flex justify-start"}>
        <OfferCard
          offerId={offerPayload.offer_id}
          priceMinor={offerPayload.price_minor}
          currency={offerPayload.currency}
          description={offerPayload.description}
          status={offerPayload.status}
          validUntil={offerPayload.valid_until}
          viewerRole={viewerRole}
        />
      </div>
    );
  }

  return (
    <UserBubble
      body={body}
      senderName={senderName}
      senderAvatar={senderAvatar ?? null}
      timestamp={timestamp}
      isOwn={isOwn}
    />
  );
}

interface UserBubbleProps {
  body: string;
  senderName: string;
  senderAvatar: string | null;
  timestamp: string;
  isOwn: boolean;
}

function UserBubble({
  body,
  senderName,
  senderAvatar,
  timestamp,
  isOwn,
}: UserBubbleProps) {
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
            <p className="text-[0.8125rem] font-semibold text-foreground">
              {isOwn ? "Вы" : senderName}
            </p>
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
