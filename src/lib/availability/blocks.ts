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
    date: dateField,
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
      return {
        startAt: new Date(`${input.date}T${input.startTime}:00${MSK_UTC_OFFSET}`).toISOString(),
        endAt: new Date(`${input.date}T${input.endTime}:00${MSK_UTC_OFFSET}`).toISOString(),
        allDay: false,
      };
    }
  }
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
