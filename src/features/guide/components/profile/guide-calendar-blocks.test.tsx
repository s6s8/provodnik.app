import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { createAvailabilityBlockAction, deleteAvailabilityBlockAction } = vi.hoisted(() => ({
  createAvailabilityBlockAction: vi.fn(async () => ({ ok: true })),
  deleteAvailabilityBlockAction: vi.fn(async () => ({ ok: true })),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/features/guide/actions/availabilityBlocks", () => ({
  createAvailabilityBlockAction,
  deleteAvailabilityBlockAction,
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

  it("submits a daily time window with start and end dates", async () => {
    createAvailabilityBlockAction.mockClear();
    render(<GuideCalendarBlocks blocks={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /Закрыть часы/i }));
    fireEvent.change(screen.getByLabelText("С"), { target: { value: "2026-07-01" } });
    fireEvent.change(screen.getByLabelText("По"), { target: { value: "2026-07-20" } });
    fireEvent.change(screen.getByLabelText("Время с"), { target: { value: "15:00" } });
    fireEvent.change(screen.getByLabelText("Время по"), { target: { value: "20:00" } });

    fireEvent.click(screen.getByRole("button", { name: "Закрыть период" }));

    await waitFor(() => {
      expect(createAvailabilityBlockAction).toHaveBeenCalledWith({
        kind: "window",
        startDate: "2026-07-01",
        endDate: "2026-07-20",
        startTime: "15:00",
        endTime: "20:00",
        reason: undefined,
      });
    });
  });
});
