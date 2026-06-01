import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyCabinet } from "./empty-cabinet";

describe("EmptyCabinet", () => {
  it("renders verbatim headline, subtitle, CTA, and at least one «Элиста» card", () => {
    render(
      <EmptyCabinet
        inspirations={[
          { slug: "elista", label: "Элиста", imageUrl: "/e.jpg" },
          { slug: "karelia", label: "Карелия", imageUrl: "/k.jpg" },
          { slug: "dagestan", label: "Дагестан", imageUrl: "/d.jpg" },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Куда поедем?",
    );
    expect(
      screen.getByText("Опишите поездку — местные гиды пришлют предложения"),
    ).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Создать запрос" });
    expect(cta).toHaveAttribute("href", "/");
    expect(screen.getByText("Элиста")).toBeInTheDocument();
  });
});
