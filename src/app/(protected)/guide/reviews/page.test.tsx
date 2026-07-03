import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ReviewRatingsBreakdownRow,
  ReviewReplyRow,
  ReviewRow,
} from "@/lib/supabase/types";

const { createSupabaseServerClientMock, redirectMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/features/reviews/components/ReplyComposer", () => ({
  ReplyComposer: () => <div data-testid="reply-composer" />,
}));

import GuideReviewsPage from "./page";

type RawReview = ReviewRow & {
  review_ratings_breakdown: ReviewRatingsBreakdownRow[] | null;
  review_replies: ReviewReplyRow[] | null;
};

const guideId = "00000000-0000-4000-8000-000000000001";

function makeBreakdown(reviewId: string): ReviewRatingsBreakdownRow[] {
  return [
    { review_id: reviewId, axis: "material", score: 5 },
    { review_id: reviewId, axis: "engagement", score: 5 },
    { review_id: reviewId, axis: "knowledge", score: 5 },
    { review_id: reviewId, axis: "route", score: 5 },
  ];
}

function makeReview(id: string, body: string): RawReview {
  return {
    id,
    listing_id: null,
    guide_id: guideId,
    traveler_id: "00000000-0000-4000-8000-000000000002",
    rating: 5,
    body,
    status: "published",
    created_at: "2026-06-03T00:00:00.000Z",
    review_ratings_breakdown: makeBreakdown(id),
    review_replies: null,
  };
}

function makeSupabaseClient(reviews: RawReview[]) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: guideId } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: reviews }),
          })),
        })),
      })),
    })),
  };
}

describe("GuideReviewsPage", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
    redirectMock.mockReset();
  });

  it("renders one review item per published guide review", async () => {
    createSupabaseServerClientMock.mockResolvedValue(
      makeSupabaseClient([
        makeReview("00000000-0000-4000-8000-000000000101", "Первый отзыв"),
        makeReview("00000000-0000-4000-8000-000000000102", "Второй отзыв"),
      ]),
    );

    render(await GuideReviewsPage());

    expect(screen.getByRole("heading", { level: 1, name: "Отзывы" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Первый отзыв")).toBeInTheDocument();
    expect(screen.getByText("Второй отзыв")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalledWith("/guide");
  });

  it("renders the empty state when the guide has no reviews", async () => {
    createSupabaseServerClientMock.mockResolvedValue(makeSupabaseClient([]));

    render(await GuideReviewsPage());

    expect(screen.getByText("Отзывов пока нет")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalledWith("/guide");
  });
});
