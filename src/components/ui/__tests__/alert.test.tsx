import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Alert } from "../alert";

describe("Alert", () => {
  it("uses polite status semantics for the info variant (not role=alert)", () => {
    const { container } = render(<Alert variant="info">Инфо</Alert>);
    const alert = container.querySelector('[data-slot="alert"]');

    expect(alert?.getAttribute("aria-live")).toBe("polite");
    expect(alert?.getAttribute("role")).not.toBe("alert");
  });

  it("tints the success variant and announces politely", () => {
    const { container } = render(<Alert variant="success">Готово</Alert>);
    const alert = container.querySelector('[data-slot="alert"]');

    expect(alert?.className).toContain("bg-green-tint");
    expect(alert?.getAttribute("aria-live")).toBe("polite");
  });

  it("keeps role=alert for the warning variant", () => {
    const { container } = render(<Alert variant="warning">Внимание</Alert>);
    const alert = container.querySelector('[data-slot="alert"]');

    expect(alert?.getAttribute("role")).toBe("alert");
  });

  it("keeps role=alert for the destructive variant", () => {
    const { container } = render(<Alert variant="destructive">Ошибка</Alert>);
    const alert = container.querySelector('[data-slot="alert"]');

    expect(alert?.getAttribute("role")).toBe("alert");
  });

  it("renders a close button when dismissible", () => {
    const onDismiss = vi.fn();
    const { getByLabelText } = render(
      <Alert variant="info" dismissible onDismiss={onDismiss}>
        Инфо
      </Alert>
    );

    expect(getByLabelText("Закрыть")).toBeTruthy();
  });
});
