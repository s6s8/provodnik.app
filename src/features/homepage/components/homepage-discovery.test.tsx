import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { RequestRecord } from "@/data/supabase/queries";
import { HomePageDiscovery } from "./homepage-discovery";

beforeAll(() => {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  globalThis.ResizeObserver = ResizeObserverMock;
});

const request: RequestRecord = {
  id: "homepage-request-1",
  destination: "Тбилиси",
  destinationSlug: "tbilisi",
  destinationRegion: "Грузия",
  title: "Тбилиси",
  dateLabel: "21 июня",
  startsOn: null,
  endsOn: null,
  startTime: "10:00",
  endTime: "12:00",
  date_locked: false,
  time_locked: true,
  groupSize: 2,
  capacity: 5,
  budgetRub: 7900,
  budgetLabel: "7 900 ₽ / чел.",
  requesterName: "Путешественник",
  requesterInitials: "П",
  description: "",
  interests: ["history_culture", "nature"],
  mode: "assembly",
  format: "Городская экскурсия",
  status: "open",
  createdAt: "2026-06-01T00:00:00Z",
  offerCount: 3,
  imageUrl: "/demo.jpg",
  members: [],
  dateFlexibility: "few_days",
};

describe("HomePageDiscovery", () => {
  it("keeps the discovery section shell and maps homepage requests to final cards", () => {
    render(<HomePageDiscovery requests={[request]} />);

    expect(screen.getByText("Что ищут путешественники прямо сейчас")).toBeInTheDocument();

    const card = screen.getByRole("link", { name: /Тбилиси/ });
    const article = card.closest("article");
    expect(card).toHaveAttribute("href", "/requests/homepage-request-1");
    expect(article).not.toBeNull();
    expect(within(article!).getByText("Тбилиси")).toBeInTheDocument();
    expect(within(article!).getByText("21 июня")).toBeInTheDocument();
    expect(within(article!).queryByText(/10:00/)).not.toBeInTheDocument();
    expect(within(article!).getByText("Ждёт гида")).toBeInTheDocument();
    expect(within(article!).getByText("Сборная группа")).toBeInTheDocument();
    expect(within(article!).getByText("Гибкие даты")).toBeInTheDocument();
    expect(within(article!).getByText("История и культура")).toBeInTheDocument();
    expect(within(article!).getByText(/7\s*900 ₽ \/ чел/)).toBeInTheDocument();
    expect(within(article!).queryByText(/3 ответа|ответов|ответа/)).not.toBeInTheDocument();
  });

  it("keeps the existing empty state", () => {
    render(<HomePageDiscovery requests={[]} />);

    expect(screen.getByText("Пока пусто")).toBeInTheDocument();
    expect(screen.getByText("Будьте первыми — отправьте запрос в форме выше")).toBeInTheDocument();
  });
});
