import { describe, expect, it, vi } from "vitest";

const {
  createListingMock,
  createSupabaseServerClientMock,
} = vi.hoisted(() => ({
  createListingMock: vi.fn(),
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/lib/supabase/listings", () => ({
  createListing: createListingMock,
  getGuideListing: vi.fn(),
  pauseListing: vi.fn(),
  publishListing: vi.fn(),
  softDeleteListing: vi.fn(),
  updateListing: vi.fn(),
}));

vi.mock("@/lib/storage/upload", () => ({
  confirmUpload: vi.fn(),
  getPresignedUploadUrl: vi.fn(),
  getPublicUrl: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import type { ListingInput } from "@/lib/supabase/listing-schema";

import { createListingAction } from "./actions";

describe("guide listing actions", () => {
  it("uses auth.getUser() for the guide id before creating a listing", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "guide-from-auth" } },
      error: null,
    });
    const getSession = vi.fn();
    createSupabaseServerClientMock.mockResolvedValue({
      auth: { getUser, getSession },
    });
    createListingMock.mockResolvedValue({ id: "listing-1" });

    const input = {} as ListingInput;

    await expect(createListingAction(input)).resolves.toEqual({ id: "listing-1" });
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(getSession).not.toHaveBeenCalled();
    expect(createListingMock).toHaveBeenCalledWith(input, "guide-from-auth");
  });
});
