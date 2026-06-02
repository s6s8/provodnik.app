import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TravelerProfileCompletionChecklist } from "./traveler-profile-completion-checklist";

describe("TravelerProfileCompletionChecklist", () => {
  it("shows the name item as incomplete when full_name is absent", () => {
    render(<TravelerProfileCompletionChecklist profile={{ full_name: null }} />);

    expect(
      screen.getByRole("region", { name: "Профиль путешественника" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Имя путешественника")).toBeInTheDocument();
    expect(
      screen.getByText(/без него профиль не считается заполненным/i),
    ).toBeInTheDocument();
  });

  it("shows the name item as complete when full_name is set", () => {
    render(<TravelerProfileCompletionChecklist profile={{ full_name: "Анна" }} />);

    expect(screen.getByText("Заполнено")).toBeInTheDocument();
    expect(
      screen.queryByText(/без него профиль не считается заполненным/i),
    ).not.toBeInTheDocument();
  });
});
