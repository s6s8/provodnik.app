import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { GuideListingRow } from "@/lib/supabase/admin-listings";

import { GuideListingsPanel, summarizeGuideListings } from "./guide-listings-panel";

const listings: GuideListingRow[] = [
  {
    id: "l-draft",
    title: "Черновая прогулка",
    status: "draft",
    created_at: "2026-05-03T10:00:00.000Z",
  },
  {
    id: "l-published",
    title: "Опубликованный тур",
    status: "published",
    created_at: "2026-05-02T10:00:00.000Z",
  },
  {
    id: "l-pending",
    title: "Тур на модерации",
    status: "pending_review",
    created_at: "2026-05-01T10:00:00.000Z",
  },
];

describe("summarizeGuideListings", () => {
  it("counts total / published / pending / drafts", () => {
    expect(summarizeGuideListings(listings)).toEqual({
      total: 3,
      published: 1,
      pending: 1,
      drafts: 1,
    });
  });

  it("counts the legacy `active` status as published", () => {
    expect(
      summarizeGuideListings([{ ...listings[0], id: "l-active", status: "active" }]),
    ).toEqual({ total: 1, published: 1, pending: 0, drafts: 0 });
  });
});

describe("GuideListingsPanel", () => {
  it("renders drafts alongside every other status, with counts", () => {
    render(<GuideListingsPanel listings={listings} />);

    // The whole point of the panel: a draft is visible to the admin.
    expect(screen.getByText("Черновая прогулка")).toBeInTheDocument();
    expect(screen.getByText("Черновик")).toBeInTheDocument();

    expect(screen.getByText("Опубликованный тур")).toBeInTheDocument();
    expect(screen.getByText("Тур на модерации")).toBeInTheDocument();

    expect(
      screen.getByText("Всего: 3 · опубликовано: 1 · на модерации: 1 · черновики: 1"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Тур на модерации" }),
    ).toHaveAttribute("href", "/admin/moderation");

    expect(screen.queryByText(/показаны первые 50/)).not.toBeInTheDocument();
  });

  it("notes truncation when the 50-row cap is hit", () => {
    const capped = Array.from({ length: 50 }, (_, index) => ({
      ...listings[0],
      id: `l-${index}`,
      title: `Черновик ${index}`,
    }));

    render(<GuideListingsPanel listings={capped} />);

    expect(screen.getByText(/показаны первые 50/)).toBeInTheDocument();
  });

  it("tells the admin when the guide has no listings at all", () => {
    render(<GuideListingsPanel listings={[]} />);

    expect(screen.getByText("У гида пока нет экскурсий.")).toBeInTheDocument();
  });
});
