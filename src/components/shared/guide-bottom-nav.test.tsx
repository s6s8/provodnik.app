import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/guide/inbox",
}));

import { GuideBottomNav } from "./guide-bottom-nav";

describe("GuideBottomNav", () => {
  it("renders Запросы, Экскурсии, Заказы and Отзывы nav items", () => {
    render(<GuideBottomNav />);
    expect(screen.getByRole("link", { name: "Запросы" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Экскурсии" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Заказы" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Отзывы" })).toHaveAttribute("href", "/guide/reviews");
  });
});
