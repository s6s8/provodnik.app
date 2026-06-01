import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ForBusinessPage from "./page";

const BANNED_TOUR_PHRASES = [
  /\bтуры\b/i,
  /\bтуров\b/i,
  /\bтуру\b/i,
  /\bтура\b/i,
  /\bтуре\b/i,
  /\bтур\b/i,
  /исполнител/i,
] as const;

function visibleText() {
  return document.body.textContent ?? "";
}

describe("/for-business copy", () => {
  it("uses approved excursion terminology for corporate travellers", () => {
    render(<ForBusinessPage />);

    expect(
      screen.getByText(/Групповые экскурсии до 20 человек/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/напрямую гиду или партнёру по реквизитам в счёте/),
    ).toBeInTheDocument();

    const text = visibleText();
    for (const pattern of BANNED_TOUR_PHRASES) {
      expect(text).not.toMatch(pattern);
    }
  });
});
