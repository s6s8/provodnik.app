import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./homepage-request-form", () => ({
  HomepageRequestForm: () => <div data-testid="request-form-stub" />,
}));

import { HomepageHeroForm } from "./homepage-hero-form";

describe("HomepageHeroForm header", () => {
  it("renders the new H1 and no subtitle with a commission reference", () => {
    render(<HomepageHeroForm destinations={[]} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Местный гид под ваш запрос",
    );
    expect(screen.queryByText(/Мы берём/i)).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
    expect(screen.queryByText(/комисси/i)).toBeNull();
  });
});
