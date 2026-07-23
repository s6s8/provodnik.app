import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

import type { OpenRequestRecord } from "@/data/open-requests/types";

import { PublicRequestsMarketplaceScreen } from "./public-requests-marketplace-screen";

function makeRecord(overrides: Partial<OpenRequestRecord> = {}): OpenRequestRecord {
  return {
    id: "request-1",
    status: "open",
    visibility: "public",
    createdAt: "2026-07-19",
    updatedAt: "2026-07-19",
    travelerRequestId: "tr-1",
    group: { sizeTarget: 4, sizeCurrent: 1, openToMoreMembers: true },
    destinationLabel: "Казань",
    regionLabel: "Татарстан",
    dateRangeLabel: "август",
    highlights: ["Экскурсия по кремлю"],
    interests: ["history_culture"],
    ...overrides,
  };
}

describe("PublicRequestsMarketplaceScreen", () => {
  it("hydrates search, city, when, and theme filters from initialFilters", () => {
    render(
      <PublicRequestsMarketplaceScreen
        initialData={[makeRecord(), makeRecord({ id: "request-2", interests: ["food"] })]}
        initialFilters={{
          q: "кремль",
          city: "Казань",
          when: "next-month",
          from: null,
          to: null,
          themeSlugs: ["history_culture"],
        }}
      />,
    );

    expect(screen.getByRole("searchbox", { name: "Поиск по запросам" })).toHaveValue("кремль");
    expect(screen.getByRole("button", { name: /История и культура/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("syncs search and theme filters into the URL", () => {
    render(
      <PublicRequestsMarketplaceScreen
        initialData={[
          makeRecord(),
          makeRecord({ id: "request-2", interests: ["food"], highlights: ["Гастрономия"] }),
        ]}
        initialFilters={{
          q: "кazan",
          city: null,
          when: null,
          from: null,
          to: null,
          themeSlugs: [],
        }}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Поиск по запросам" }), {
      target: { value: "кремль" },
    });

    expect(replaceMock).toHaveBeenCalledWith("/requests?q=%D0%BA%D1%80%D0%B5%D0%BC%D0%BB%D1%8C", {
      scroll: false,
    });

    fireEvent.click(screen.getByRole("button", { name: /История и культура/ }));

    expect(replaceMock).toHaveBeenLastCalledWith(
      "/requests?q=%D0%BA%D1%80%D0%B5%D0%BC%D0%BB%D1%8C&theme=history_culture",
      { scroll: false },
    );
  });
});
