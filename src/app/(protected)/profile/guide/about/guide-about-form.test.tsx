import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { saveGuideAboutActionMock, refreshMock } = vi.hoisted(() => ({
  saveGuideAboutActionMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("./actions", () => ({
  saveGuideAboutAction: saveGuideAboutActionMock,
}));

import { GuideAboutForm } from "./guide-about-form";

const baseProps = {
  initialBio: "",
  initialBaseCity: "Санкт-Петербург",
  initialLanguages: [] as string[],
  initialSpecializations: [] as string[],
  initialYearsExperience: null,
  initialRegions: [] as string[],
};

describe("GuideAboutForm", () => {
  it("keeps a region with spaces visible after save", async () => {
    saveGuideAboutActionMock.mockResolvedValueOnce({
      ok: true,
      regions: ["Санкт Петербург"],
    });

    render(<GuideAboutForm {...baseProps} />);

    const regionsInput = screen.getByLabelText("Регионы");
    fireEvent.change(regionsInput, { target: { value: "Санкт Петербург" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(saveGuideAboutActionMock).toHaveBeenCalled();
    });

    expect(regionsInput).toHaveValue("Санкт Петербург");
    expect(refreshMock).toHaveBeenCalled();
  });
});
