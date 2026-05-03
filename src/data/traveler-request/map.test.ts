import { describe, expect, test } from "vitest";

import { mapTravelerRequestRow } from "./map";
import type { TravelerRequestRow } from "@/lib/supabase/types";

const baseRow: TravelerRequestRow = {
  id: "30000000-0000-4000-8000-000000000000",
  traveler_id: "00000000-0000-0000-0000-000000000001",
  destination: "Москва, Россия",
  region: "Россия",
  interests: [],
  starts_on: "2026-07-20",
  ends_on: null,
  start_time: null,
  end_time: null,
  budget_minor: 480_000,
  currency: "RUB",
  participants_count: 2,
  format_preference: "private",
  notes: null,
  open_to_join: false,
  allow_guide_suggestions: true,
  group_capacity: null,
  status: "open",
  created_at: "2026-04-22T22:45:00.000Z",
  updated_at: "2026-04-22T22:45:00.000Z",
  date_flexibility: "exact",
} as TravelerRequestRow;

describe("mapTravelerRequestRow — budget conversion", () => {
  test("budget_minor=480000 (kopecks) maps to budgetPerPersonRub=4800 (rubles)", () => {
    const result = mapTravelerRequestRow(baseRow);
    expect(result.request.budgetPerPersonRub).toBe(4_800);
  });

  test("budget_minor=null defaults to 0 RUB", () => {
    const result = mapTravelerRequestRow({ ...baseRow, budget_minor: null } as TravelerRequestRow);
    expect(result.request.budgetPerPersonRub).toBe(0);
  });

  test("budget_minor=100 (1 RUB) maps to 1, not 100", () => {
    const result = mapTravelerRequestRow({ ...baseRow, budget_minor: 100 });
    expect(result.request.budgetPerPersonRub).toBe(1);
  });

  test("status open maps to submitted", () => {
    const result = mapTravelerRequestRow(baseRow);
    expect(result.status).toBe("submitted");
  });

  test("private format produces groupSize, no groupMax", () => {
    const result = mapTravelerRequestRow(baseRow);
    expect(result.request).toMatchObject({
      mode: "private",
      groupSize: 2,
    });
    expect(result.request).not.toHaveProperty("groupMax");
  });

  test("assembly format produces groupSizeCurrent + groupMax", () => {
    const result = mapTravelerRequestRow({
      ...baseRow,
      format_preference: "group",
      group_capacity: 5,
    });
    expect(result.request).toMatchObject({
      mode: "assembly",
      groupSizeCurrent: 2,
      groupMax: 5,
    });
  });
});
