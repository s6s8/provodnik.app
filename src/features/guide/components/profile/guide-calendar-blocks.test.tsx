import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/features/guide/actions/availabilityBlocks", () => ({
  createAvailabilityBlockAction: vi.fn(async () => ({ ok: true })),
  deleteAvailabilityBlockAction: vi.fn(async () => ({ ok: true })),
}));

import { GuideCalendarBlocks } from "./guide-calendar-blocks";

describe("GuideCalendarBlocks", () => {
  it("shows the empty state when there are no closed periods", () => {
    render(<GuideCalendarBlocks blocks={[]} />);
    expect(screen.getByText(/Закрытых периодов пока нет/i)).toBeInTheDocument();
  });

  it("renders a single all-day block as one Moscow date", () => {
    render(
      <GuideCalendarBlocks
        blocks={[
          {
            id: "b1",
            // 2026-07-10 00:00 MSK .. 2026-07-11 00:00 MSK (one closed day)
            start_at: "2026-07-09T21:00:00.000Z",
            end_at: "2026-07-10T21:00:00.000Z",
            all_day: true,
            reason: "отпуск",
          },
        ]}
      />,
    );
    expect(screen.getByText(/10 июля/)).toBeInTheDocument();
    expect(screen.getByText(/отпуск/)).toBeInTheDocument();
  });

  it("renders a time-window block with its Moscow time range", () => {
    render(
      <GuideCalendarBlocks
        blocks={[
          {
            id: "b2",
            start_at: "2026-07-10T11:00:00.000Z", // 14:00 MSK
            end_at: "2026-07-10T15:00:00.000Z", // 18:00 MSK
            all_day: false,
            reason: null,
          },
        ]}
      />,
    );
    expect(screen.getByText(/14:00\s*–\s*18:00/)).toBeInTheDocument();
  });
});
