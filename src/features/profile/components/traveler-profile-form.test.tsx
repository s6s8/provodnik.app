import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TravelerProfileForm } from "./traveler-profile-form";

const emptyProfile = {
  full_name: null,
  avatar_url: null,
  bio: null,
  home_city: null,
  languages: null,
  birth_year: null,
};

describe("TravelerProfileForm", () => {
  it("renders all required fields", () => {
    render(<TravelerProfileForm profile={emptyProfile} />);

    expect(screen.getByLabelText("Имя")).toBeInTheDocument();
    expect(screen.getByLabelText("О себе")).toBeInTheDocument();
    expect(screen.getByLabelText("Родной город")).toBeInTheDocument();
    expect(screen.getByLabelText("Языки")).toBeInTheDocument();
    expect(screen.getByLabelText("Год рождения")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Сохранить" }),
    ).toBeInTheDocument();
  });

  it("limits «О себе» to 200 characters", () => {
    render(<TravelerProfileForm profile={emptyProfile} />);

    const textarea = screen.getByLabelText("О себе") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "a".repeat(250) } });

    expect(textarea.value).toHaveLength(200);
  });
});
