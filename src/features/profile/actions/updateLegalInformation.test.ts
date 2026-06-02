import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const fromMock = vi.fn();
const updateGuideProfileMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  })),
}));

import { updateLegalInformation } from "./updateLegalInformation";

function guideProfileQuery(verificationStatus: "approved" | "draft") {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { verification_status: verificationStatus },
        }),
      })),
    })),
    update: updateGuideProfileMock,
  };
}

const legalInformation = {
  legalStatus: "self_employed",
  inn: "123456789012",
  documentCountry: "RU",
  isTourOperator: false,
  tourOperatorRegistryNumber: null,
};

describe("updateLegalInformation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({
      data: { user: { id: "g-guide-1" } },
    });
  });

  it("blocks legal information changes for an approved guide profile", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "guide_profiles") return guideProfileQuery("approved");
      throw new Error(`unexpected table: ${table}`);
    });

    await expect(updateLegalInformation(legalInformation)).rejects.toThrow("Профиль одобрен");

    expect(updateGuideProfileMock).not.toHaveBeenCalled();
  });

  it("updates legal information while the guide profile is not approved", async () => {
    const eqAfterUpdate = vi.fn().mockResolvedValue({ error: null });
    updateGuideProfileMock.mockReturnValue({ eq: eqAfterUpdate });
    fromMock.mockImplementation((table: string) => {
      if (table === "guide_profiles") return guideProfileQuery("draft");
      throw new Error(`unexpected table: ${table}`);
    });

    await expect(updateLegalInformation(legalInformation)).resolves.toEqual({ success: true });

    expect(updateGuideProfileMock).toHaveBeenCalledWith({
      legal_status: "self_employed",
      inn: "123456789012",
      document_country: "RU",
      is_tour_operator: false,
      tour_operator_registry_number: null,
    });
    expect(eqAfterUpdate).toHaveBeenCalledWith("user_id", "g-guide-1");
  });
});
