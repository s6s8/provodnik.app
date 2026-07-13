"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RoleKey = "traveler" | "guide";

const TRAVELER_EVENTS = [
  { key: "new_offer", label: "Новый запрос / предложение" },
  { key: "new_message", label: "Новое сообщение" },
  { key: "meeting_reminder", label: "Напоминание о встрече (за 24 часа)" },
  { key: "booking_status", label: "Изменение статуса поездки" },
  { key: "new_review", label: "Новый отзыв" },
  { key: "promotions", label: "Акции и новости" },
] as const;

const GUIDE_EVENTS = [
  { key: "new_request", label: "Новый запрос / предложение" },
  { key: "new_message", label: "Новое сообщение" },
  { key: "meeting_reminder", label: "Напоминание о встрече (за 24 часа)" },
  { key: "booking_status", label: "Изменение статуса поездки" },
  { key: "new_review", label: "Новый отзыв" },
  { key: "promotions", label: "Акции и новости" },
] as const;

const ROLE_EVENTS: Record<RoleKey, typeof TRAVELER_EVENTS | typeof GUIDE_EVENTS> = {
  traveler: TRAVELER_EVENTS,
  guide: GUIDE_EVENTS,
};

export type NotificationPrefsMatrixProps = {
  prefs: Record<string, unknown>;
  hasTelegram?: boolean;
  onChange: (prefs: Record<string, unknown>) => void;
};

export function NotificationPrefsMatrix({
  prefs,
  hasTelegram = false,
  onChange,
}: NotificationPrefsMatrixProps) {
  const [role, setRole] = React.useState<RoleKey>("traveler");
  const events = ROLE_EVENTS[role];

  return (
    <Tabs
      value={role}
      onValueChange={(next) => setRole(next as RoleKey)}
      className="space-y-4"
    >
      {/* Role tabs */}
      <TabsList>
        <TabsTrigger value="traveler">Путешественник</TabsTrigger>
        <TabsTrigger value="guide">Гид</TabsTrigger>
      </TabsList>

      {/* Matrix table — same shape for both roles, driven by `events` */}
      <TabsContent
        value={role}
        className="relative mt-0 max-w-full overflow-x-auto rounded-card border border-border"
      >
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th
                scope="col"
                className="sticky left-0 z-20 min-w-[14rem] border-r border-border bg-muted/95 px-3 py-2.5 text-left font-medium text-foreground backdrop-blur-sm"
              >
                Событие
              </th>
              <th scope="col" className="px-3 py-2.5 text-center font-medium text-foreground">
                Telegram
              </th>
              <th scope="col" className="px-3 py-2.5 text-center font-medium text-foreground">
                Email
              </th>
              <th scope="col" className="px-3 py-2.5 text-center font-medium text-muted-foreground">
                Push
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const telegramKey = `${role}.${event.key}.telegram`;
              const emailKey = `${role}.${event.key}.email`;
              const isPromo = event.key === "promotions";
              const telegramVal = prefs[telegramKey] ?? !isPromo;
              const emailVal = prefs[emailKey] ?? !isPromo;

              return (
                <tr
                  key={event.key}
                  className="border-b border-border last:border-b-0 odd:bg-surface-high/50"
                >
                  <th
                    scope="row"
                    className="sticky left-0 z-10 min-w-[14rem] border-r border-border bg-surface-high px-3 py-2.5 text-left font-normal text-foreground backdrop-blur-sm"
                  >
                    {event.label}
                  </th>

                  {/* Telegram */}
                  <td className="px-3 py-2 text-center">
                    {hasTelegram ? (
                      <div className="flex justify-center">
                        <Switch
                          checked={Boolean(telegramVal)}
                          onCheckedChange={(next) => onChange({ ...prefs, [telegramKey]: next })}
                          aria-label={`${event.label} — Telegram`}
                        />
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href="https://t.me/provodnik_bot?start=link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Подключить
                        </a>
                      </Button>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-3 py-2 text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={Boolean(emailVal)}
                        onCheckedChange={(next) => onChange({ ...prefs, [emailKey]: next })}
                        aria-label={`${event.label} — Email`}
                      />
                    </div>
                  </td>

                  {/* Push — always disabled */}
                  <td className="px-3 py-2 text-center">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-ink-2">
                      Скоро
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TabsContent>
    </Tabs>
  );
}
