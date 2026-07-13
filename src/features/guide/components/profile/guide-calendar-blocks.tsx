"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  createAvailabilityBlockAction,
  deleteAvailabilityBlockAction,
} from "@/features/guide/actions/availabilityBlocks";
import { formatRussianDate, formatRussianTime, todayMoscowISODate } from "@/lib/dates";

export type CalendarBlock = {
  id: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  reason: string | null;
};

const KINDS = [
  { id: "day", label: "Закрыть день" },
  { id: "range", label: "Закрыть даты" },
  { id: "window", label: "Закрыть часы" },
] as const;
type Kind = (typeof KINDS)[number]["id"];

const DAY_MS = 24 * 60 * 60 * 1000;

// Selected option = primary fill; overrides the muted default of the toggle variant.
const TOGGLE_ACTIVE_CLASS =
  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

function describeBlock(b: CalendarBlock): string {
  if (b.all_day) {
    // end_at is the exclusive start of the day after the last closed day.
    const lastDay = new Date(new Date(b.end_at).getTime() - DAY_MS).toISOString();
    const start = formatRussianDate(b.start_at);
    const end = formatRussianDate(lastDay);
    return start === end ? start : `${start} – ${end}`;
  }
  return `${formatRussianDate(b.start_at)}, ${formatRussianTime(b.start_at)} – ${formatRussianTime(b.end_at)}`;
}

export function GuideCalendarBlocks({ blocks }: { blocks: CalendarBlock[] }) {
  const router = useRouter();
  const today = todayMoscowISODate();

  const [kind, setKind] = React.useState<Kind>("day");
  const [date, setDate] = React.useState(today);
  const [endDate, setEndDate] = React.useState(today);
  const [startTime, setStartTime] = React.useState("10:00");
  const [endTime, setEndTime] = React.useState("14:00");
  const [reason, setReason] = React.useState("");
  const [message, setMessage] = React.useState<{ tone: "error" | "warning"; text: string } | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleStartDateChange(value: string) {
    setDate(value);
    if (endDate < value) setEndDate(value);
  }

  function submit() {
    setMessage(null);
    const reasonValue = reason.trim() ? reason.trim() : undefined;
    const payload =
      kind === "day"
        ? { kind, date, reason: reasonValue }
        : kind === "range"
          ? { kind, startDate: date, endDate, reason: reasonValue }
          : { kind, startDate: date, endDate, startTime, endTime, reason: reasonValue };

    startTransition(async () => {
      const res = await createAvailabilityBlockAction(payload);
      if (!res.ok) {
        setMessage({ tone: "error", text: res.error });
        return;
      }
      if (res.warning) setMessage({ tone: "warning", text: res.warning });
      setReason("");
      router.refresh();
    });
  }

  function remove(id: string) {
    setMessage(null);
    startTransition(async () => {
      const res = await deleteAvailabilityBlockAction(id);
      if (!res.ok) setMessage({ tone: "error", text: res.error });
      else router.refresh();
    });
  }

  return (
    <GlassCard className="space-y-5 p-5">
      <div className="space-y-1">
        <p className="text-sm font-medium text-primary">Закрытые периоды</p>
        <p className="text-sm text-muted-foreground">
          Отметьте даты и часы, когда вы недоступны. В эти периоды туристы не смогут забронировать
          вас. Уже принятые договорённости закрытие не отменяет.
        </p>
      </div>

      <ToggleGroup
        type="single"
        variant="outline"
        value={kind}
        // Radix single-toggle deselects on re-click; the kind is required, so ignore "".
        onValueChange={(next) => {
          if (next) setKind(next as Kind);
        }}
        className="w-full flex-wrap"
      >
        {KINDS.map((k) => (
          <ToggleGroupItem key={k.id} value={k.id} className={TOGGLE_ACTIVE_CLASS}>
            {k.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="block-date">{kind === "day" ? "Дата" : "С"}</Label>
          <div className="relative">
            <CalendarDays
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="block-date"
              type="date"
              min={today}
              value={date}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="native-picker-hidden pl-11"
            />
          </div>
        </div>

        {kind === "range" || kind === "window" ? (
          <div className="space-y-1.5">
            <Label htmlFor="block-end-date">По</Label>
            <div className="relative">
              <CalendarDays
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="block-end-date"
                type="date"
                min={date}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="native-picker-hidden pl-11"
              />
            </div>
          </div>
        ) : null}

        {kind === "window" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="block-start-time">Время с</Label>
              <Input
                id="block-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-end-time">Время по</Label>
              <Input
                id="block-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </>
        ) : null}

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="block-reason">Причина (только для вас)</Label>
          <Input
            id="block-reason"
            type="text"
            maxLength={200}
            placeholder="Например: отпуск, основная работа"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>

      {message ? (
        <Alert variant={message.tone === "error" ? "destructive" : "warning"} role="alert">
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="button" loading={pending} onClick={submit}>
        Закрыть период
      </Button>

      {blocks.length > 0 ? (
        <ul className="space-y-2 border-t border-border/60 pt-4">
          {blocks.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">
                {describeBlock(b)}
                {b.reason ? <span className="text-muted-foreground"> · {b.reason}</span> : null}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => remove(b.id)}
              >
                Удалить
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-border/60 pt-4 text-sm text-muted-foreground">
          Закрытых периодов пока нет.
        </p>
      )}
    </GlassCard>
  );
}
