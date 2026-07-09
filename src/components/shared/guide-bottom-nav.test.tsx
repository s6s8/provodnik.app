import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/guide/inbox",
}));

import { GuideBottomNav } from "./guide-bottom-nav";

describe("GuideBottomNav", () => {
  it("renders Запросы and Мои бронирования next to each other", () => {
    render(<GuideBottomNav />);
    expect(screen.getByRole("link", { name: "Запросы" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Мои бронирования" })).toHaveAttribute("href", "/guide/bookings");
    expect(screen.getByRole("link", { name: "Экскурсии" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Отзывы" })).toHaveAttribute("href", "/guide/reviews");

    const labels = screen.getAllByRole("link").map((link) => link.textContent?.trim());
    expect(labels).toEqual(["Запросы", "Мои бронирования", "Экскурсии", "Отзывы"]);
  });
});
