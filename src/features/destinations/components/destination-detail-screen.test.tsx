import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DestinationDetailScreen } from "./destination-detail-screen";
import type { DestinationSummary } from "@/data/destinations/types";

function makeDestination(overrides: Partial<DestinationSummary> = {}): DestinationSummary {
  return {
    slug: "altai",
    name: "Алтай",
    region: "Алтай",
    imageUrl: "/hero.jpg",
    description: "",
    listingCount: 0,
    openRequestCount: 0,
    ...overrides,
  };
}

describe("DestinationDetailScreen — requests section", () => {
  it("renders a real count when there are open requests", () => {
    const { container } = render(
      <DestinationDetailScreen destination={makeDestination({ openRequestCount: 3 })} />,
    );

    expect(container.textContent).toContain("3 активных запроса");
    expect(container.textContent).not.toContain(
      "Сейчас нет активных запросов по этому направлению.",
    );
  });

  it("renders the empty message when there are no open requests", () => {
    const { container } = render(
      <DestinationDetailScreen destination={makeDestination({ openRequestCount: 0 })} />,
    );

    expect(container.textContent).toContain(
      "Сейчас нет активных запросов по этому направлению.",
    );
  });

  it("points the «Создать запрос» CTA at /form", () => {
    const { getByText } = render(
      <DestinationDetailScreen destination={makeDestination()} />,
    );

    expect(getByText("Создать запрос").closest("a")).toHaveAttribute("href", "/form");
  });
});
