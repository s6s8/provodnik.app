import { describe, expect, test } from "vitest";
import { formatDuration, getFormatLabel } from "../format";

describe("getFormatLabel", () => {
  test("maps known formats to Russian labels", () => {
    expect(getFormatLabel("private")).toBe("Частный");
    expect(getFormatLabel("group")).toBe("Групповой");
    expect(getFormatLabel("combo")).toBe("Смешанный");
  });

  test("returns null for null or unknown formats", () => {
    expect(getFormatLabel(null)).toBeNull();
    expect(getFormatLabel("unknown")).toBeNull();
  });
});

describe("formatDuration", () => {
  test("renders sub-day durations in rounded hours", () => {
    expect(formatDuration(60)).toBe("1 ч.");
    expect(formatDuration(90)).toBe("2 ч.");
    expect(formatDuration(479)).toBe("8 ч.");
  });

  test("renders day-scale durations in ceil'd days", () => {
    expect(formatDuration(480)).toBe("1 дн.");
    expect(formatDuration(960)).toBe("2 дн.");
    expect(formatDuration(1000)).toBe("3 дн.");
  });
});
