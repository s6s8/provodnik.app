import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const {
  createSupabaseBrowserClientMock,
  listGuideLocationPhotosMock,
} = vi.hoisted(() => ({
  createSupabaseBrowserClientMock: vi.fn(),
  listGuideLocationPhotosMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: createSupabaseBrowserClientMock,
}));

vi.mock("@/lib/supabase/guide-assets", () => ({
  deleteGuideLocationPhoto: vi.fn(),
  listGuideLocationPhotos: listGuideLocationPhotosMock,
  uploadPortfolioPhoto: vi.fn(),
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
});
