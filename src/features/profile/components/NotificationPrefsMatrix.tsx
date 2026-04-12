"use client";

import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export const NOTIFICATION_EVENTS = [
  { key: "new_offer", label: "Новое предложение" },
  { key: "booking_created", label: "Новое бронирование" },
  { key: "booking_confirmed", label: "Бронирование подтверждено" },
  { key: "booking_completed", label: "Завершена поездка" },
  { key: "review_requested", label: "Запрос отзыва" },
  { key: "dispute_opened", label: "Открыт спор" },
] as const;

const NOTIFICATION_CHANNELS = [
  { key: "in_app", label: "В приложении" },
  { key: "email", label: "Email" },
  { key: "telegram", label: "Telegram" },
] as const;

export type NotificationPrefsMatrixProps = {
  prefs: Record<string, unknown>;
  onChange: (prefs: Record<string, unknown>) => void;
};

export function NotificationPrefsMatrix({
  prefs,
  onChange,
}: NotificationPrefsMatrixProps) {
  return (
    <div className="relative max-w-full overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th
              scope="col"
              className="sticky left-0 z-20 min-w-[11rem] border-r border-border bg-muted/95 px-3 py-2.5 text-left font-medium text-foreground backdrop-blur-sm"
            >
              Событие
            </th>
            {NOTIFICATION_CHANNELS.map((ch) => (
              <th
                key={ch.key}
                scope="col"
                className="px-3 py-2.5 text-center font-medium text-foreground"
              >
                {ch.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {NOTIFICATION_EVENTS.map((event) => (
            <tr
              key={event.key}
              className="border-b border-border last:border-b-0 odd:bg-surface-high/50"
            >
              <th
                scope="row"
                className="sticky left-0 z-10 min-w-[11rem] border-r border-border bg-surface-high px-3 py-2.5 text-left font-normal text-foreground backdrop-blur-sm"
              >
                {event.label}
              </th>
              {NOTIFICATION_CHANNELS.map((channel) => {
                const key = `${event.key}.${channel.key}`;
                const value = prefs[key] ?? true;
                const checked = Boolean(value);

                return (
                  <td key={channel.key} className="px-3 py-2 text-center">
                    <div className="flex justify-center">
                      <SwitchPrimitive.Root
                        checked={checked}
                        onCheckedChange={(next) => {
                          onChange({ ...prefs, [key]: next });
                        }}
                        className={cn(
                          "peer inline-flex h-[1.15rem] w-8 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
                        )}
                        aria-label={`${event.label} — ${channel.label}`}
                      >
                        <SwitchPrimitive.Thumb
                          className={cn(
                            "pointer-events-none block size-4 rounded-full bg-background ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground",
                          )}
                        />
                      </SwitchPrimitive.Root>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
