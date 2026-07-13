import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const confirmMock = vi.fn();

vi.mock("./confirm-dialog", () => ({
  useConfirm: () => ({
    confirm: confirmMock,
    ConfirmDialog: <div data-testid="confirm-dialog" />,
  }),
}));

import { StickyActionBar } from "./sticky-action-bar";

beforeEach(() => {
  confirmMock.mockReset();
});

describe("StickyActionBar", () => {
  it("defaults the message label to «Задать вопрос»", () => {
    render(<StickyActionBar name="Иван" onMessage={vi.fn()} primary={<button>Принять</button>} />);
    expect(screen.getByRole("button", { name: "Задать вопрос" })).toBeInTheDocument();
  });

  it("does not render a reject button when onReject is omitted", () => {
    render(<StickyActionBar name="Иван" primary={<button>Принять</button>} />);
    expect(screen.queryByText("Не подходит")).not.toBeInTheDocument();
  });

  it("renders a ghost reject button with the default label when onReject is passed", () => {
    render(<StickyActionBar name="Иван" onReject={vi.fn()} primary={<button>Принять</button>} />);
    expect(screen.getByRole("button", { name: "Не подходит" })).toBeInTheDocument();
  });

  it("renders a custom rejectLabel", () => {
    render(
      <StickyActionBar
        name="Иван"
        onReject={vi.fn()}
        rejectLabel="Отклонить"
        primary={<button>Принять</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Отклонить" })).toBeInTheDocument();
  });

  it("applies the safe-area padding on the inner rail, with a padding floor", () => {
    const { container } = render(<StickyActionBar name="Иван" primary={<button>Принять</button>} />);
    const rail = container.querySelector(".max-w-page");
    // T-06: safe-area still honoured, but max() keeps real padding on devices
    // that report a 0px inset (where the bare env() left the bar flush).
    expect(rail?.className).toContain("env(safe-area-inset-bottom)");
    expect(rail?.className).toContain("max(0.875rem");
  });

  it("does not fire the primary action when confirm resolves false", async () => {
    confirmMock.mockResolvedValue(false);
    const onPrimary = vi.fn();
    render(
      <StickyActionBar
        name="Иван"
        confirmOptions={{ title: "Подтвердить выбор?" }}
        primary={<button onClick={onPrimary}>Принять</button>}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Принять" }));

    await waitFor(() => expect(confirmMock).toHaveBeenCalledTimes(1));
    expect(onPrimary).not.toHaveBeenCalled();
  });

  it("fires the primary action only after confirm resolves true", async () => {
    confirmMock.mockResolvedValue(true);
    const onPrimary = vi.fn();
    render(
      <StickyActionBar
        name="Иван"
        confirmOptions={{ title: "Подтвердить выбор?" }}
        primary={<button onClick={onPrimary}>Принять</button>}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Принять" }));

    expect(confirmMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onPrimary).toHaveBeenCalledTimes(1));
  });

  it("fires the primary directly when no confirmOptions are provided", () => {
    const onPrimary = vi.fn();
    render(<StickyActionBar name="Иван" primary={<button onClick={onPrimary}>Принять</button>} />);

    fireEvent.click(screen.getByRole("button", { name: "Принять" }));

    expect(confirmMock).not.toHaveBeenCalled();
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });
});
