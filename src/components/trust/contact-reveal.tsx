"use client";

import { Copy, Lock, Phone, Send, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ContactRevealProps = {
  guide: { name: string; avatarUrl?: string; verified?: boolean };
  contact?: { phone?: string; telegram?: string };
  bookingStatus: "pending" | "confirmed" | "completed";
  className?: string;
};

/** Guide identity always shown; contact details gated by booking status. */
export function ContactReveal({ guide, contact, bookingStatus, className }: ContactRevealProps) {
  const revealed = bookingStatus === "confirmed" || bookingStatus === "completed";
  const hasContact = Boolean(contact?.phone || contact?.telegram);

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="flex items-center gap-3">
        <AvatarStack users={[{ name: guide.name, avatarUrl: guide.avatarUrl }]} size="compact" />
        <span className="font-semibold text-on-surface">{guide.name}</span>
        {guide.verified ? <Badge variant="success">Проверен</Badge> : null}
      </div>

      {!revealed ? (
        <Alert variant="info">
          <Lock />
          <AlertDescription>
            Контакты открываются после подтверждения бронирования
          </AlertDescription>
        </Alert>
      ) : null}

      {revealed && hasContact ? (
        <div className="grid gap-2">
          {contact?.phone ? (
            <div className="flex items-center gap-2">
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-2 font-medium text-on-surface"
              >
                <Phone className="size-4" />
                {contact.phone}
              </a>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Скопировать"
                onClick={() => navigator.clipboard.writeText(contact.phone!)}
              >
                <Copy />
              </Button>
            </div>
          ) : null}
          {contact?.telegram ? (
            <a
              href={contact.telegram}
              className="inline-flex items-center gap-2 font-medium text-on-surface"
            >
              <Send className="size-4" />
              Telegram
            </a>
          ) : null}
        </div>
      ) : null}

      {revealed && !hasContact ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>Не удалось загрузить контакты</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
