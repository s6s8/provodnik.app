import { afterEach, describe, expect, it, vi } from "vitest";

import { formatRussianDateRange, isExpired, normalizeExpiryInput } from "./dates";

describe("formatRussianDateRange", () => {
  it("returns an empty label for invalid ISO dates", () => {
    expect(formatRussianDateRange("not-a-date")).toBe("");
    expect(formatRussianDateRange("2026-02-30")).toBe("");
  });

  it("ignores an invalid end date instead of formatting NaN", () => {
    expect(formatRussianDateRange("2026-05-15", "2026-13-40")).toBe("15 мая");
  });
});

describe("normalizeExpiryInput", () => {
  it("reads a date-only value as the end of that calendar day in Moscow", () => {
    expect(normalizeExpiryInput("2026-07-25")).toBe("2026-07-25T20:59:59.999Z");
  });

  it("passes a full timestamp through, so re-parsing a normalized value is idempotent", () => {
    expect(normalizeExpiryInput("2026-07-25T20:59:59.999Z")).toBe("2026-07-25T20:59:59.999Z");
  });

  it("returns null for an unparseable value", () => {
    expect(normalizeExpiryInput("2026-02-30")).toBeNull();
    expect(normalizeExpiryInput("завтра")).toBeNull();
  });
});

describe("isExpired", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("never expires a missing expiry", () => {
    expect(isExpired(null)).toBe(false);
    expect(isExpired(undefined)).toBe(false);
  });

  it("expires a timestamp that has elapsed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T12:00:00Z"));
    expect(isExpired("2026-07-25T11:59:59.999Z")).toBe(true);
  });

  it("keeps a future timestamp live", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T12:00:00Z"));
    expect(isExpired("2026-07-25T12:00:00.001Z")).toBe(false);
  });

  it("treats the exact boundary as expired, like accept_offer's expires_at <= now()", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T12:00:00Z"));
    expect(isExpired("2026-07-25T12:00:00.000Z")).toBe(true);
  });

  it("keeps an offer picked for today alive until the Moscow day ends", () => {
    vi.useFakeTimers();
    // 23:00 MSK on 25 July — the old UTC-midnight reading called this expired.
    vi.setSystemTime(new Date("2026-07-25T20:00:00Z"));
    expect(isExpired(normalizeExpiryInput("2026-07-25"))).toBe(false);
  });
});
