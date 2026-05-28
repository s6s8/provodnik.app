import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TravelerProfile } from "./traveler-profile-form";
import { TravelerProfileForGuide } from "./traveler-profile-for-guide";

const baseProfile: TravelerProfile = {
  full_name: "Алексей К.",
  avatar_url: null,
  bio: null,
  home_city: null,
  languages: null,
  birth_year: null,
};

describe("TravelerProfileForGuide", () => {
  it("shows derived age, not the birth year", () => {
    render(
      <TravelerProfileForGuide
        profile={{ ...baseProfile, birth_year: 1990 }}
      />,
    );

    expect(screen.queryByText("1990")).toBeNull();
    expect(screen.getByText(/36 лет/)).toBeInTheDocument();
  });

  it("never renders bio if it contains contact-like patterns", () => {
    render(
      <TravelerProfileForGuide
        profile={{ ...baseProfile, bio: "+7 999 11 22" }}
      />,
    );

    expect(screen.queryByText(/999/)).toBeNull();
  });

  it("shows the traveler header without contact data", () => {
    render(
      <TravelerProfileForGuide
        profile={{
          ...baseProfile,
          bio: "Люблю прогулки по старому городу",
          home_city: "Казань",
          languages: ["ru", "en"],
        }}
      />,
    );

    expect(screen.getByText("Алексей К.")).toBeInTheDocument();
    expect(
      screen.getByText("Люблю прогулки по старому городу"),
    ).toBeInTheDocument();
    expect(screen.getByText("Родной город: Казань")).toBeInTheDocument();
    expect(screen.getByText("Языки: ru, en")).toBeInTheDocument();
    expect(screen.queryByText(/@|\+7|999|http|www/i)).toBeNull();
  });
});
