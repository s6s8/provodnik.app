import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/trips",
}));

import { TravelerBottomNav } from "./traveler-bottom-nav";

describe("TravelerBottomNav", () => {
  it("renders the traveler primary nav with accessible tap targets and short labels", () => {
    render(<TravelerBottomNav />);

    expect(screen.getByRole("link", { name: "Запросы" })).toHaveAttribute("href", "/requests");
    expect(screen.getByRole("link", { name: "Готовые экскурсии" })).toHaveAttribute(
      "href",
      "/listings",
    );
    expect(screen.getByRole("link", { name: "Гиды" })).toHaveAttribute("href", "/guides");
    expect(screen.getByRole("link", { name: "Мои запросы" })).toHaveAttribute("href", "/trips");

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "Запросы",
      "Готовые",
      "Гиды",
      "Поездки",
    ]);

    for (const link of links) {
      expect(link.className).toMatch(/min-h-11/);
    }
  });

  it("hides flag-gated destinations such as the public catalog", () => {
    render(<TravelerBottomNav hiddenNavHrefs={["/listings"]} />);

    expect(screen.queryByRole("link", { name: "Готовые экскурсии" })).toBeNull();
    expect(screen.getByRole("link", { name: "Запросы" })).toBeInTheDocument();
  });
});
