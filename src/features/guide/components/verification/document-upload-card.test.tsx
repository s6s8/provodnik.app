import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DocumentUploadCard } from "./document-upload-card";

vi.mock("@/lib/storage/client-upload", () => ({
  uploadFileToSignedUrl: vi.fn().mockResolvedValue(undefined),
}));

describe("DocumentUploadCard", () => {
  it("shows Russian server error when asset confirmation fails", async () => {
    const onRequestUploadUrl = vi.fn().mockResolvedValue({
      ok: true,
      path: "guide/file.jpg",
      token: "token",
      signedUrl: "https://example.com/upload",
    });
    const onConfirmAsset = vi.fn().mockResolvedValue({
      error: "Не удалось сохранить файл. Попробуйте ещё раз.",
    });
    const onLinkDocument = vi.fn();
    const onUploadComplete = vi.fn();

    render(
      <DocumentUploadCard
        label="Паспорт"
        documentType="passport"
        onUploadComplete={onUploadComplete}
        onRequestUploadUrl={onRequestUploadUrl}
        onConfirmAsset={onConfirmAsset}
        onLinkDocument={onLinkDocument}
      />,
    );

    const file = new File(["passport"], "passport.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText("Не удалось сохранить файл. Попробуйте ещё раз."),
      ).toBeInTheDocument();
    });

    expect(onUploadComplete).not.toHaveBeenCalled();
  });
});
