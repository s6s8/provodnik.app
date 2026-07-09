/**
 * Pure availability-block logic — no I/O, no server imports (client-safe).
 *
 * Guide calendar blocks (layer B). Overlap of two `timestamptz` intervals is
 * timezone-independent (absolute instants). Timezone only matters when turning a
 * guide-entered Moscow calendar date/time into a stored UTC instant, so we build
 * explicit MSK-offset instants here — never `toISOString().slice(0, 10)` (AP-010).
 * Moscow is UTC+3 year-round (no DST).
 */

import { z } from "zod";

const MSK_UTC_OFFSET = "+03:00";
const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const MAX_WINDOW_RANGE_DAYS = 366;

const dateField = z.string().regex(DATE_RE, "Укажите дату.");
const timeField = z.string().regex(TIME_RE, "Укажите время.");
const reasonField = z.string().trim().max(200).optional();

export const createBlockInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("day"), date: dateField, reason: reasonField }),
  z.object({
    kind: z.literal("range"),
    startDate: dateField,
    endDate: dateField,
    reason: reasonField,
  }),
  z.object({
    kind: z.literal("window"),
    date: dateField.optional(),
    startDate: dateField.optional(),
    endDate: dateField.optional(),
    startTime: timeField,
    endTime: timeField,
    reason: reasonField,
  }),
]).superRefine((input, ctx) => {
  if (input.kind === "range" && input.endDate < input.startDate) {
    ctx.addIssue({
      code: "custom",
      message: "Дата окончания раньше даты начала.",
      path: ["endDate"],
    });
  }
  if (input.kind === "window" && input.endTime <= input.startTime) {
    ctx.addIssue({
      code: "custom",
      message: "Время окончания должно быть позже начала.",
      path: ["endTime"],
    });
  }
  if (input.kind === "window") {
    const startDate = input.startDate ?? input.date;
    const endDate = input.endDate ?? startDate;
    if (!startDate) {
      ctx.addIssue({
        code: "custom",
        message: "Укажите дату начала.",
        path: ["startDate"],
      });
    }
    if (!endDate) {
      ctx.addIssue({
        code: "custom",
        message: "Укажите дату окончания.",
        path: ["endDate"],
      });
    }
    if (startDate && endDate) {
      if (endDate < startDate) {
        ctx.addIssue({
          code: "custom",
          message: "Дата окончания раньше даты начала.",
          path: ["endDate"],
        });
      } else {
        const spanDays = Math.floor((moscowDayStart(endDate) - moscowDayStart(startDate)) / DAY_MS) + 1;
        if (spanDays > MAX_WINDOW_RANGE_DAYS) {
          ctx.addIssue({
            code: "custom",
            message: "Период для ежедневного окна не должен быть длиннее года.",
            path: ["endDate"],
          });
        }
      }
    }
  }
});

export type CreateBlockInput = z.infer<typeof createBlockInputSchema>;

export interface BlockInterval {
  startAt: string;
  endAt: string;
  allDay: boolean;
}

/** Start-of-day UTC instant for a Moscow calendar date (YYYY-MM-DD). */
function moscowDayStart(date: string): number {
  return new Date(`${date}T00:00:00${MSK_UTC_OFFSET}`).getTime();
}

/** Convert validated block input into a stored UTC interval. */
export function buildBlockInterval(input: CreateBlockInput): BlockInterval {
  switch (input.kind) {
    case "day": {
      const start = moscowDayStart(input.date);
      return {
        startAt: new Date(start).toISOString(),
        endAt: new Date(start + DAY_MS).toISOString(),
        allDay: true,
      };
    }
    case "range": {
      const start = moscowDayStart(input.startDate);
      // Inclusive end date → block ends at the start of the following day.
      const end = moscowDayStart(input.endDate) + DAY_MS;
      return {
        startAt: new Date(start).toISOString(),
        endAt: new Date(end).toISOString(),
        allDay: true,
      };
    }
    case "window": {
      const date = input.startDate ?? input.date;
      if (!date) throw new Error("window_start_date_required");
      return {
        startAt: new Date(`${date}T${input.startTime}:00${MSK_UTC_OFFSET}`).toISOString(),
        endAt: new Date(`${date}T${input.endTime}:00${MSK_UTC_OFFSET}`).toISOString(),
        allDay: false,
      };
    }
  }
}

function formatDateOnlyLocal(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Convert one user input into the stored interval rows it represents. */
export function buildBlockIntervals(input: CreateBlockInput): BlockInterval[] {
  if (input.kind !== "window") return [buildBlockInterval(input)];

  const startDate = input.startDate ?? input.date;
  const endDate = input.endDate ?? startDate;
  if (!startDate || !endDate) throw new Error("window_date_range_required");

  const start = moscowDayStart(startDate);
  const end = moscowDayStart(endDate);
  const spanDays = Math.floor((end - start) / DAY_MS) + 1;
  const intervals: BlockInterval[] = [];
  for (let offset = 0; offset < spanDays; offset += 1) {
    const date = formatDateOnlyLocal(new Date(`${startDate}T00:00:00.000Z`));
    const dateWithOffset = new Date(`${date}T00:00:00.000Z`);
    dateWithOffset.setUTCDate(dateWithOffset.getUTCDate() + offset);
    intervals.push(
      buildBlockInterval({
        kind: "window",
        startDate: formatDateOnlyLocal(dateWithOffset),
        endDate: formatDateOnlyLocal(dateWithOffset),
        startTime: input.startTime,
        endTime: input.endTime,
      }),
    );
  }
  return intervals;
}

/** Half-open overlap test: [aStart, aEnd) ∩ [bStart, bEnd) ≠ ∅. */
export function intervalsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(bStart).getTime() < new Date(aEnd).getTime()
  );
}

/** True if the [startAt, endAt) request overlaps ANY block (union semantics). */
export function isIntervalBlocked(
  blocks: ReadonlyArray<{ start_at: string; end_at: string }>,
  startAt: string,
  endAt: string,
): boolean {
  return blocks.some((b) => intervalsOverlap(b.start_at, b.end_at, startAt, endAt));
}
