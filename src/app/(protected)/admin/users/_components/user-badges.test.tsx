import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { MissingPhoneBadge } from "./user-badges";

describe("MissingPhoneBadge", () => {
  it("flags a guide with no phone", () => {
    render(<MissingPhoneBadge role="guide" phone={null} />);

    expect(screen.getByText("нет телефона")).toBeInTheDocument();
  });

  it("stays silent for a guide with a phone", () => {
    render(<MissingPhoneBadge role="guide" phone="··· 67" />);

    expect(screen.queryByText("нет телефона")).not.toBeInTheDocument();
  });

  it("stays silent for a traveler with no phone", () => {
    render(<MissingPhoneBadge role="traveler" phone={null} />);

    expect(screen.queryByText("нет телефона")).not.toBeInTheDocument();
  });
});
