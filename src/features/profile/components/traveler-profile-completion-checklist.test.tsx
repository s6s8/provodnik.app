import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TravelerProfileCompletionChecklist } from "./traveler-profile-completion-checklist";

describe("TravelerProfileCompletionChecklist", () => {
  it("shows the name item as incomplete when full_name is absent", () => {
    render(<TravelerProfileCompletionChecklist profile={{ full_name: null }} />);

    expect(
      screen.getByRole("region", { name: "Готовность профиля" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Профиль заполнен")).toBeInTheDocument();
    expect(
      screen.getByText(/чтобы гиды понимали, к кому обращаются/i),
    ).toBeInTheDocument();
  });

  it("shows the name item as complete when full_name is set", () => {
    render(<TravelerProfileCompletionChecklist profile={{ full_name: "Анна" }} />);

    expect(
      screen.getByText("Имя указано — гиды видят, к кому обращаются."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/чтобы гиды понимали, к кому обращаются/i),
    ).not.toBeInTheDocument();
  });
});
