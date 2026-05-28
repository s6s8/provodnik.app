import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TravelerBookingReviewScreen } from "./traveler-booking-review-screen";

describe("TravelerBookingReviewScreen", () => {
  it("renders the guide avatar via <img> when guideAvatarUrl is set", () => {
    render(
      <TravelerBookingReviewScreen
        booking={{
          id: "b1",
          destination: "Элиста",
          dateLabel: "12 июня 2026",
          guideName: "Алдар Б.",
          guideAvatarUrl: "/a/aldar.jpg",
          guideVerified: true,
        }}
        action={() => {}}
      />,
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/a/aldar.jpg");
    expect(img).toHaveAttribute("alt", "Алдар Б.");
  });

  it("renders a letter circle (ProfileAvatar branch) when avatar URL is missing", () => {
    render(
      <TravelerBookingReviewScreen
        booking={{
          id: "b1",
          destination: "Элиста",
          dateLabel: "12 июня 2026",
          guideName: "Алдар Б.",
          guideAvatarUrl: null,
          guideVerified: false,
        }}
        action={() => {}}
      />,
    );

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("А")).toBeInTheDocument();
  });
});
