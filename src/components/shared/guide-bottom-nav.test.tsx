import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/guide/inbox",
}));

import { GuideBottomNav } from "./guide-bottom-nav";

describe("GuideBottomNav", () => {
  it("renders the four guide tabs, using short labels where defined", () => {
    render(<GuideBottomNav />);
    expect(screen.getByRole("link", { name: "Запросы" })).toBeDefined();
    // T-23: bottom nav shows the shortLabel ("Брони"), so the label stays on one
    // line at 375px. The accessible name matches what is rendered.
    expect(screen.getByRole("link", { name: "Брони" })).toHaveAttribute("href", "/guide/bookings");
    expect(screen.getByRole("link", { name: "Экскурсии" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Отзывы" })).toHaveAttribute("href", "/guide/reviews");

    const labels = screen.getAllByRole("link").map((link) => link.textContent?.trim());
    expect(labels).toEqual(["Запросы", "Брони", "Экскурсии", "Отзывы"]);
  });
});
