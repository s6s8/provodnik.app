import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";

import { useConfirm, type ConfirmOptions } from "./confirm-dialog";

function Harness({ options }: { options: ConfirmOptions }) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [result, setResult] = React.useState<string>("pending");

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          void confirm(options).then((value) => setResult(String(value)));
        }}
      >
        Открыть
      </button>
      <span data-testid="result">{result}</span>
      {ConfirmDialog}
    </div>
  );
}

describe("useConfirm", () => {
  it("shows the title and description, resolves true on confirm", async () => {
    render(
      <Harness
        options={{
          title: "Удалить заявку?",
          description: "Это действие нельзя отменить.",
          confirmText: "Удалить",
          destructive: true,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Открыть" }));

    expect(await screen.findByText("Удалить заявку?")).toBeInTheDocument();
    expect(screen.getByText("Это действие нельзя отменить.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent("true");
    });
  });

  it("resolves false on cancel and uses Russian default labels", async () => {
    render(<Harness options={{ title: "Подтвердите действие" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Открыть" }));

    expect(await screen.findByText("Подтвердите действие")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Подтвердить" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent("false");
    });
  });
});
