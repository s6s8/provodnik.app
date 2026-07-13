import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const { updateTravelerProfile } = vi.hoisted(() => ({
  updateTravelerProfile: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/features/profile/account-settings-actions", () => ({
  updateTravelerProfile,
}));

import { TravelerProfileForm } from "./traveler-profile-form";

const emptyProfile = {
  full_name: null,
  avatar_url: null,
  bio: null,
  home_city: null,
  languages: null,
  birth_year: null,
};

describe("TravelerProfileForm", () => {
  it("renders all required fields", () => {
    render(<TravelerProfileForm profile={emptyProfile} />);

    expect(screen.getByLabelText("Имя")).toBeInTheDocument();
    expect(screen.getByLabelText("О себе")).toBeInTheDocument();
    expect(screen.getByLabelText("Родной город")).toBeInTheDocument();
    expect(screen.getByLabelText("Языки")).toBeInTheDocument();
    expect(screen.getByLabelText("Год рождения")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Сохранить" }),
    ).toBeInTheDocument();
  });

  it("limits «О себе» to 200 characters", () => {
    render(<TravelerProfileForm profile={emptyProfile} />);

    const textarea = screen.getByLabelText("О себе") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "a".repeat(250) } });

    expect(textarea.value).toHaveLength(200);
  });

  it("flags an empty name on the field itself and does not submit", async () => {
    updateTravelerProfile.mockClear();
    render(<TravelerProfileForm profile={emptyProfile} />);

    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Укажите имя");
    expect(screen.getByLabelText("Имя")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Имя")).toHaveAccessibleDescription("Укажите имя");
    expect(updateTravelerProfile).not.toHaveBeenCalled();
  });

  it("submits the checked languages through the form payload", async () => {
    updateTravelerProfile.mockClear();
    render(
      <TravelerProfileForm profile={{ ...emptyProfile, full_name: "Анна" }} />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "English" }));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(updateTravelerProfile).toHaveBeenCalledTimes(1));
    const formData = updateTravelerProfile.mock.calls[0][0] as FormData;
    expect(formData.get("name")).toBe("Анна");
    expect(formData.getAll("languages")).toEqual(["en"]);
  });
});
