import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ListingScheduleExtraRow } from "@/lib/supabase/types";

const { blockDayAction, blockSlotAction, unblockSlotAction } = vi.hoisted(() => ({
  blockDayAction: vi.fn(),
  blockSlotAction: vi.fn(),
  unblockSlotAction: vi.fn(),
}));

vi.mock("@/app/(protected)/guide/calendar/actions", () => ({
  blockSlotAction,
  unblockSlotAction,
  blockDayAction,
}));

import { DayPanel } from "./day-panel";

describe("DayPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("merges rows returned after blocking a full day without dropping unrelated extras", async () => {
    const existingExtras: ListingScheduleExtraRow[] = [
      {
        id: "old-same-listing",
        listing_id: "listing-1",
        date: "2026-06-03",
        time_start: "09:00:00",
        time_end: "09:30:00",
      },
      {
        id: "other-listing",
        listing_id: "listing-2",
        date: "2026-06-03",
        time_start: "10:00:00",
        time_end: "10:30:00",
      },
    ];
    const returnedRows: ListingScheduleExtraRow[] = [
      {
        id: "new-1",
        listing_id: "listing-1",
        date: "2026-06-03",
        time_start: "00:00:00",
        time_end: "00:30:00",
      },
      {
        id: "new-2",
        listing_id: "listing-1",
        date: "2026-06-03",
        time_start: "00:30:00",
        time_end: "01:00:00",
      },
    ];
    blockDayAction.mockResolvedValue({ ok: true, extras: returnedRows });
    const onExtrasChange = vi.fn();

    render(
      <DayPanel
        date="2026-06-03"
        dateLabel="3 июня"
        listingId="listing-1"
        listingTitle="Обзорная прогулка"
        extras={existingExtras}
        onClose={() => {}}
        onExtrasChange={onExtrasChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Закрыть день" }));

    await waitFor(() => {
      expect(onExtrasChange).toHaveBeenCalledWith("2026-06-03", [
        existingExtras[1],
        ...returnedRows,
      ]);
    });
  });

  it("removes existing rows for the selected listing date when blocking a full day returns no rows", async () => {
    const existingExtras: ListingScheduleExtraRow[] = [
      {
        id: "old-same-listing",
        listing_id: "listing-1",
        date: "2026-06-03",
        time_start: "09:00:00",
        time_end: "09:30:00",
      },
      {
        id: "other-listing",
        listing_id: "listing-2",
        date: "2026-06-03",
        time_start: "10:00:00",
        time_end: "10:30:00",
      },
    ];
    blockDayAction.mockResolvedValue({ ok: true, extras: [] });
    const onExtrasChange = vi.fn();

    render(
      <DayPanel
        date="2026-06-03"
        dateLabel="3 июня"
        listingId="listing-1"
        listingTitle="Обзорная прогулка"
        extras={existingExtras}
        onClose={() => {}}
        onExtrasChange={onExtrasChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Закрыть день" }));

    await waitFor(() => {
      expect(onExtrasChange).toHaveBeenCalledWith("2026-06-03", [
        existingExtras[1],
      ]);
    });
  });
});
