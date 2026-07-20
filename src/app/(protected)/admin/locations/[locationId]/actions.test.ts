import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminSession,
  beginLocationMediaUpload,
  confirmLocationMediaUpload,
  cancelLocationMediaUpload,
  updateLocationMedia,
  deleteLocationMedia,
  getPresignedUploadUrl,
} = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  beginLocationMediaUpload: vi.fn(),
  confirmLocationMediaUpload: vi.fn(),
  cancelLocationMediaUpload: vi.fn(),
  updateLocationMedia: vi.fn(),
  deleteLocationMedia: vi.fn(),
  getPresignedUploadUrl: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/moderation", () => ({ requireAdminSession }));
vi.mock("@/lib/storage/upload", () => ({ getPresignedUploadUrl }));
vi.mock("@/lib/supabase/location-media", async () => {
  const actual = await vi.importActual<typeof import("@/lib/supabase/location-media")>(
    "@/lib/supabase/location-media",
  );
  return {
    ...actual,
    beginLocationMediaUpload,
    confirmLocationMediaUpload,
    cancelLocationMediaUpload,
    updateLocationMedia,
    deleteLocationMedia,
  };
});

import {
  cancelLocationMediaUploadAction,
  confirmLocationMediaUploadAction,
  deleteLocationMediaAction,
  startLocationMediaUploadAction,
  updateLocationMediaAction,
} from "./actions";

const LOCATION_ID = "11111111-1111-4111-8111-111111111111";
const MEDIA_ID = "22222222-2222-4222-8222-222222222222";
const ADMIN_ID = "33333333-3333-4333-8333-333333333333";

const VALID_START = {
  locationId: LOCATION_ID,
  fileName: "cover.jpg",
  mimeType: "image/jpeg" as const,
  byteSize: 1024,
  width: 1600,
  height: 900,
  role: "cover" as const,
  altText: "Казанский кремль",
  caption: "Вид с реки",
  source: "Куратор",
};

function asAdmin() {
  requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: {} });
}

function asNonAdmin() {
  requireAdminSession.mockRejectedValue(new Error("Доступ только для администраторов."));
}

beforeEach(() => {
  vi.clearAllMocks();
  getPresignedUploadUrl.mockResolvedValue({
    path: `${ADMIN_ID}/cover.jpg`,
    token: "t",
    signedUrl: "https://storage.test/upload",
  });
  beginLocationMediaUpload.mockResolvedValue(MEDIA_ID);
});

describe("location media authorization boundary", () => {
  it("refuses every write for a non-admin", async () => {
    asNonAdmin();

    const results = await Promise.all([
      startLocationMediaUploadAction(VALID_START),
      confirmLocationMediaUploadAction(LOCATION_ID, MEDIA_ID),
      cancelLocationMediaUploadAction(LOCATION_ID, MEDIA_ID),
      updateLocationMediaAction(LOCATION_ID, MEDIA_ID, { status: "published" }),
      deleteLocationMediaAction(LOCATION_ID, MEDIA_ID),
    ]);

    expect(results.every((r) => r.ok === false)).toBe(true);
    expect(getPresignedUploadUrl).not.toHaveBeenCalled();
    expect(beginLocationMediaUpload).not.toHaveBeenCalled();
    expect(confirmLocationMediaUpload).not.toHaveBeenCalled();
    expect(cancelLocationMediaUpload).not.toHaveBeenCalled();
    expect(updateLocationMedia).not.toHaveBeenCalled();
    expect(deleteLocationMedia).not.toHaveBeenCalled();
  });
});

describe("startLocationMediaUploadAction", () => {
  beforeEach(asAdmin);

  it("reserves the row with its editorial metadata before returning an upload URL", async () => {
    const result = await startLocationMediaUploadAction(VALID_START);

    expect(result).toEqual({
      ok: true,
      mediaId: MEDIA_ID,
      signedUrl: "https://storage.test/upload",
    });
    expect(beginLocationMediaUpload).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        objectPath: `${ADMIN_ID}/cover.jpg`,
        altText: "Казанский кремль",
        caption: "Вид с реки",
        source: "Куратор",
        width: 1600,
        height: 900,
        mimeType: "image/jpeg",
        byteSize: 1024,
        createdBy: ADMIN_ID,
      }),
    );
  });

  it("never leaks the raw object path to the browser", async () => {
    const result = await startLocationMediaUploadAction(VALID_START);

    expect(result).not.toHaveProperty("path");
  });

  it("rejects a disallowed mime type before signing anything", async () => {
    const result = await startLocationMediaUploadAction({
      ...VALID_START,
      mimeType: "application/pdf" as never,
    });

    expect(result).toEqual({ ok: false, error: "Разрешены только JPG, PNG или WEBP." });
    expect(getPresignedUploadUrl).not.toHaveBeenCalled();
    expect(beginLocationMediaUpload).not.toHaveBeenCalled();
  });

  it("rejects a file over the bucket limit server-side", async () => {
    const result = await startLocationMediaUploadAction({
      ...VALID_START,
      byteSize: 5 * 1024 * 1024 + 1,
    });

    expect(result).toEqual({ ok: false, error: "Файл превышает лимит 5 МБ." });
    expect(beginLocationMediaUpload).not.toHaveBeenCalled();
  });

  it("rejects non-positive pixel dimensions", async () => {
    const result = await startLocationMediaUploadAction({ ...VALID_START, width: 0 });

    expect(result.ok).toBe(false);
    expect(beginLocationMediaUpload).not.toHaveBeenCalled();
  });
});

