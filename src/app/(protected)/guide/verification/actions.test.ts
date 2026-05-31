import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPresignedUploadUrl, confirmUpload, getSession } = vi.hoisted(() => ({
  getPresignedUploadUrl: vi.fn(),
  confirmUpload: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@/lib/storage/upload", () => ({
  getPresignedUploadUrl,
  confirmUpload,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getSession },
    from: vi.fn(),
  })),
}));

import {
  confirmGuideAssetUpload,
  getUploadUrl,
} from "./actions";

describe("guide verification actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({
      data: { session: { user: { id: "11111111-1111-4111-8111-111111111111" } } },
    });
  });

  it("returns signed upload url on success", async () => {
    getPresignedUploadUrl.mockResolvedValue({
      path: "11111111-1111-4111-8111-111111111111/file.jpg",
      token: "token",
      signedUrl: "https://example.com/upload",
    });

    const result = await getUploadUrl("guide-documents", "passport.jpg", "image/jpeg");

    expect(result).toEqual({
      ok: true,
      path: "11111111-1111-4111-8111-111111111111/file.jpg",
      token: "token",
      signedUrl: "https://example.com/upload",
    });
  });

  it("returns Russian error instead of throwing when asset confirm upsert fails", async () => {
    confirmUpload.mockRejectedValue(
      new Error(
        'there is no unique or exclusion constraint matching the ON CONFLICT specification',
      ),
    );

    const result = await confirmGuideAssetUpload({
      bucketId: "guide-documents",
      objectPath: "11111111-1111-4111-8111-111111111111/file.jpg",
      assetKind: "guide-document",
      mimeType: "image/jpeg",
      byteSize: 1024,
    });

    expect(result).toEqual({
      error: "Не удалось сохранить файл. Попробуйте ещё раз.",
    });
  });

  it("returns validation message for invalid bucket", async () => {
    const result = await getUploadUrl("listing-media", "file.jpg", "image/jpeg");

    expect(result).toEqual({
      error: "Проверьте тип и размер файла (JPG, PNG, WEBP или PDF до 10 МБ).",
    });
    expect(getPresignedUploadUrl).not.toHaveBeenCalled();
  });
});
