import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UserAccountDrawer } from "./user-account-drawer";

describe("UserAccountDrawer", () => {
  it("hides «Настройки» for travellers", () => {
    render(
      <UserAccountDrawer
        open
        onOpenChange={vi.fn()}
        email="traveler@example.com"
        role="traveler"
      />,
    );

    expect(screen.queryByText("Настройки")).not.toBeInTheDocument();
    expect(screen.getByText("Мой профиль")).toBeInTheDocument();
  });

  it("shows «Настройки» for guides", () => {
    render(
      <UserAccountDrawer
        open
        onOpenChange={vi.fn()}
        email="guide@example.com"
        role="guide"
      />,
    );

    expect(screen.getByText("Настройки")).toBeInTheDocument();
  });
});
