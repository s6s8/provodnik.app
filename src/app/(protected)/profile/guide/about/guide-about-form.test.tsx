import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("lets an approved guide save bio while verified fields stay locked", async () => {
    saveGuideAboutActionMock.mockResolvedValueOnce({
      ok: true,
      regions: ["Карелия"],
    });

    render(<GuideAboutForm {...baseProps} initialRegions={["Карелия"]} isLocked />);

    const bioInput = screen.getByLabelText("О себе");
    const baseCityInput = screen.getByLabelText("Базовый город");

    expect(bioInput).not.toBeDisabled();
    expect(baseCityInput).toBeDisabled();

    fireEvent.change(bioInput, { target: { value: "Обновленный публичный текст" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(saveGuideAboutActionMock).toHaveBeenCalled();
    });

    const submitted = saveGuideAboutActionMock.mock.calls[0][0] as FormData;
    expect(submitted.get("bio")).toBe("Обновленный публичный текст");
    expect(submitted.has("base_city")).toBe(false);
    expect(refreshMock).toHaveBeenCalled();
  });
});
