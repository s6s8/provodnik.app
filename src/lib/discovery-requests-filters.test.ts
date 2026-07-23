import { describe, expect, it } from "vitest";

import {
  buildRequestsMarketplacePath,
  parseRequestsMarketplaceFilters,
  themeLabelFromSlug,
  themeSlugFromLabel,
} from "./discovery-requests-filters";

describe("discovery-requests-filters", () => {
  it("round-trips search, city, when, date range, and theme slugs", () => {
    const state = {
      q: "кремль",
      city: "Казань",
      when: "next-month" as const,
      from: "2026-07-01",
      to: "2026-07-15",
      themeSlugs: ["history_culture", "food"] as const,
    };

    const path = buildRequestsMarketplacePath({
      ...state,
      themeSlugs: [...state.themeSlugs],
    });

    expect(path).toBe(
      "/requests?q=%D0%BA%D1%80%D0%B5%D0%BC%D0%BB%D1%8C&city=%D0%9A%D0%B0%D0%B7%D0%B0%D0%BD%D1%8C&when=next-month&from=2026-07-01&to=2026-07-15&theme=history_culture%2Cfood",
    );

    const parsed = parseRequestsMarketplaceFilters(new URLSearchParams(path.split("?")[1]));
    expect(parsed.q).toBe("кремль");
    expect(parsed.city).toBe("Казань");
    expect(parsed.when).toBe("next-month");
    expect(parsed.from).toBe("2026-07-01");
    expect(parsed.to).toBe("2026-07-15");
    expect(parsed.themeSlugs).toEqual(["history_culture", "food"]);
  });

  it("drops unknown when presets and invalid theme slugs", () => {
    const parsed = parseRequestsMarketplaceFilters(
      new URLSearchParams("when=soon&theme=history_culture,not-a-theme"),
    );

    expect(parsed.when).toBeNull();
    expect(parsed.themeSlugs).toEqual(["history_culture"]);
  });

  it("maps theme labels and slugs for facet chips", () => {
    expect(themeSlugFromLabel("История и культура")).toBe("history_culture");
    expect(themeLabelFromSlug("food")).toBe("Гастрономия");
  });
});
