import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TrustStrip from "./TrustStrip";

describe("TrustStrip", () => {
  it("shows «Гиды проверены» and no «Отмена за 24ч»", () => {
    render(<TrustStrip />);

    expect(screen.getByText("Гиды проверены")).toBeInTheDocument();
    expect(screen.queryByText("Отмена за 24ч")).not.toBeInTheDocument();
  });
});
