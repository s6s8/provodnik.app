import { describe, it, expect } from "vitest";

import {
  buildBlockInterval,
  buildBlockIntervals,
  intervalsOverlap,
  isIntervalBlocked,
  createBlockInputSchema,
} from "./blocks";

describe("buildBlockInterval", () => {
  it("whole-day block spans one Moscow calendar day in UTC", () => {
    const interval = buildBlockInterval({ kind: "day", date: "2026-07-10" });
    // Moscow is UTC+3 (no DST): 00:00 MSK == 21:00 UTC the day before.
    expect(interval.startAt).toBe("2026-07-09T21:00:00.000Z");
    expect(interval.endAt).toBe("2026-07-10T21:00:00.000Z");
    expect(interval.allDay).toBe(true);
  });

  it("date-range block covers from the first day's start to the day AFTER the last", () => {
    const interval = buildBlockInterval({
      kind: "range",
      startDate: "2026-07-10",
      endDate: "2026-07-12",
    });
    expect(interval.startAt).toBe("2026-07-09T21:00:00.000Z");
    // inclusive end date 2026-07-12 → block ends at start of 2026-07-13 MSK.
    expect(interval.endAt).toBe("2026-07-12T21:00:00.000Z");
    expect(interval.allDay).toBe(true);
  });

  it("time-window block uses the Moscow wall-clock times", () => {
    const interval = buildBlockInterval({
      kind: "window",
      startDate: "2026-07-10",
      endDate: "2026-07-10",
      startTime: "14:00",
      endTime: "18:00",
    });
    expect(interval.startAt).toBe("2026-07-10T11:00:00.000Z");
    expect(interval.endAt).toBe("2026-07-10T15:00:00.000Z");
    expect(interval.allDay).toBe(false);
  });

  it("time-window date range creates one daily window per Moscow date", () => {
    const intervals = buildBlockIntervals({
      kind: "window",
      startDate: "2026-07-01",
      endDate: "2026-07-03",
      startTime: "15:00",
      endTime: "20:00",
    });
    expect(intervals).toEqual([
      { startAt: "2026-07-01T12:00:00.000Z", endAt: "2026-07-01T17:00:00.000Z", allDay: false },
      { startAt: "2026-07-02T12:00:00.000Z", endAt: "2026-07-02T17:00:00.000Z", allDay: false },
      { startAt: "2026-07-03T12:00:00.000Z", endAt: "2026-07-03T17:00:00.000Z", allDay: false },
    ]);
  });
});

describe("intervalsOverlap (half-open [start, end))", () => {
  const a = ["2026-07-10T10:00:00.000Z", "2026-07-10T14:00:00.000Z"] as const;

  it("returns true for partial overlap", () => {
    expect(intervalsOverlap(a[0], a[1], "2026-07-10T13:00:00.000Z", "2026-07-10T16:00:00.000Z")).toBe(true);
  });

  it("returns true when one interval fully contains the other", () => {
    expect(intervalsOverlap(a[0], a[1], "2026-07-10T11:00:00.000Z", "2026-07-10T12:00:00.000Z")).toBe(true);
  });

  it("returns false for touching edges (end == start)", () => {
    expect(intervalsOverlap(a[0], a[1], "2026-07-10T14:00:00.000Z", "2026-07-10T16:00:00.000Z")).toBe(false);
  });

  it("returns false for disjoint intervals", () => {
    expect(intervalsOverlap(a[0], a[1], "2026-07-11T10:00:00.000Z", "2026-07-11T12:00:00.000Z")).toBe(false);
  });
});

describe("isIntervalBlocked (union of blocks)", () => {
  const day = buildBlockInterval({ kind: "day", date: "2026-07-10" });
  const window = buildBlockInterval({
    kind: "window",
    startDate: "2026-07-12",
    endDate: "2026-07-12",
    startTime: "09:00",
    endTime: "12:00",
  });
  const blocks = [
    { start_at: day.startAt, end_at: day.endAt },
    { start_at: window.startAt, end_at: window.endAt },
  ];

  it("all-day block covers any time window that day", () => {
    expect(isIntervalBlocked(blocks, "2026-07-10T15:00:00.000Z", "2026-07-10T16:00:00.000Z")).toBe(true);
  });

  it("returns true when a request overlaps any single block (union semantics)", () => {
    // window is 09:00-12:00 MSK == 06:00Z-09:00Z; request 07:00Z-08:00Z lands inside it.
    expect(isIntervalBlocked(blocks, "2026-07-12T07:00:00.000Z", "2026-07-12T08:00:00.000Z")).toBe(true);
  });

  it("returns false when the request misses every block", () => {
    expect(isIntervalBlocked(blocks, "2026-07-11T09:00:00.000Z", "2026-07-11T10:00:00.000Z")).toBe(false);
  });
});

describe("createBlockInputSchema", () => {
  it("accepts a valid whole-day block", () => {
    expect(createBlockInputSchema.safeParse({ kind: "day", date: "2026-07-10" }).success).toBe(true);
  });

  it("rejects a window whose end is not after its start", () => {
    const res = createBlockInputSchema.safeParse({
      kind: "window",
      startDate: "2026-07-10",
      endDate: "2026-07-10",
      startTime: "18:00",
      endTime: "14:00",
    });
    expect(res.success).toBe(false);
  });

  it("rejects a window range whose end date is before its start date", () => {
    const res = createBlockInputSchema.safeParse({
      kind: "window",
      startDate: "2026-07-20",
      endDate: "2026-07-01",
      startTime: "15:00",
      endTime: "20:00",
    });
    expect(res.success).toBe(false);
  });

  it("rejects a range whose end date is before its start date", () => {
    const res = createBlockInputSchema.safeParse({
      kind: "range",
      startDate: "2026-07-12",
      endDate: "2026-07-10",
    });
    expect(res.success).toBe(false);
  });
});
