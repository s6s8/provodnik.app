import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LocationMediaRecord } from "@/lib/supabase/location-media";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/storage/client-upload", () => ({
  uploadFileToSignedUrl: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/app/(protected)/admin/locations/[locationId]/actions", () => ({
  cancelLocationMediaUploadAction: vi.fn(),
  confirmLocationMediaUploadAction: vi.fn(),
  deleteLocationMediaAction: vi.fn(),
  startLocationMediaUploadAction: vi.fn(),
  updateLocationMediaAction: vi.fn(),
}));

import {
  LocationMediaConsole,
  validateLocationMediaFile,
} from "./location-media-console";
import { readImageDimensions } from "./read-image-dimensions";
import { uploadFileToSignedUrl } from "@/lib/storage/client-upload";
import {
  cancelLocationMediaUploadAction,
  confirmLocationMediaUploadAction,
  startLocationMediaUploadAction,
  updateLocationMediaAction,
} from "@/app/(protected)/admin/locations/[locationId]/actions";

const MEDIA: LocationMediaRecord = {
  id: "22222222-2222-4222-8222-222222222222",
  locationId: "11111111-1111-4111-8111-111111111111",
  bucketId: "location-media",
  objectPath: "admin/cover.webp",
  signedUrl: "https://signed.test/location-media/admin/cover.webp",
  role: "cover",
  status: "draft",
  isPrimary: false,
  altText: "Казанский кремль",
  caption: "Вид с реки",
  source: "Куратор",
  mimeType: "image/webp",
  byteSize: 204_800,
  width: 1600,
  height: 900,
  sortOrder: 0,
  createdAt: "2026-07-20T00:00:00Z",
};

function renderConsole(media: LocationMediaRecord[]) {
  return render(
    <LocationMediaConsole
      locationId={MEDIA.locationId}
      locationName="Казань"
      media={media}
    />,
  );
}

describe("validateLocationMediaFile", () => {
  it("accepts the allowed image types", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validateLocationMediaFile({ type, size: 1024 })).toBeNull();
    }
  });

  it("rejects a PDF before any byte leaves the browser", () => {
    expect(validateLocationMediaFile({ type: "application/pdf", size: 1024 })).toBe(
      "Разрешены только JPG, PNG или WEBP.",
    );
  });

  it("rejects a file above the 5 МБ bucket limit", () => {
    expect(
      validateLocationMediaFile({ type: "image/png", size: 5 * 1024 * 1024 + 1 }),
    ).toBe("Файл превышает лимит 5 МБ.");
  });
});

describe("readImageDimensions", () => {
  it("returns null when the browser cannot decode the blob", async () => {
    // jsdom has no createImageBitmap — the same path a corrupt upload takes.
    expect(await readImageDimensions(new Blob(["not-an-image"]))).toBeNull();
  });
});

