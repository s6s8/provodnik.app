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
  it("disables and relabels regular submit buttons while their form is pending", () => {
    useFormStatusMock.mockReturnValueOnce({ pending: true });

    render(
      <PendingSubmitButton pendingLabel="Сохраняем…">Сохранить</PendingSubmitButton>,
    );

    const button = screen.getByRole("button", { name: /сохраняем/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("disables and relabels dropdown submit items while their form is pending", () => {
    useFormStatusMock.mockReturnValueOnce({ pending: true });

    render(
      <PendingMenuSubmitButton pendingLabel="Одобряем…">
        Одобрить
      </PendingMenuSubmitButton>,
    );

    const button = screen.getByRole("button", { name: /одобряем/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
