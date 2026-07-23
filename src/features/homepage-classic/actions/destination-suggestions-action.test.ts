import { beforeEach, describe, expect, it, vi } from "vitest";

const getDestinationSuggestionsMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/supabase/queries", () => ({
  getDestinationSuggestions: (...args: unknown[]) => getDestinationSuggestionsMock(...args),
}));

import { fetchDestinationSuggestionsAction } from "./destination-suggestions-action";

describe("fetchDestinationSuggestionsAction", () => {
  beforeEach(() => {
    getDestinationSuggestionsMock.mockReset();
  });

  it("returns suggestions from the server query", async () => {
    getDestinationSuggestionsMock.mockResolvedValue({
      data: [{ name: "Элиста", region: "Калмыкия", guideCount: 2 }],
      error: null,
    });

    const result = await fetchDestinationSuggestionsAction();

    expect(result).toEqual({
      ok: true,
      data: [{ name: "Элиста", region: "Калмыкия", guideCount: 2 }],
    });
  });

  it("returns a safe error when the query fails", async () => {
    getDestinationSuggestionsMock.mockResolvedValue({
      data: null,
      error: new Error("db down"),
    });

    const result = await fetchDestinationSuggestionsAction();

    expect(result).toEqual({ ok: false, error: "Не удалось загрузить направления." });
  });
});
