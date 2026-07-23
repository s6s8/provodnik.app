import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReadyExcursionDetail } from "./ready-excursion-detail";

const DETAIL = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Адык",
  description: "Прогулка по степи и знакомство с Калмыкией.",
  photoUrl: "https://cdn.example/adyk.jpg",
  priceFromKopecks: 450_000,
  priceScope: "per_group" as const,
  durationText: "5 часов",
  meetingPoint: "Элиста, площадь Ленина",
  maxParticipants: 8,
  region: "Калмыкия",
  category: "Культура",
  guide: { slug: "adyk", displayName: "Адык" },
};

describe("ReadyExcursionDetail", () => {
  it("shows the ready excursion's public fields and directs a request to its guide", () => {
    render(<ReadyExcursionDetail detail={DETAIL} />);

    expect(screen.getByRole("heading", { level: 1, name: "Адык" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Адык" })).toHaveAttribute(
      "src",
      expect.stringContaining("adyk.jpg"),
    );
    expect(screen.getByText("от 4 500 ₽ за группу до 8 человек")).toBeInTheDocument();
    expect(screen.getByText("5 часов")).toBeInTheDocument();
    expect(screen.getByText("Прогулка по степи и знакомство с Калмыкией.")).toBeInTheDocument();
    expect(screen.queryByText("Элиста, площадь Ленина")).not.toBeInTheDocument();
    expect(screen.queryByText("Место встречи")).not.toBeInTheDocument();
    expect(screen.getByText("до 8 человек")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Адык" })).toHaveAttribute("href", "/guides/adyk");
    // The template id travels with the slug: the request pipeline resolves the
    // addressee and the itinerary snapshot from the template itself, so the booking
    // that eventually comes out of this CTA still knows which excursion it is.
    expect(screen.getByRole("link", { name: "Отправить запрос гиду" })).toHaveAttribute(
      "href",
      "/?guide=adyk&template=11111111-1111-1111-1111-111111111111",
    );
  });
});
