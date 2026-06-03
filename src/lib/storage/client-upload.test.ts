import { describe, expect, it, vi } from "vitest";

const uploadToSignedUrlMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    storage: {
      from: vi.fn(() => ({
        uploadToSignedUrl: uploadToSignedUrlMock,
      })),
    },
  }),
}));

import { uploadFileToSignedUrl } from "./client-upload";

describe("uploadFileToSignedUrl", () => {
  it("uploads with the Supabase signed-upload helper", async () => {
    uploadToSignedUrlMock.mockResolvedValue({ data: { path: "user-1/file.pdf" }, error: null });
    const file = new File(["passport"], "passport.pdf", { type: "application/pdf" });
    const onProgress = vi.fn();

    await uploadFileToSignedUrl({
      signedUrl:
        "https://project.supabase.co/storage/v1/object/upload/sign/guide-documents/user-1/file.pdf?token=signed-token",
      file,
      onProgress,
    });

    expect(uploadToSignedUrlMock).toHaveBeenCalledWith(
      "user-1/file.pdf",
      "signed-token",
      file,
      { cacheControl: "3600", upsert: false },
    );
    expect(onProgress).toHaveBeenCalledWith(100);
  });

  it("surfaces Supabase upload errors", async () => {
    uploadToSignedUrlMock.mockResolvedValue({
      data: null,
      error: new Error("storage rejected"),
    });

    await expect(
      uploadFileToSignedUrl({
        signedUrl:
          "https://project.supabase.co/storage/v1/object/upload/sign/guide-documents/user-1/file.pdf?token=signed-token",
        file: new File(["passport"], "passport.pdf", { type: "application/pdf" }),
      }),
    ).rejects.toThrow("Хранилище вернуло ошибку при загрузке файла.");
  });
});
