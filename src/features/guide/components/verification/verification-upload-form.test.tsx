import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VerificationUploadForm } from "./verification-upload-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

const actions = {
  getUploadUrl: vi.fn(),
  confirmGuideAssetUpload: vi.fn(),
  confirmDocumentUpload: vi.fn(),
  submitForVerification: vi.fn(),
};

describe("VerificationUploadForm", () => {
  it("renders upload slots for passport, selfie, and certificate documents", () => {
    render(<VerificationUploadForm initialDocuments={[]} actions={actions} />);

    expect(screen.getByText("Паспорт")).toBeInTheDocument();
    expect(screen.getByText("Селфи с документом")).toBeInTheDocument();
    expect(screen.getByText("Сертификат / аттестат")).toBeInTheDocument();
  });
});
