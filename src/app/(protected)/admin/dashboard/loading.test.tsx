import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Loading from "./loading";

describe("admin dashboard Loading", () => {
  it("renders a visible h1 mid-load so the skeleton is not headless", () => {
    render(<Loading />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Обзор" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });
});
