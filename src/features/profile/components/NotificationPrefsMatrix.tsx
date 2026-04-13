"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

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
    <div className="space-y-4">
      {/* Role tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        {(["traveler", "guide"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              role === r
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {r === "traveler" ? "Путешественник" : "Гид"}
          </button>
        ))}
      </div>

      {/* Matrix table */}
      <div className="relative max-w-full overflow-x-auto rounded-card border border-border">
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
                        <SwitchPrimitive.Root
                          checked={Boolean(telegramVal)}
                          onCheckedChange={(next) => onChange({ ...prefs, [telegramKey]: next })}
                          className={cn(
                            "peer inline-flex h-[1.15rem] w-8 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
                          )}
                          aria-label={`${event.label} — Telegram`}
                        >
                          <SwitchPrimitive.Thumb
                            className={cn(
                              "pointer-events-none block size-4 rounded-full bg-background ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
                            )}
                          />
                        </SwitchPrimitive.Root>
                      </div>
                    ) : (
                      <a
                        href="https://t.me/provodnik_bot?start=link"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline"
                      >
                        Подключить
                      </a>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-3 py-2 text-center">
                    <div className="flex justify-center">
                      <SwitchPrimitive.Root
                        checked={Boolean(emailVal)}
                        onCheckedChange={(next) => onChange({ ...prefs, [emailKey]: next })}
                        className={cn(
                          "peer inline-flex h-[1.15rem] w-8 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
                        )}
                        aria-label={`${event.label} — Email`}
                      >
                        <SwitchPrimitive.Thumb
                          className={cn(
                            "pointer-events-none block size-4 rounded-full bg-background ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
                          )}
                        />
                      </SwitchPrimitive.Root>
                    </div>
                  </td>

                  {/* Push — always disabled */}
                  <td className="px-3 py-2 text-center">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] text-muted-foreground">
                      Скоро
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