describe("LocationMediaConsole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(uploadFileToSignedUrl).mockResolvedValue(undefined);
  });

  it("warns that the branded gradient stays while no primary cover is published", () => {
    renderConsole([MEDIA]);

    expect(
      screen.getByText(/остаётся фирменный\s+градиент/),
    ).toBeInTheDocument();
  });

  it("drops the warning once a published primary cover exists", () => {
    renderConsole([{ ...MEDIA, status: "published", isPrimary: true }]);

    expect(screen.queryByText(/остаётся фирменный\s+градиент/)).toBeNull();
    expect(screen.getByText("Главная")).toBeInTheDocument();
    expect(screen.getByText("Опубликовано")).toBeInTheDocument();
  });

  it("shows the file facts an editor needs to judge a cover", () => {
    renderConsole([MEDIA]);

    expect(screen.getByText(/WEBP · 200 КБ · 1600×900/)).toBeInTheDocument();
  });

  it("keeps stored metadata editable rather than read-only", () => {
    renderConsole([MEDIA]);

    expect(screen.getByLabelText("Описание (alt)", { selector: "textarea" })).toHaveValue(
      "Казанский кремль",
    );
    expect(screen.getByDisplayValue("Вид с реки")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Куратор")).toBeInTheDocument();
  });

  it("reserves the record with the selected gallery role, then confirms it", async () => {
    vi.mocked(startLocationMediaUploadAction).mockResolvedValue({
      ok: true,
      mediaId: MEDIA.id,
      signedUrl: "https://storage.test/upload",
    });
    vi.mocked(confirmLocationMediaUploadAction).mockResolvedValue({ ok: true });
    renderConsole([]);

    fireEvent.change(screen.getByLabelText("Роль изображения"), { target: { value: "gallery" } });
    fireEvent.change(screen.getByLabelText("Файл изображения"), {
      target: { files: [new File(["image"], "gallery.webp", { type: "image/webp" })] },
    });

    await waitFor(() =>
      expect(startLocationMediaUploadAction).toHaveBeenCalledWith(
        expect.objectContaining({ role: "gallery", fileName: "gallery.webp" }),
      ),
    );
    await waitFor(() =>
      expect(confirmLocationMediaUploadAction).toHaveBeenCalledWith(
        MEDIA.locationId,
        MEDIA.id,
      ),
    );
  });

  it("cancels the reservation when the upload itself fails — no orphaned object", async () => {
    vi.mocked(startLocationMediaUploadAction).mockResolvedValue({
      ok: true,
      mediaId: MEDIA.id,
      signedUrl: "https://storage.test/upload",
    });
    vi.mocked(uploadFileToSignedUrl).mockRejectedValueOnce(new Error("сеть недоступна"));
    vi.mocked(cancelLocationMediaUploadAction).mockResolvedValue({ ok: true });
    renderConsole([]);

    fireEvent.change(screen.getByLabelText("Файл изображения"), {
      target: { files: [new File(["image"], "cover.webp", { type: "image/webp" })] },
    });

    await waitFor(() =>
      expect(cancelLocationMediaUploadAction).toHaveBeenCalledWith(
        MEDIA.locationId,
        MEDIA.id,
      ),
    );
    expect(confirmLocationMediaUploadAction).not.toHaveBeenCalled();
  });

  it("offers cancel — and nothing else — for a record still uploading", () => {
    renderConsole([{ ...MEDIA, status: "uploading", signedUrl: null }]);

    expect(screen.getByRole("button", { name: "Отменить загрузку" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Опубликовать" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Сделать главной" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Удалить" })).toBeDisabled();
    expect(screen.getByText("Загружается")).toBeInTheDocument();
  });

  it("renders a placeholder instead of a broken image when nothing was uploaded", () => {
    renderConsole([{ ...MEDIA, status: "uploading", signedUrl: null }]);

    expect(screen.getByText("Файл не загружен")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders the signed URL, never a public bucket URL", () => {
    renderConsole([MEDIA]);

    expect(screen.getByRole("img")).toHaveAttribute("src", MEDIA.signedUrl);
  });

  it("saves a revised role for a non-primary asset", async () => {
    vi.mocked(updateLocationMediaAction).mockResolvedValue({ ok: true });
    renderConsole([MEDIA]);

    fireEvent.change(screen.getByLabelText("Роль"), { target: { value: "gallery" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() =>
      expect(updateLocationMediaAction).toHaveBeenCalledWith(MEDIA.locationId, MEDIA.id, {
        altText: MEDIA.altText,
        caption: MEDIA.caption,
        source: MEDIA.source,
        role: "gallery",
      }),
    );
  });

  it("does not allow a primary asset to stop being a cover", () => {
    renderConsole([{ ...MEDIA, status: "published", isPrimary: true }]);

    expect(screen.getByLabelText("Роль")).toBeDisabled();
  });

  it("offers an empty state instead of a bare page when nothing is uploaded", () => {
    renderConsole([]);

    expect(screen.getByText("Медиа нет")).toBeInTheDocument();
  });
});
