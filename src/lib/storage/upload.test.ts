import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  confirmUpload,
  getPresignedUploadUrl,
  STORAGE_ASSET_UPSERT_ON_CONFLICT,
} from "./upload";

const createSignedUploadUrl = vi.fn();
const upsert = vi.fn();
const select = vi.fn();
const single = vi.fn();
const getUser = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUploadUrl,
      })),
    },
    from: vi.fn(() => ({
      upsert,
    })),
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser,
    },
  })),
}));

describe("storage upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSignedUploadUrl.mockResolvedValue({
      data: {
        token: "signed-token",
        signedUrl: "https://example.test/upload",
      },
      error: null,
    });
    single.mockResolvedValue({
      data: {
        id: "asset-1",
        owner_id: "10000000-0000-4000-8000-000000000001",
        bucket_id: "guide-documents",
        object_path: "10000000-0000-4000-8000-000000000001/file.pdf",
        asset_kind: "guide-document",
        mime_type: "application/pdf",
        byte_size: 128,
        created_at: "2026-06-03T00:00:00Z",
      },
      error: null,
    });
    select.mockReturnValue({ single });
    upsert.mockReturnValue({ select });
    getUser.mockResolvedValue({
      data: {
        user: { id: "10000000-0000-4000-8000-000000000001" },
      },
      error: null,
    });
  });

  it("uses storage_assets unique key columns for upsert onConflict", () => {
    expect(STORAGE_ASSET_UPSERT_ON_CONFLICT).toBe("bucket_id,object_path");
  });

  it("derives upload extension from the validated MIME type", async () => {
    const result = await getPresignedUploadUrl(
      "guide-documents",
      "passport.exe",
      "image/png",
      "10000000-0000-4000-8000-000000000001",
    );

    expect(result.path).toMatch(
      /^10000000-0000-4000-8000-000000000001\/.+\.png$/,
    );
    expect(result.path).not.toContain(".exe");
  });

  it("derives signed upload owner prefix from the authenticated user", async () => {
    const result = await getPresignedUploadUrl(
      "guide-documents",
      "passport.pdf",
      "application/pdf",
      "20000000-0000-4000-8000-000000000002",
    );

    expect(result.path).toMatch(
      /^10000000-0000-4000-8000-000000000001\/.+\.pdf$/,
    );
  });

  it("derives confirmed asset owner from the authenticated user", async () => {
    await confirmUpload({
      ownerId: "20000000-0000-4000-8000-000000000002",
      bucketId: "guide-documents",
      objectPath: "10000000-0000-4000-8000-000000000001/file.pdf",
      assetKind: "guide-document",
      mimeType: "application/pdf",
      byteSize: 128,
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_id: "10000000-0000-4000-8000-000000000001",
      }),
      { onConflict: STORAGE_ASSET_UPSERT_ON_CONFLICT },
    );
  });

  it("rejects object paths outside the authenticated user's prefix", async () => {
    await expect(
      confirmUpload({
        ownerId: "10000000-0000-4000-8000-000000000001",
        bucketId: "guide-documents",
        objectPath: "20000000-0000-4000-8000-000000000002/file.pdf",
        assetKind: "guide-document",
        mimeType: "application/pdf",
        byteSize: 128,
      }),
    ).rejects.toThrow("Путь файла не соответствует текущему пользователю.");

    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects files larger than the configured bucket limit", async () => {
    await expect(
      confirmUpload({
        ownerId: "10000000-0000-4000-8000-000000000001",
        bucketId: "guide-documents",
        objectPath: "10000000-0000-4000-8000-000000000001/file.pdf",
        assetKind: "guide-document",
        mimeType: "application/pdf",
        byteSize: 10 * 1024 * 1024 + 1,
      }),
    ).rejects.toThrow("Файл превышает лимит выбранного бакета.");

    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects object paths whose extension does not match the MIME type", async () => {
    await expect(
      confirmUpload({
        ownerId: "10000000-0000-4000-8000-000000000001",
        bucketId: "guide-documents",
        objectPath: "10000000-0000-4000-8000-000000000001/file.pdf",
        assetKind: "guide-document",
        mimeType: "image/png",
        byteSize: 128,
      }),
    ).rejects.toThrow("Путь файла не соответствует типу файла.");

    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects asset kinds that do not belong to the target bucket", async () => {
    await expect(
      confirmUpload({
        ownerId: "10000000-0000-4000-8000-000000000001",
        bucketId: "listing-media",
        objectPath: "10000000-0000-4000-8000-000000000001/file.png",
        assetKind: "guide-document",
        mimeType: "image/png",
        byteSize: 128,
      }),
    ).rejects.toThrow("Тип файла не соответствует выбранному бакету.");

    expect(upsert).not.toHaveBeenCalled();
  });
});
