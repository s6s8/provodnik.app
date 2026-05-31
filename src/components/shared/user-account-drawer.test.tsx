import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UserAccountDrawer } from "./user-account-drawer";

describe("UserAccountDrawer", () => {
  it("renders an accessible drawer description", () => {
    render(
      <UserAccountDrawer
        open
        onOpenChange={vi.fn()}
        email="traveler@example.com"
        role="traveler"
      />,
    );

    expect(
      screen.getByText("Профиль, помощь и выход из аккаунта."),
    ).toBeInTheDocument();
  });

  it("hides «Настройки» for travellers (settings merged into profile)", () => {
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

  it("hides «Настройки» for guides too (settings merged into profile)", () => {
    render(
      <UserAccountDrawer
        open
        onOpenChange={vi.fn()}
        email="guide@example.com"
        role="guide"
      />,
    );

    expect(screen.queryByText("Настройки")).not.toBeInTheDocument();
    expect(screen.getByText("Мой профиль")).toBeInTheDocument();
  });
});
