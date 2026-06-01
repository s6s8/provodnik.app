import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const fromMock = vi.fn();
const insertLicenseMock = vi.fn();
const deleteLicenseMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  })),
}));

import { addLicense, deleteLicense } from "./licenseActions";

function approvedProfileQuery() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { verification_status: "approved" },
        }),
      })),
    })),
  };
}

describe("licenseActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({
      data: { user: { id: "g-guide-1" } },
    });
    fromMock.mockImplementation((table: string) => {
      if (table === "guide_profiles") return approvedProfileQuery();
      if (table === "guide_licenses") {
        return {
          insert: insertLicenseMock,
          delete: deleteLicenseMock,
        };
      }
      throw new Error(`unexpected table: ${table}`);
    });
  });

  it("blocks adding a qualification document for an approved guide profile", async () => {
    await expect(
      addLicense({
        licenseType: "Свидетельство",
        licenseNumber: "42",
        issuedBy: "Комитет",
        validUntil: null,
        scope: "all",
      }),
    ).rejects.toThrow("Профиль одобрен");

    expect(insertLicenseMock).not.toHaveBeenCalled();
  });

  it("blocks deleting a qualification document for an approved guide profile", async () => {
    await expect(deleteLicense("license-1")).rejects.toThrow("Профиль одобрен");

    expect(deleteLicenseMock).not.toHaveBeenCalled();
  });
});
