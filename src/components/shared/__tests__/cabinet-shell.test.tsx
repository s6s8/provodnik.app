import { render, screen } from "@testing-library/react";
import { Map } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { CabinetShell } from "../cabinet-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/guide/listings",
}));

describe("CabinetShell", () => {
  it("renders the desktop sidebar, nav, active state, mobile bottom-nav and children", () => {
    const { container } = render(
      <CabinetShell
        user={{ name: "Айдар" }}
        navItems={[{ href: "/guide/listings", label: "Маршруты", icon: Map }]}
      >
        <div>контент</div>
      </CabinetShell>,
    );

    const aside = container.querySelector("aside");
    expect(aside).not.toBeNull();
    expect(aside?.className).toContain("w-60");

    const links = screen.getAllByText("Маршруты");
    expect(links.length).toBeGreaterThan(0);
    const activeLink = aside?.querySelector("a");
    expect(activeLink).not.toBeNull();
    expect(activeLink?.className).toContain("border-primary");
    expect(activeLink?.className).toContain("bg-primary-tint");

    expect(container.querySelector("nav.md\\:hidden")).not.toBeNull();

    expect(screen.getByText("контент")).not.toBeNull();
  });
});
