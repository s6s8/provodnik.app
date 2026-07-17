import { describe, expect, it } from "vitest";

import { localDate } from "./TourDeparturesList";

// Owner 609 finding 7: departure start_date/end_date are date-only. Parsing them
// with `new Date("2026-07-20")` yields UTC midnight, which renders as the 19th in a
// negative-offset browser. localDate anchors to LOCAL midnight, so the calendar day
// is the same in every timezone the process could run in.
describe("localDate (date-only, TZ-stable)", () => {
  it("keeps the calendar day regardless of the runtime timezone", () => {
    const d = localDate("2026-07-20");
    // Local components: whatever TZ the process is in, local midnight of the 20th
    // is the 20th of July 2026 — never the 19th.
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6); // July (0-indexed)
    expect(d.getDate()).toBe(20);
  });

  it("computes an inclusive day span without drift", () => {
    const a = localDate("2026-07-20").getTime();
    const b = localDate("2026-07-22").getTime();
    expect(Math.round((b - a) / 86_400_000)).toBe(2);
  });
});
