import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  PublicRequestDetailScreen,
  type PublicRequestDetailViewModel,
} from "./public-request-detail-screen";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <span role="img" aria-label={alt} data-src={src} />
  ),
}));


vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, title, className }: { children: React.ReactNode; title?: string; className?: string }) => (
    <div title={title} className={className}>
      {children}
    </div>
  ),
  AvatarImage: ({ src, alt }: { src: string; alt: string }) => (
    <span role="img" aria-label={alt} data-src={src} />
  ),
  AvatarFallback: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
}));

vi.mock("@/features/requests/components/join-group-button", () => ({
  JoinGroupButton: ({ className }: { requestId: string; className?: string }) => (
    <button type="button" className={className}>
      Присоединиться к группе
    </button>
  ),
}));

const baseViewModel: PublicRequestDetailViewModel = {
  title: "Элиста",
  regionLabel: "Калмыкия · Россия",
  cityImageUrl: "https://images.unsplash.com/photo-1?auto=format&fit=crop&w=1800&q=80",
  dateLabel: "25 июня",
  timeLabel: "14:00",
  datesFlexible: true,
  pricePerPersonRub: 3000,
  memberCount: 4,
  members: [
    { id: "u1", displayName: "Айгуль", initials: "А" },
    { id: "u2", displayName: "Мария", initials: "М" },
  ],
  organizerName: "Айгуль",
  themes: ["history_culture", "nature"],
  notes: "Едем небольшой компанией по Калмыкии.",
  joinState: "can-join",
};

describe("PublicRequestDetailScreen", () => {
  it("renders the сборная join page contract without deleted sections", () => {
    render(<PublicRequestDetailScreen requestId="request-1" viewModel={baseViewModel} />);

    expect(screen.getAllByText("Элиста")).toHaveLength(1);
    expect(screen.getByText("Сборная группа")).toBeInTheDocument();
    expect(screen.getAllByText("Присоединиться к группе")).toHaveLength(2);
    expect(screen.getByText("Кто едет")).toBeInTheDocument();
    expect(screen.getByText("Как это работает")).toBeInTheDocument();

    expect(screen.queryByText(/мест занято/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Стоимость на человека/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/О маршруте/i)).not.toBeInTheDocument();
  });

  it("hides flexible-date and about blocks when the view-model has no data for them", () => {
    render(
      <PublicRequestDetailScreen
        requestId="request-1"
        viewModel={{ ...baseViewModel, datesFlexible: false, notes: "", themes: [] }}
      />,
    );

    expect(screen.queryByText("Гибкие даты")).not.toBeInTheDocument();
    expect(screen.queryByText("О поездке")).not.toBeInTheDocument();
  });
});
