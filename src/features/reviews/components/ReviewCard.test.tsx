import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type {
  ReviewRatingsBreakdownRow,
  ReviewReplyRow,
  ReviewRow,
} from "@/lib/supabase/types";

vi.mock("@/features/reviews/components/ReplyComposer", () => ({
  ReplyComposer: () => <div data-testid="reply-composer" />,
}));

import { ReviewCard } from "./ReviewCard";

const review: ReviewRow = {
  id: "00000000-0000-4000-8000-000000000001",
  listing_id: null,
  guide_id: "00000000-0000-4000-8000-000000000002",
  traveler_id: "00000000-0000-4000-8000-000000000003",
  rating: 5,
  body: "Отличная прогулка",
  status: "published",
  created_at: "2026-06-03T00:00:00.000Z",
};

const breakdown: ReviewRatingsBreakdownRow[] = [
  { review_id: review.id, axis: "material", score: 5 },
  { review_id: review.id, axis: "engagement", score: 5 },
  { review_id: review.id, axis: "knowledge", score: 5 },
  { review_id: review.id, axis: "route", score: 5 },
];

describe("ReviewCard", () => {
  it("masks contact details in published guide replies", () => {
    const reply: ReviewReplyRow = {
      id: "00000000-0000-4000-8000-000000000004",
      review_id: review.id,
      guide_id: "00000000-0000-4000-8000-000000000002",
      body: "Спасибо! Пишите guide@example.com или звоните +79991234567",
      status: "published",
      submitted_at: "2026-06-03T01:00:00.000Z",
      published_at: "2026-06-03T02:00:00.000Z",
    };

    render(<ReviewCard review={review} breakdown={breakdown} reply={reply} />);

    expect(
      screen.getByText("Спасибо! Пишите [контакт скрыт] или звоните [контакт скрыт]"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/guide@example\.com/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+79991234567/)).not.toBeInTheDocument();
  });
});
