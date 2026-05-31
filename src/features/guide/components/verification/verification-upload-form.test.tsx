import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VerificationUploadForm } from "./verification-upload-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

const actions = {
  getUploadUrl: vi.fn().mockResolvedValue({
    ok: true,
    path: "guide/file.jpg",
    token: "token",
    signedUrl: "https://example.com/upload",
  }),
  confirmGuideAssetUpload: vi.fn(),
  confirmDocumentUpload: vi.fn(),
  submitForVerification: vi.fn().mockResolvedValue({ ok: true, status: "submitted" as const }),
};

describe("VerificationUploadForm", () => {
  it("renders upload slots for passport, selfie, and certificate documents", () => {
    render(<VerificationUploadForm initialDocuments={[]} actions={actions} />);

    expect(screen.getByText("Паспорт")).toBeInTheDocument();
    expect(screen.getByText("Селфи с документом")).toBeInTheDocument();
    expect(screen.getByText("Сертификат / аттестат")).toBeInTheDocument();
  });
});
