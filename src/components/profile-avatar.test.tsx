import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileAvatar } from "./profile-avatar";

describe("ProfileAvatar", () => {
  it("renders an image when avatar URL is present", () => {
    render(
      <ProfileAvatar
        profile={{ full_name: "Алдар Б.", avatar_url: "/a/aldar.jpg" }}
        size={48}
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/a/aldar.jpg");
  });

  it("renders a letter circle when URL is missing but name is present", () => {
    render(
      <ProfileAvatar
        profile={{ full_name: "Алдар Б.", avatar_url: null }}
        size={48}
      />,
    );
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("А")).toBeInTheDocument();
  });

  it("renders a grey circle when both URL and name are missing", () => {
    render(
      <ProfileAvatar
        profile={{ full_name: null, avatar_url: null }}
        size={48}
      />,
    );
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByText(/\S/)).toBeNull();
    expect(screen.getByTestId("profile-avatar-empty")).toBeInTheDocument();
  });

  it("renders a letter circle when name is whitespace-only", () => {
    render(
      <ProfileAvatar
        profile={{ full_name: "   ", avatar_url: null }}
        size={48}
      />,
    );
    expect(screen.getByTestId("profile-avatar-empty")).toBeInTheDocument();
  });
});
