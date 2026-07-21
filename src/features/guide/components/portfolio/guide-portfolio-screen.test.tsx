import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

const {
  createSupabaseBrowserClientMock,
  listGuideLocationPhotosMock,
  uploadPortfolioPhotoMock,
} = vi.hoisted(() => ({
  createSupabaseBrowserClientMock: vi.fn(),
  listGuideLocationPhotosMock: vi.fn(),
  uploadPortfolioPhotoMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: createSupabaseBrowserClientMock,
}));

vi.mock("@/lib/supabase/guide-assets", () => ({
  deleteGuideLocationPhoto: vi.fn(),
  listGuideLocationPhotos: listGuideLocationPhotosMock,
  uploadPortfolioPhoto: uploadPortfolioPhotoMock,
}));

vi.mock("@/lib/supabase/location-catalog", () => ({
  listActiveLocations: vi.fn().mockResolvedValue([
    { id: "loc-1", name: "Батуми", status: "active" },
    { id: "loc-2", name: "Тбилиси, Грузия", status: "active" },
  ]),
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

import { GuidePortfolioScreen } from "./guide-portfolio-screen";

// Radix Select (ui/Select) drives itself with pointer capture + scrollIntoView,
// neither of which jsdom implements.
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("GuidePortfolioScreen", () => {
  it("loads portfolio photos for the authenticated guide instead of trusting the prop id", async () => {
    listGuideLocationPhotosMock.mockResolvedValue([]);
    createSupabaseBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "guide-from-auth" } },
          error: null,
        }),
      },
      storage: {
        from: () => ({
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
    });

    render(<GuidePortfolioScreen guideId="guide-from-prop" />);

    await waitFor(() => {
      expect(listGuideLocationPhotosMock).toHaveBeenCalledWith("guide-from-auth");
    });
  });

  it("offers only active catalogue locations — no free-text location", async () => {
    listGuideLocationPhotosMock.mockResolvedValue([]);
    uploadPortfolioPhotoMock.mockResolvedValue({
      id: "photo-id",
      guide_id: "guide-from-auth",
      storage_asset_id: "asset-id",
      location_name: "Батуми",
      sort_order: 0,
      created_at: "2026-07-20T00:00:00.000Z",
      object_path: "guide-from-auth/photo-id.jpg",
    });
    createSupabaseBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "guide-from-auth" } },
          error: null,
        }),
      },
      storage: {
        from: () => ({
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
    });

    render(<GuidePortfolioScreen guideId="guide-from-prop" />);

    const location = await screen.findByRole("combobox", { name: "Локация" });
    expect(document.querySelector('input[type="text"]')).toBeNull();

    // Upload stays blocked until a catalogue location is picked.
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDisabled();

    fireEvent.keyDown(location, { key: " " });
    expect(screen.getByRole("option", { name: "Батуми" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Тбилиси, Грузия" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Батуми" }));

    await waitFor(() => expect(fileInput).toBeEnabled());
    const file = new File(["image"], "lighthouse.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadPortfolioPhotoMock).toHaveBeenCalledWith({
        guideId: "guide-from-auth",
        file,
        locationName: "Батуми",
        sortOrder: 0,
      });
    });
  });
});
