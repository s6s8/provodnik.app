import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/guide/components/excursions/guide-excursions-screen", () => ({
  GuideExcursionsScreen: () => <section aria-label="guide listings">GuideExcursionsScreen</section>,
}));

import GuideListingsPage, { metadata } from "./page";

describe("GuideListingsPage", () => {
  it("keeps the guide excursions metadata title", () => {
    expect(metadata).toEqual({ title: "Мои экскурсии" });
  });

  it("renders the existing guide excursions screen", async () => {
    render(await GuideListingsPage());

    expect(screen.getByLabelText("guide listings")).toHaveTextContent("GuideExcursionsScreen");
  });
});
