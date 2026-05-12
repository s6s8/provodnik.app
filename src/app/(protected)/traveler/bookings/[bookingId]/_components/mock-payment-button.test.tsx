import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MockPaymentButton } from "./mock-payment-button";

describe("MockPaymentButton", () => {
  it("invokes onClick passthrough and shows imitation copy after click", () => {
    const spy = vi.fn();
    render(<MockPaymentButton onClick={spy} />);
    fireEvent.click(screen.getByRole("button", { name: /Я оплатил/ }));
    expect(spy).toHaveBeenCalledOnce();
    expect(screen.getByText(/Имитация оплаты/)).toBeInTheDocument();
  });
});
