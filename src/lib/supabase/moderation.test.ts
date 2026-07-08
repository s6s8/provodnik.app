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

import {
  buildGuideApprovalUpdate,
  getGuideReviewQueue,
  getPendingListingReviews,
} from "./moderation";
import type { GuideProfileRow, ListingRow, Uuid } from "./types";

describe("buildGuideApprovalUpdate", () => {
  it("first approval (previously submitted) publishes and backfills a slug", () => {
    const payload = buildGuideApprovalUpdate(
      { slug: null, display_name: "Иван Гид", verification_status: "submitted" },
      "guide-1",
    );
    expect(payload.verification_status).toBe("approved");
    expect(payload.is_available).toBe(true);
    expect(typeof payload.slug).toBe("string");
  });

  it("re-approving an already-approved self-paused guide does NOT touch is_available or slug", () => {
    const payload = buildGuideApprovalUpdate(
      { slug: "ivan-guide", display_name: "Иван Гид", verification_status: "approved" },
      "guide-1",
    );
    expect(payload).toEqual({ verification_status: "approved" });
    expect("is_available" in payload).toBe(false);
    expect("slug" in payload).toBe(false);
  });
});

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
    guide_type: null,
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

  it("returns only submitted guide profiles in the default review queue", async () => {
    const submitted = makeGuideProfile(
      "submitted-guide",
      "submitted",
      "2026-05-03T10:00:00.000Z",
    );
    const guideProfilesQuery = makeQuery({
      data: [submitted],
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

    expect(queue.map((item) => item.profile.user_id)).toEqual(["submitted-guide"]);
    expect(queue.every((item) => item.profile.verification_status === "submitted")).toBe(true);
    expect(guideProfilesQuery.eq).toHaveBeenCalledWith("verification_status", "submitted");
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

  it("denies guide review when admin signal comes only from user_metadata (profile row absent, app_metadata empty)", async () => {
    const submitted = makeGuideProfile(
      "submitted-guide",
      "submitted",
      "2026-05-03T10:00:00.000Z",
    );
    const guideProfilesQuery = makeQuery({
      data: [submitted],
      error: null,
    });
    const profilesQuery = makeQuery({ data: [], error: null });
    const casesQuery = makeQuery({ data: [], error: null });
    const actionsQuery = makeQuery({ data: [], error: null });

    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "admin-id",
              email: "admin@example.com",
              user_metadata: { role: "admin" },
              app_metadata: {},
            },
          },
          error: null,
        }),
      },
      from: vi.fn(() =>
        makeQuery({
          data: null,
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

    await expect(getGuideReviewQueue()).rejects.toThrow("Доступ только для администраторов.");
  });

  it("allows guide review when profiles.role is admin and JWT is stale guide", async () => {
    const submitted = makeGuideProfile(
      "submitted-guide",
      "submitted",
      "2026-05-03T10:00:00.000Z",
    );
    const guideProfilesQuery = makeQuery({
      data: [submitted],
      error: null,
    });
    const profilesQuery = makeQuery({ data: [], error: null });
    const casesQuery = makeQuery({ data: [], error: null });
    const actionsQuery = makeQuery({ data: [], error: null });

    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "admin-id",
              email: "admin@example.com",
              user_metadata: { role: "guide" },
              app_metadata: { role: "guide" },
            },
          },
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

    expect(queue).toHaveLength(1);
    expect(queue[0]?.profile.user_id).toBe("submitted-guide");
  });
});

function makeListing(id: string, status: ListingRow["status"]): ListingRow {
  return {
    id: id as Uuid,
    guide_id: "guide-1" as Uuid,
    slug: id,
    title: `Listing ${id}`,
    region: "Москва",
    city: null,
    category: "excursion",
    route_summary: null,
    description: null,
    duration_minutes: 120,
    max_group_size: 8,
    price_from_minor: 500_000,
    currency: "RUB",
    private_available: true,
    group_available: true,
    instant_book: false,
    meeting_point: null,
    inclusions: [],
    exclusions: [],
    cancellation_policy_key: "flexible",
    status,
    featured_rank: null,
    image_url: null,
    created_at: "2026-05-01T10:00:00.000Z",
    updated_at: "2026-05-02T10:00:00.000Z",
    exp_type: "excursion",
    format: "group",
    movement_type: null,
    languages: ["ru"],
    currencies: ["RUB"],
    idea: null,
    route: null,
    theme: null,
    audience: null,
    facts: null,
    org_details: null,
    difficulty_level: null,
    included: [],
    not_included: [],
    accommodation: null,
    deposit_rate: 0,
    pickup_point_text: null,
    dropoff_point_text: null,
    vehicle_type: null,
    baggage_allowance: null,
    pii_gate_rate: 0,
    booking_cutoff_hours: 24,
    event_span_hours: null,
    instant_booking: false,
    average_rating: 0,
    review_count: 0,
  };
}

