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

  it("keeps owner state above member state", () => {
    render(<OpenGroupCard {...baseProps} owner member />);

    expect(screen.getByRole("link", { name: "Это ваша группа" })).toHaveAttribute("href", "/requests/req-1");
    expect(screen.queryByRole("link", { name: "Вы в группе" })).not.toBeInTheDocument();
  });
});
