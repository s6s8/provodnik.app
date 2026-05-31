import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseAdminClient, createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseAdminClient: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/lib/notifications/create-notification", () => ({
  createNotification: vi.fn(),
}));

import { getGuideReviewQueue } from "./moderation";
import type { GuideProfileRow, Uuid } from "./types";

function makeGuideProfile(
  userId: string,
  verificationStatus: GuideProfileRow["verification_status"],
  updatedAt: string,
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
    regions: [],
    languages: [],
    specialties: [],
    specializations: [],
    attestation_status: null,
    verification_status: verificationStatus,
    verification_notes: null,
    payout_account_label: null,
    created_at: updatedAt,
    updated_at: updatedAt,
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

function makeQuery<T>(result: { data: T; error: Error | null }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (
      resolve: (value: { data: T; error: Error | null }) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
}

describe("getGuideReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("excludes draft guide profiles from the default queue", async () => {
    const submitted = makeGuideProfile(
      "submitted-guide",
      "submitted",
      "2026-05-03T10:00:00.000Z",
    );
    const draft = makeGuideProfile("draft-guide", "draft", "2026-05-04T10:00:00.000Z");
    const rejected = makeGuideProfile(
      "rejected-guide",
      "rejected",
      "2026-05-05T10:00:00.000Z",
    );
    const approved = makeGuideProfile(
      "approved-guide",
      "approved",
      "2026-05-02T10:00:00.000Z",
    );
    const guideProfilesQuery = makeQuery({
      data: [draft, rejected, submitted, approved],
      error: null,
    });
    const profilesQuery = makeQuery({
      data: [
        {
          id: "submitted-guide",
          full_name: "Анна",
          email: "anna@example.com",
          avatar_url: null,
        },
      ],
      error: null,
    });
    const casesQuery = makeQuery({ data: [], error: null });
    const actionsQuery = makeQuery({ data: [], error: null });

    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-id" } },
          error: null,
        }),
      },
      from: vi.fn(() =>
        makeQuery({
          data: {
            id: "admin-id",
            role: "admin",
            full_name: "Admin",
            email: "admin@example.com",
            avatar_url: null,
          },
          error: null,
        }),
      ),
    });
    createSupabaseAdminClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "guide_profiles") return guideProfilesQuery;
        if (table === "profiles") return profilesQuery;
        if (table === "moderation_cases") return casesQuery;
        if (table === "moderation_actions") return actionsQuery;
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const queue = await getGuideReviewQueue();

    expect(queue.map((item) => item.profile.user_id)).toEqual([
      "submitted-guide",
      "rejected-guide",
      "approved-guide",
    ]);
    expect(queue.map((item) => item.profile.verification_status)).not.toContain("draft");
    expect(guideProfilesQuery.neq).toHaveBeenCalledWith("verification_status", "draft");
  });

  it("returns only drafts for the diagnostic drafts view", async () => {
    const draft = makeGuideProfile("draft-guide", "draft", "2026-05-04T10:00:00.000Z");
    const submitted = makeGuideProfile(
      "submitted-guide",
      "submitted",
      "2026-05-03T10:00:00.000Z",
    );
    const guideProfilesQuery = makeQuery({
      data: [draft, submitted],
      error: null,
    });
    const profilesQuery = makeQuery({ data: [], error: null });
    const casesQuery = makeQuery({ data: [], error: null });
    const actionsQuery = makeQuery({ data: [], error: null });

    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-id" } },
          error: null,
        }),
      },
      from: vi.fn(() =>
        makeQuery({
          data: {
            id: "admin-id",
            role: "admin",
            full_name: "Admin",
            email: "admin@example.com",
            avatar_url: null,
          },
          error: null,
        }),
      ),
    });
    createSupabaseAdminClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "guide_profiles") return guideProfilesQuery;
        if (table === "profiles") return profilesQuery;
        if (table === "moderation_cases") return casesQuery;
        if (table === "moderation_actions") return actionsQuery;
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const queue = await getGuideReviewQueue({ view: "drafts" });

    expect(queue.map((item) => item.profile.user_id)).toEqual(["draft-guide"]);
    expect(queue.every((item) => item.profile.verification_status === "draft")).toBe(true);
    expect(guideProfilesQuery.eq).toHaveBeenCalledWith("verification_status", "draft");
  });
});