function mockAdminClients(tables: Record<string, ReturnType<typeof makeQuery>>) {
  createSupabaseServerClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "admin-id",
            email: "admin@example.com",
            user_metadata: { role: "admin" },
            app_metadata: {},
          },
        },
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
      const query = tables[table];
      if (query) return query;
      throw new Error(`Unexpected table: ${table}`);
    }),
  });
}

describe("getPendingListingReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("excludes draft listings that were not submitted for review", async () => {
    const pendingReview = makeListing("pending-listing", "pending_review");
    const listingsQuery = makeQuery({ data: [pendingReview], error: null });
    const casesQuery = makeQuery({ data: [], error: null });
    const profilesQuery = makeQuery({ data: [], error: null });
    const guideProfilesQuery = makeQuery({ data: [], error: null });
    const actionsQuery = makeQuery({ data: [], error: null });

    mockAdminClients({
      listings: listingsQuery,
      moderation_cases: casesQuery,
      profiles: profilesQuery,
      guide_profiles: guideProfilesQuery,
      moderation_actions: actionsQuery,
    });

    const rows = await getPendingListingReviews();

    expect(rows.map((row) => row.listing.id)).toEqual(["pending-listing"]);
    expect(listingsQuery.eq).toHaveBeenCalledWith("status", "pending_review");
  });

  it("excludes published listings tied only to stale open moderation cases", async () => {
    const pendingListingsQuery = makeQuery({ data: [], error: null });
    const casesQuery = makeQuery({
      data: [
        {
          id: "case-1" as Uuid,
          subject_type: "listing",
          guide_id: "guide-1" as Uuid,
          listing_id: "published-listing" as Uuid,
          review_id: null,
          opened_by: null,
          assigned_admin_id: null,
          status: "open",
          queue_reason: "Проверка",
          risk_flags: [],
          created_at: "2026-05-01T10:00:00.000Z",
          updated_at: "2026-05-01T10:00:00.000Z",
        },
      ],
      error: null,
    });

    mockAdminClients({
      listings: pendingListingsQuery,
      moderation_cases: casesQuery,
      profiles: makeQuery({ data: [], error: null }),
      guide_profiles: makeQuery({ data: [], error: null }),
      moderation_actions: makeQuery({ data: [], error: null }),
    });

    const rows = await getPendingListingReviews();

    expect(rows).toEqual([]);
    expect(pendingListingsQuery.eq).toHaveBeenCalledWith("status", "pending_review");
  });

  it("attaches open moderation cases to pending_review listings", async () => {
    const pendingReview = makeListing("pending-listing", "pending_review");
    const pendingListingsQuery = makeQuery({ data: [pendingReview], error: null });
    const casesQuery = makeQuery({
      data: [
        {
          id: "case-1" as Uuid,
          subject_type: "listing",
          guide_id: "guide-1" as Uuid,
          listing_id: "pending-listing" as Uuid,
          review_id: null,
          opened_by: null,
          assigned_admin_id: null,
          status: "open",
          queue_reason: "Проверка",
          risk_flags: [],
          created_at: "2026-05-01T10:00:00.000Z",
          updated_at: "2026-05-01T10:00:00.000Z",
        },
      ],
      error: null,
    });

    mockAdminClients({
      listings: pendingListingsQuery,
      moderation_cases: casesQuery,
      profiles: makeQuery({ data: [], error: null }),
      guide_profiles: makeQuery({ data: [], error: null }),
      moderation_actions: makeQuery({ data: [], error: null }),
    });

    const rows = await getPendingListingReviews();

    expect(rows).toHaveLength(1);
    expect(rows[0]?.listing.id).toBe("pending-listing");
    expect(rows[0]?.moderation_case?.id).toBe("case-1");
  });
});
