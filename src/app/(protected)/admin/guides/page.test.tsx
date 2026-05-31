import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GuideReviewQueueItem } from "@/lib/supabase/moderation";
import type { GuideProfileRow, Uuid } from "@/lib/supabase/types";

const { getGuideReviewQueueMock } = vi.hoisted(() => ({
  getGuideReviewQueueMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/moderation", () => ({
  ensureOpenModerationCase: vi.fn(),
  getGuideReviewQueue: getGuideReviewQueueMock,
  performModerationAction: vi.fn(),
  requireAdminSession: vi.fn(),
}));

import AdminGuidesPage from "./page";

function makeGuideProfile(
  userId: string,
  verificationStatus: GuideProfileRow["verification_status"],
): GuideProfileRow {
  return {
    user_id: userId as Uuid,
    slug: userId,
    bio: null,
    years_experience: null,
    specialization: null,
    rating: 0,
    completed_tours: 0,
    is_available: true,
    regions: ["Карелия"],
    languages: ["Русский"],
    specialties: [],
    specializations: [],
    attestation_status: null,
    verification_status: verificationStatus,
    verification_notes: null,
    payout_account_label: null,
    created_at: "2026-05-01T10:00:00.000Z",
    updated_at: "2026-05-02T10:00:00.000Z",
    legal_status: null,
    inn: null,
    document_country: null,
    is_tour_operator: false,
    tour_operator_registry_number: null,
    average_rating: 0,
    response_rate: 0,
    review_count: 0,
    contact_visibility_unlocked: false,
    locale: "ru",
    preferred_currency: "RUB",
    notification_prefs: {},
    base_city: null,
    max_group_size: null,
  };
}

function makeQueueItem(
  userId: string,
  verificationStatus: GuideProfileRow["verification_status"],
): GuideReviewQueueItem {
  return {
    profile: makeGuideProfile(userId, verificationStatus),
    account: {
      id: userId as Uuid,
      full_name: "Ирина Петрова",
      email: "irina@example.com",
      avatar_url: null,
    },
    latest_case: null,
    latest_action: null,
  };
}

describe("AdminGuidesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the non-draft queue by default and renders diagnostic filters", async () => {
    getGuideReviewQueueMock.mockResolvedValueOnce([
      makeQueueItem("submitted-guide", "submitted"),
    ]);

    const ui = await AdminGuidesPage({
      searchParams: Promise.resolve({}),
    });
    render(ui);

    expect(getGuideReviewQueueMock).toHaveBeenCalledWith({ view: "all" });
    expect(screen.getByRole("link", { name: "Все" })).toHaveAttribute(
      "href",
      "/admin/guides",
    );
    expect(screen.getByRole("link", { name: "Черновики" })).toHaveAttribute(
      "href",
      "/admin/guides?view=drafts",
    );
    expect(screen.getByText("На проверке")).toBeInTheDocument();
  });

  it("uses the drafts view from search params", async () => {
    getGuideReviewQueueMock.mockResolvedValueOnce([makeQueueItem("draft-guide", "draft")]);

    const ui = await AdminGuidesPage({
      searchParams: Promise.resolve({ view: "drafts" }),
    });
    render(ui);

    expect(getGuideReviewQueueMock).toHaveBeenCalledWith({ view: "drafts" });
    expect(screen.getByText("Черновик")).toBeInTheDocument();
  });

  it("falls back to the non-draft queue for invalid view params", async () => {
    getGuideReviewQueueMock.mockResolvedValueOnce([]);

    const ui = await AdminGuidesPage({
      searchParams: Promise.resolve({ view: "unknown" }),
    });
    render(ui);

    expect(getGuideReviewQueueMock).toHaveBeenCalledWith({ view: "all" });
    expect(screen.getByText("Нет анкет в очереди верификации.")).toBeInTheDocument();
  });

  it("shows a drafts-specific empty state", async () => {
    getGuideReviewQueueMock.mockResolvedValueOnce([]);

    const ui = await AdminGuidesPage({
      searchParams: Promise.resolve({ view: "drafts" }),
    });
    render(ui);

    expect(screen.getByText("Нет черновиков анкет гидов.")).toBeInTheDocument();
  });
});
