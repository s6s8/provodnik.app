import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OpenGroupCard } from "./open-group-card";

const baseProps = {
  href: "/requests/req-1",
  city: "Тбилиси",
  imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
  status: "waiting" as const,
};

describe("OpenGroupCard", () => {
  it("shows joined state instead of join CTA for existing group members", () => {
    render(<OpenGroupCard {...baseProps} member />);

    expect(screen.getByRole("link", { name: "Вы в группе" })).toHaveAttribute("href", "/requests/req-1");
    expect(screen.queryByRole("link", { name: "Присоединиться" })).not.toBeInTheDocument();
  });

  it("links the card image and title to the request", () => {
    render(<OpenGroupCard {...baseProps} />);

    const links = screen.getAllByRole("link", { name: /Тбилиси/ });
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute("href", "/requests/req-1");
  });

  it("shows flexible time in the meta line when dates are open", () => {
    render(
      <OpenGroupCard
        {...baseProps}
        datesFlexible
        timeFlexible
        date="10 августа"
      />,
    );

    expect(screen.getByText(/Гибкие даты · Гибкое время/)).toBeInTheDocument();
  });
});
