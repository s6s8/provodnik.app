import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  beforeEach(() => {
    vi.clearAllMocks();
    actions.submitForVerification.mockResolvedValue({ ok: true, status: "submitted" as const });
  });

  it("renders upload slots for passport, selfie, and certificate documents", () => {
    render(<VerificationUploadForm initialDocuments={[]} actions={actions} />);

    expect(screen.getByText("Паспорт")).toBeInTheDocument();
    expect(screen.getByText("Селфи с документом")).toBeInTheDocument();
    expect(screen.getByText("Сертификат / аттестат")).toBeInTheDocument();
  });

  it("revalidates required linked documents before submitting", async () => {
    render(
      <VerificationUploadForm
        initialDocuments={[
          {
            assetId: "passport-asset",
            documentType: "passport",
            objectPath: "guide/passport.jpg",
            fileName: "passport.jpg",
            status: "draft",
          },
          {
            assetId: "selfie-asset",
            documentType: "selfie",
            objectPath: "guide/selfie.jpg",
            fileName: "selfie.jpg",
            status: "draft",
          },
        ]}
        actions={{
          ...actions,
          listDocuments: vi.fn().mockResolvedValue([
            {
              assetId: "passport-asset",
              documentType: "passport",
              objectPath: "guide/passport.jpg",
              fileName: "passport.jpg",
              status: "draft",
            },
          ]),
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Отправить на проверку" }));

    await waitFor(() => {
      expect(actions.submitForVerification).not.toHaveBeenCalled();
    });
    expect(
      screen.getByText("Загрузите паспорт и селфи с документом перед отправкой."),
    ).toBeInTheDocument();
  });
});
