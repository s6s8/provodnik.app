import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BookingWithDetails } from "@/lib/supabase/bookings";

const {
  createSupabaseServerClientMock,
  getBookingMock,
  hasSupabaseEnvMock,
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  getBookingMock: vi.fn(),
  hasSupabaseEnvMock: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: hasSupabaseEnvMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/lib/supabase/bookings", () => ({
  getBooking: getBookingMock,
}));

import { viewerRoleForBooking } from "./viewer-role-for-booking";

function makeBooking({
  travelerId,
  guideId,
}: {
  travelerId: string;
  guideId: string;
}) {
  return {
    id: "booking-1",
    traveler_id: travelerId,
    guide_id: guideId,
  } as BookingWithDetails;
}

function makeSupabaseClient({
  userId,
  profileRole,
  appMetadataRole,
}: {
  userId: string | null;
  profileRole: string | null;
  appMetadataRole: string | null;
}) {
  const profileQuery = {
    select: vi.fn(() => profileQuery),
    eq: vi.fn(() => profileQuery),
    maybeSingle: vi.fn().mockResolvedValue({
      data: profileRole ? { role: profileRole } : null,
      error: null,
    }),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: userId
            ? {
                id: userId,
                app_metadata: appMetadataRole ? { role: appMetadataRole } : {},
              }
            : null,
        },
        error: null,
      }),
    },
    from: vi.fn(() => profileQuery),
    profileQuery,
  };
}

describe("viewerRoleForBooking", () => {
  beforeEach(() => {
    hasSupabaseEnvMock.mockReturnValue(true);
    createSupabaseServerClientMock.mockReset();
    getBookingMock.mockReset();
  });

  it("returns traveler when the current user owns the booking", async () => {
    const supabase = makeSupabaseClient({
      userId: "traveler-1",
      profileRole: "traveler",
      appMetadataRole: "traveler",
    });
    createSupabaseServerClientMock.mockResolvedValue(supabase);
    getBookingMock.mockResolvedValue(
      makeBooking({ travelerId: "traveler-1", guideId: "guide-1" }),
    );

    await expect(viewerRoleForBooking("booking-1")).resolves.toBe("traveler");
  });

  it("returns guide when the current user is the booking guide", async () => {
    const supabase = makeSupabaseClient({
      userId: "guide-1",
      profileRole: "guide",
      appMetadataRole: "guide",
    });
    createSupabaseServerClientMock.mockResolvedValue(supabase);
    getBookingMock.mockResolvedValue(
      makeBooking({ travelerId: "traveler-1", guideId: "guide-1" }),
    );

    await expect(viewerRoleForBooking("booking-1")).resolves.toBe("guide");
  });

  it("returns admin when the existing admin role check matches", async () => {
    const supabase = makeSupabaseClient({
      userId: "admin-1",
      profileRole: "admin",
      appMetadataRole: "guide",
    });
    createSupabaseServerClientMock.mockResolvedValue(supabase);
    getBookingMock.mockResolvedValue(
      makeBooking({ travelerId: "traveler-1", guideId: "guide-1" }),
    );

    await expect(viewerRoleForBooking("booking-1")).resolves.toBe("admin");
  });

  it("returns null when the current user has no booking relationship", async () => {
    const supabase = makeSupabaseClient({
      userId: "stranger-1",
      profileRole: "traveler",
      appMetadataRole: "traveler",
    });
    createSupabaseServerClientMock.mockResolvedValue(supabase);
    getBookingMock.mockResolvedValue(
      makeBooking({ travelerId: "traveler-1", guideId: "guide-1" }),
    );

    await expect(viewerRoleForBooking("booking-1")).resolves.toBeNull();
  });
});
