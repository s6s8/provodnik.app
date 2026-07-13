import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { useFormStatusMock } = vi.hoisted(() => ({
  useFormStatusMock: vi.fn(() => ({ pending: false })),
}));

vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  useFormStatus: useFormStatusMock,
}));

import { PendingMenuSubmitButton, PendingSubmitButton } from "./pending-submit-button";

describe("admin pending submit buttons", () => {
  it("disables regular submit buttons while their form is pending, keeping the label constant", () => {
    useFormStatusMock.mockReturnValueOnce({ pending: true });

    render(<PendingSubmitButton>Сохранить</PendingSubmitButton>);

    const button = screen.getByRole("button", { name: /сохранить/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("disables dropdown submit items while their form is pending, keeping the label constant", () => {
    useFormStatusMock.mockReturnValueOnce({ pending: true });

    render(<PendingMenuSubmitButton>Одобрить</PendingMenuSubmitButton>);

    const button = screen.getByRole("button", { name: /одобрить/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
