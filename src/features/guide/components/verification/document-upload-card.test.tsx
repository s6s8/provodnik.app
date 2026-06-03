import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentUploadCard } from "./document-upload-card";

const storageRemove = vi.fn();

vi.mock("@/lib/storage/client-upload", () => ({
  uploadFileToSignedUrl: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        remove: storageRemove,
      })),
    },
  })),
}));

describe("DocumentUploadCard", () => {
  beforeEach(() => {
    storageRemove.mockResolvedValue({ data: [], error: null });
  });

  it("locks the file input and replace control after verification is submitted", () => {
    const onRequestUploadUrl = vi.fn();
    const onConfirmAsset = vi.fn();
    const onLinkDocument = vi.fn();
    const onUploadComplete = vi.fn();

    render(
      <DocumentUploadCard
        label="Паспорт"
        documentType="passport"
        verificationStatus="submitted"
        initialDocument={{
          assetId: "asset-1",
          documentType: "passport",
          objectPath: "guide/passport.jpg",
          fileName: "passport.jpg",
          status: "submitted",
        }}
        onUploadComplete={onUploadComplete}
        onRequestUploadUrl={onRequestUploadUrl}
        onConfirmAsset={onConfirmAsset}
        onLinkDocument={onLinkDocument}
      />,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const replaceButton = screen.getByRole("button");

    expect(input).toBeDisabled();
    expect(replaceButton).toBeDisabled();
  });

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

  it("deletes the uploaded object when document linking fails", async () => {
    const onRequestUploadUrl = vi.fn().mockResolvedValue({
      ok: true,
      path: "10000000-0000-4000-8000-000000000001/passport.jpg",
      token: "token",
      signedUrl: "https://example.com/upload",
    });
    const onConfirmAsset = vi.fn().mockResolvedValue({
      ok: true,
      id: "asset-1",
      objectPath: "10000000-0000-4000-8000-000000000001/passport.jpg",
      mimeType: "image/jpeg",
      byteSize: 8,
    });
    const onLinkDocument = vi.fn().mockResolvedValue({
      error: "Не удалось привязать документ к профилю гида.",
    });
    const onDeleteUploadedObject = vi.fn().mockResolvedValue({ ok: true });
    const onUploadComplete = vi.fn();

    render(
      <DocumentUploadCard
        label="Паспорт"
        documentType="passport"
        onUploadComplete={onUploadComplete}
        onRequestUploadUrl={onRequestUploadUrl}
        onConfirmAsset={onConfirmAsset}
        onLinkDocument={onLinkDocument}
        onDeleteUploadedObject={onDeleteUploadedObject}
      />,
    );

    const file = new File(["passport"], "passport.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onDeleteUploadedObject).toHaveBeenCalledWith({
        bucketId: "guide-documents",
        objectPath: "10000000-0000-4000-8000-000000000001/passport.jpg",
      });
    });
    expect(onUploadComplete).not.toHaveBeenCalled();
  });

  it("removes the uploaded guide document through storage when no cleanup callback is provided", async () => {
    const onRequestUploadUrl = vi.fn().mockResolvedValue({
      ok: true,
      path: "10000000-0000-4000-8000-000000000001/passport.jpg",
      token: "token",
      signedUrl: "https://example.com/upload",
    });
    const onConfirmAsset = vi.fn().mockResolvedValue({
      ok: true,
      id: "asset-1",
      objectPath: "10000000-0000-4000-8000-000000000001/passport.jpg",
      mimeType: "image/jpeg",
      byteSize: 8,
    });
    const onLinkDocument = vi.fn().mockResolvedValue({
      error: "Не удалось привязать документ к профилю гида.",
    });
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
      expect(storageRemove).toHaveBeenCalledWith([
        "10000000-0000-4000-8000-000000000001/passport.jpg",
      ]);
    });
    expect(onUploadComplete).not.toHaveBeenCalled();
  });
});
