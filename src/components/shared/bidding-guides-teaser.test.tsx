import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { BiddingGuide } from "@/lib/supabase/requests-public";

import { BiddingGuidesTeaser } from "./bidding-guides-teaser";

const guides: BiddingGuide[] = [
  {
    user_id: "g1",
    full_name: "Тамара Кикнадзе",
    avatar_url: null,
    average_rating: 4.9,
    review_count: 42,
    slug: "tamara",
  },
  {
    user_id: "g2",
    full_name: "Георгий Беридзе",
    avatar_url: null,
    average_rating: 4.7,
    review_count: 18,
    slug: "georgiy",
  },
  {
    user_id: "g3",
    full_name: "Нино Гелашвили",
    avatar_url: null,
    average_rating: 5,
    review_count: 7,
    slug: "nino",
  },
];

describe("BiddingGuidesTeaser", () => {
  it("renders the bidding guides with the count line and ratings", () => {
    render(<BiddingGuidesTeaser guides={guides} />);

    for (const guide of guides) {
      expect(screen.getByText(guide.full_name as string)).toBeInTheDocument();
    }

    expect(screen.getByText(/проверенных гида/)).toBeInTheDocument();
    expect(screen.getByText(/4\.9/)).toBeInTheDocument();
  });

  it("renders nothing when there are no bidding guides", () => {
    const { container } = render(<BiddingGuidesTeaser guides={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
