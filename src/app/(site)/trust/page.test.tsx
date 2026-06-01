import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TrustPage from "./page";

const BANNED_TOUR_PHRASES = [
  /\bтуры\b/i,
  /\bтуров\b/i,
  /\bтуру\b/i,
  /\bтура\b/i,
  /\bтуре\b/i,
  /\bтур\b/i,
] as const;

function visibleText() {
  return document.body.textContent ?? "";
}

describe("/trust copy", () => {
  it("uses approved excursion terminology for travellers", () => {
    render(<TrustPage />);

    expect(
      screen.getByText(/маркетплейс экскурсий по России с бронированием по запросу/),
    ).toBeInTheDocument();
    expect(screen.getByText(/по конкретной экскурсии/)).toBeInTheDocument();

    const text = visibleText();
    for (const pattern of BANNED_TOUR_PHRASES) {
      expect(text).not.toMatch(pattern);
    }
  });
});
