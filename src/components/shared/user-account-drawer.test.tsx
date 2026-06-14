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

  it("links guides to the traveler experience", () => {
    render(
      <UserAccountDrawer
        open
        onOpenChange={vi.fn()}
        email="guide@example.com"
        role="guide"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Переключиться на путешественника" }),
    ).toHaveAttribute("href", "/trips");
  });

  it("links travelers to the guide experience", () => {
    render(
      <UserAccountDrawer
        open
        onOpenChange={vi.fn()}
        email="traveler@example.com"
        role="traveler"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Переключиться на гида" }),
    ).toHaveAttribute("href", "/guide");
  });

  it("does not render a role switch for admins", () => {
    render(
      <UserAccountDrawer
        open
        onOpenChange={vi.fn()}
        email="admin@example.com"
        role="admin"
      />,
    );

    expect(screen.queryByText(/Переключиться на/)).not.toBeInTheDocument();
  });

  it("does not render a role switch before role resolution", () => {
    render(
      <UserAccountDrawer
        open
        onOpenChange={vi.fn()}
        email="pending@example.com"
        role={null}
      />,
    );

    expect(screen.queryByText(/Переключиться на/)).not.toBeInTheDocument();
  });

  it("submits logout with POST", () => {
    render(
      <UserAccountDrawer
        open
        onOpenChange={vi.fn()}
        email="traveler@example.com"
        role="traveler"
      />,
    );

    const logoutButton = screen.getByRole("button", { name: "Выйти из аккаунта" });
    expect(logoutButton).toHaveAttribute("type", "submit");
    expect(logoutButton.closest("form")).toHaveAttribute(
      "action",
      "/api/auth/signout",
    );
    expect(logoutButton.closest("form")).toHaveAttribute("method", "post");
  });
});
