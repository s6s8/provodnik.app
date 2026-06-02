import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock, readAuthContextFromServerMock, redirectMock } =
  vi.hoisted(() => ({
    createSupabaseServerClientMock: vi.fn(),
    readAuthContextFromServerMock: vi.fn(),
    redirectMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/auth/server-auth", () => ({
  readAuthContextFromServer: readAuthContextFromServerMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/app/(protected)/profile/guide/about/guide-about-form", () => ({
  GuideAboutForm: ({ isLocked }: { isLocked?: boolean }) => (
    <form aria-label="О себе" data-locked={String(Boolean(isLocked))} />
  ),
}));

vi.mock("@/features/profile/components/LegalInformationForm", () => ({
  LegalInformationForm: ({ isLocked }: { isLocked?: boolean }) => (
    <form aria-label="Юридические данные" data-locked={String(Boolean(isLocked))} />
  ),
}));

vi.mock("@/features/guide/components/verification/verification-upload-form", () => ({
  VerificationUploadForm: () => <form aria-label="Форма верификации" />,
}));

vi.mock("@/app/(protected)/profile/_components/avatar-upload-block", () => ({
  AvatarUploadBlock: () => <div>Фото профиля</div>,
}));

vi.mock("@/features/profile/components/LicenseAddButton", () => ({
  LicenseAddButton: ({ isLocked }: { isLocked?: boolean }) => (
    <button type="button" disabled={isLocked}>Добавить документ</button>
  ),
}));

vi.mock("@/app/(protected)/guide/verification/actions", () => ({
  confirmDocumentUpload: vi.fn(),
  confirmGuideAssetUpload: vi.fn(),
  getUploadUrl: vi.fn(),
  submitForVerification: vi.fn(),
}));

import GuideProfilePage from "./page";

function makeSupabaseClient(verificationStatus = "draft") {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => {
          if (table === "profiles") {
            return {
              maybeSingle: () => Promise.resolve({
                data: { avatar_url: null, full_name: "Ирина Петрова" },
              }),
            };
          }

          if (table === "guide_profiles") {
            return {
              maybeSingle: () => Promise.resolve({
                data: {
                  bio: "",
                  base_city: "",
                  languages: [],
                  specializations: [],
                  years_experience: null,
                  regions: [],
                  legal_status: "self_employed",
                  inn: null,
                  document_country: null,
                  is_tour_operator: false,
                  tour_operator_registry_number: null,
                  verification_status: verificationStatus,
                  verification_notes: null,
                },
              }),
            };
          }

          return {
            in: () => ({
              order: () => Promise.resolve({ data: [] }),
            }),
            order: () => Promise.resolve({ data: [] }),
          };
        },
      }),
    }),
  };
}

describe("GuideProfilePage", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
    readAuthContextFromServerMock.mockReset();
    redirectMock.mockReset();
  });

  it("renders the checklist editor for an authenticated guide", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce({
      isAuthenticated: true,
      userId: "g1",
      role: "guide",
      email: "irina@example.com",
    });
    createSupabaseServerClientMock.mockImplementation(makeSupabaseClient);

    const ui = await GuideProfilePage();
    render(ui);

    expect(
      screen.getByRole("heading", { level: 1, name: "Профиль гида" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("О себе")).toBeInTheDocument();
    expect(screen.getByLabelText("Разделы профиля")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Документ о квалификации" }),
    ).toBeInTheDocument();
    expect(document.getElementById("license")).toHaveClass(
      "scroll-mt-[calc(var(--nav-h)+1rem)]",
    );
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("uses the qualification document wording instead of the attestation cluster", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce({
      isAuthenticated: true,
      userId: "g1",
      role: "guide",
      email: "irina@example.com",
    });
    createSupabaseServerClientMock.mockImplementation(makeSupabaseClient);

    const ui = await GuideProfilePage();
    render(ui);

    expect(screen.getByRole("link", { name: "Квалификация" })).toHaveAttribute("href", "#license");
    expect(
      screen.getAllByRole("heading", { name: /^Документ о квалификации$/ }),
    ).toHaveLength(1);
    expect(screen.getByText("Документ о квалификации", { exact: true })).toBeInTheDocument();
    expect(screen.queryByText("Аттестаты")).not.toBeInTheDocument();
    expect(screen.queryByText("Аттестаты и документы")).not.toBeInTheDocument();
    expect(screen.queryByText("Документы и к каким экскурсиям они относятся.")).not.toBeInTheDocument();
  });

  it("renders the license add action in the section header action slot", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce({
      isAuthenticated: true,
      userId: "g1",
      role: "guide",
      email: "irina@example.com",
    });
    createSupabaseServerClientMock.mockImplementation(makeSupabaseClient);

    const ui = await GuideProfilePage();
    render(ui);

    const addButton = screen.getByRole("button", { name: "Добавить документ" });
    const action = addButton.closest('[data-slot="card-action"]');
    const header = addButton.closest('[data-slot="card-header"]');

    expect(action).toBeInTheDocument();
    expect(header).toBeInTheDocument();
    expect(
      within(header as HTMLElement).getByText(
        "Укажите документ и к каким видам экскурсиям он относится.",
      ),
    ).toBeInTheDocument();
    expect(
      within(header as HTMLElement).queryByText(
        "Профиль одобрен. Документы о квалификации недоступны для редактирования из обычного профиля.",
      ),
    ).not.toBeInTheDocument();
  });

  it("redirects non-guide roles away from the profile editor", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce({
      isAuthenticated: true,
      userId: "t1",
      role: "traveler",
      canonicalRedirectTo: "/traveler/requests",
      email: "traveler@example.com",
    });
    createSupabaseServerClientMock.mockImplementation(makeSupabaseClient);

    await GuideProfilePage();

    expect(redirectMock).toHaveBeenCalledWith("/traveler/requests");
  });

  it("keeps the editor available for an approved guide while locking verified sections", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce({
      isAuthenticated: true,
      userId: "g1",
      role: "guide",
      email: "irina@example.com",
    });
    createSupabaseServerClientMock.mockImplementation(() => makeSupabaseClient("approved"));

    const ui = await GuideProfilePage();
    render(ui);

    expect(screen.getByLabelText("О себе")).toHaveAttribute("data-locked", "true");
    expect(screen.getByLabelText("Юридические данные")).toHaveAttribute("data-locked", "true");
    expect(screen.getByRole("button", { name: "Добавить документ" })).toBeDisabled();
    expect(screen.getByText("Подтверждено")).toBeInTheDocument();
    expect(screen.queryByLabelText("Форма верификации")).not.toBeInTheDocument();
    const lockNotice = screen.getByText(
      "Профиль одобрен. Документы о квалификации недоступны для редактирования из обычного профиля.",
    );
    expect(lockNotice.closest('[data-slot="card-content"]')).toBeInTheDocument();
    expect(lockNotice.closest('[data-slot="card-header"]')).not.toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
