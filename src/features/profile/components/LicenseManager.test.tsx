import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("@/features/profile/actions/licenseActions", () => ({
  deleteLicense: vi.fn(),
}));

import { LicenseManager, type GuideLicenseView } from "./LicenseManager";

const sampleLicense: GuideLicenseView = {
  id: "lic-1",
  licenseType: "Региональная",
  licenseNumber: "123",
  issuedBy: "Минтуризм",
  validUntil: null,
  scopeMode: "all",
  listingTitles: [],
};

describe("LicenseManager", () => {
  it("does not render a duplicate section heading for qualification documents", () => {
    render(<LicenseManager licenses={[sampleLicense]} />);

    expect(
      screen.queryByRole("heading", { name: "Документ о квалификации" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Региональная" })).toBeInTheDocument();
  });
});
