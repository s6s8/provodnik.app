import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/guide/inbox",
}));

import { GuideBottomNav } from "./guide-bottom-nav";

describe("GuideBottomNav", () => {
  it("renders the four guide tabs with full accessible names and 44px tap targets", () => {
    render(<GuideBottomNav />);
    expect(screen.getByRole("link", { name: "Запросы" })).toHaveAttribute("href", "/guide/inbox");
    expect(screen.getByRole("link", { name: "Мои бронирования" })).toHaveAttribute(
      "href",
      "/guide/bookings",
    );
    expect(screen.getByRole("link", { name: "Экскурсии" })).toHaveAttribute("href", "/guide/listings");
    expect(screen.getByRole("link", { name: "Отзывы" })).toHaveAttribute("href", "/guide/reviews");

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "Запросы",
      "Брони",
      "Экскурсии",
      "Отзывы",
    ]);

    for (const link of links) {
      expect(link.className).toMatch(/min-h-11/);
    }
  });
});
