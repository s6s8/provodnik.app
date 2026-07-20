import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

vi.mock("next/image", () => ({
  default: () => null,
}));

import { GuidePortfolioScreen } from "./guide-portfolio-screen";

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

  it("accepts a free-text location and uploads its required metadata", async () => {
    listGuideLocationPhotosMock.mockResolvedValue([]);
    uploadPortfolioPhotoMock.mockResolvedValue({
      id: "photo-id",
      guide_id: "guide-from-auth",
      storage_asset_id: "asset-id",
      location_name: "Смотровая у старого маяка",
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

    const location = await screen.findByLabelText("Локация");
    expect(location).toHaveAttribute("type", "text");
    expect(screen.queryByRole("combobox", { name: "Локация" })).not.toBeInTheDocument();
    expect(screen.queryByText("Выберите локацию")).not.toBeInTheDocument();

    fireEvent.change(location, { target: { value: "Смотровая у старого маяка" } });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeEnabled();
    const file = new File(["image"], "lighthouse.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadPortfolioPhotoMock).toHaveBeenCalledWith({
        guideId: "guide-from-auth",
        file,
        locationName: "Смотровая у старого маяка",
        sortOrder: 0,
      });
    });
  });
});