describe("confirmLocationMediaUploadAction", () => {
  beforeEach(asAdmin);

  it("confirms the reservation for a valid id", async () => {
    confirmLocationMediaUpload.mockResolvedValue(undefined);

    expect(await confirmLocationMediaUploadAction(LOCATION_ID, MEDIA_ID)).toEqual({
      ok: true,
    });
    expect(confirmLocationMediaUpload).toHaveBeenCalledWith({}, MEDIA_ID);
  });

  it("rejects a malformed media id before touching the data layer", async () => {
    const result = await confirmLocationMediaUploadAction(LOCATION_ID, "not-a-uuid");

    expect(result.ok).toBe(false);
    expect(confirmLocationMediaUpload).not.toHaveBeenCalled();
  });
});

describe("cancelLocationMediaUploadAction", () => {
  beforeEach(asAdmin);

  it("cancels the reservation so no unmanaged object survives", async () => {
    cancelLocationMediaUpload.mockResolvedValue(undefined);

    expect(await cancelLocationMediaUploadAction(LOCATION_ID, MEDIA_ID)).toEqual({ ok: true });
    expect(cancelLocationMediaUpload).toHaveBeenCalledWith({}, MEDIA_ID);
  });

  it("surfaces a cancellation failure rather than pretending it worked", async () => {
    cancelLocationMediaUpload.mockRejectedValue(new Error("boom"));

    expect(await cancelLocationMediaUploadAction(LOCATION_ID, MEDIA_ID)).toEqual({
      ok: false,
      error: "boom",
    });
  });
});

describe("updateLocationMediaAction", () => {
  beforeEach(asAdmin);

  it("publishes as a cover when a row is promoted to primary", async () => {
    updateLocationMedia.mockResolvedValue(undefined);

    await updateLocationMediaAction(LOCATION_ID, MEDIA_ID, { isPrimary: true });

    expect(updateLocationMedia).toHaveBeenCalledWith({}, MEDIA_ID, {
      isPrimary: true,
      status: "published",
      role: "cover",
    });
  });

  it("clears the primary flag when unpublishing — a hidden row cannot stay primary", async () => {
    updateLocationMedia.mockResolvedValue(undefined);

    await updateLocationMediaAction(LOCATION_ID, MEDIA_ID, { status: "draft" });

    expect(updateLocationMedia).toHaveBeenCalledWith({}, MEDIA_ID, {
      status: "draft",
      isPrimary: false,
    });
  });

  it("clears the primary flag when a cover is demoted to gallery", async () => {
    updateLocationMedia.mockResolvedValue(undefined);

    await updateLocationMediaAction(LOCATION_ID, MEDIA_ID, { role: "gallery" });

    expect(updateLocationMedia).toHaveBeenCalledWith({}, MEDIA_ID, {
      role: "gallery",
      isPrimary: false,
    });
  });

  it("refuses to set the internal uploading status through the generic patch", async () => {
    const result = await updateLocationMediaAction(LOCATION_ID, MEDIA_ID, {
      status: "uploading" as never,
    });

    expect(result.ok).toBe(false);
    expect(updateLocationMedia).not.toHaveBeenCalled();
  });

  it("rejects a malformed media id before touching the data layer", async () => {
    const result = await updateLocationMediaAction(LOCATION_ID, "not-a-uuid", {
      status: "published",
    });

    expect(result.ok).toBe(false);
    expect(updateLocationMedia).not.toHaveBeenCalled();
  });
});

describe("deleteLocationMediaAction", () => {
  beforeEach(asAdmin);

  it("reports a storage failure instead of silently dropping the record", async () => {
    deleteLocationMedia.mockRejectedValue(
      new Error("Файл не удалён из хранилища: network"),
    );

    expect(await deleteLocationMediaAction(LOCATION_ID, MEDIA_ID)).toEqual({
      ok: false,
      error: "Файл не удалён из хранилища: network",
    });
  });
});
