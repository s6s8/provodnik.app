export type ReviewTargetType = "guide" | "listing";

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export type ReviewRecord = {
  id: string;
  createdAt: string;
  author: {
    userId: string;
    displayName: string;
  };
  target: {
    type: ReviewTargetType;
    slug: string;
  };
  rating: ReviewRating;
  title: string;
  body: string;
  tags?: readonly string[];
};

export type ReviewsSummary = {
  averageRating: number;
  totalReviews: number;
  lastReviewAt?: string;
};

