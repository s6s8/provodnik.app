import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/requests/sent-request-actions", () => ({
  updateRequestDetailsAction: vi.fn(),
}));

import { SentScreenEnrich } from "./sent-screen-enrich";

describe("SentScreenEnrich", () => {
  it("allows notes up to the traveler request schema limit", () => {
    render(<SentScreenEnrich requestId="request-1" />);

    fireEvent.click(screen.getByRole("button", { name: /добавить детали/i }));

    expect(
      screen.getByLabelText("Дополнительная информация для гидов"),
    ).toHaveAttribute("maxLength", "800");
    expect(screen.getByText("0/800")).toBeInTheDocument();
  });
});
