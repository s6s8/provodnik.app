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

vi.mock("@/features/guide/components/profile/guide-about-form", () => ({
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

vi.mock("@/features/guide/verification-actions", () => ({
  confirmDocumentUpload: vi.fn(),
  confirmGuideAssetUpload: vi.fn(),
  getUploadUrl: vi.fn(),
  submitForVerification: vi.fn(),
}));

import GuideProfilePage from "./page";

function makeGuideProfileRow(verificationStatus: string) {
  return {
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
  };
}

function makeSupabaseClient(
  verificationStatus = "draft",
  options?: { failSectionFetch?: boolean },
) {
  return {
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: () => {
          if (table === "profiles") {
            return {
              maybeSingle: () => Promise.resolve({
                data: { avatar_url: null, full_name: "Ирина Петрова" },
              }),
            };
          }

          if (table === "guide_profiles") {
            const isVerificationOnly = columns === "verification_status";
            return {
              maybeSingle: () => {
                if (isVerificationOnly) {
                  return Promise.resolve({
                    data: { verification_status: verificationStatus },
                  });
                }
                if (options?.failSectionFetch) {
                  return Promise.reject(new Error("section fetch failed"));
                }
                return Promise.resolve({
                  data: makeGuideProfileRow(verificationStatus),
                });
              },
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

  it("renders the license add action after the section description", async () => {
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
    const description = screen.getByText(
      "Укажите документ и к каким видам экскурсиям он относится.",
    );
    const header = addButton.closest('[data-slot="card-header"]');

    expect(header).toBeInTheDocument();
    expect(header as HTMLElement).toContainElement(description);
    expect(
      description.compareDocumentPosition(addButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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

  it("does not lock sections for a guide account that is not yet approved", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce({
      isAuthenticated: true,
      userId: "g1",
      role: "guide",
      email: "irina@example.com",
    });
    createSupabaseServerClientMock.mockImplementation(() => makeSupabaseClient("draft"));

    const ui = await GuideProfilePage();
    render(ui);

    expect(screen.getByLabelText("О себе")).toHaveAttribute("data-locked", "false");
    expect(screen.getByLabelText("Юридические данные")).toHaveAttribute("data-locked", "false");
    expect(screen.getByRole("button", { name: "Добавить документ" })).not.toBeDisabled();
  });

  it("locks verified sections for an approved guide when section data fetch fails", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce({
      isAuthenticated: true,
      userId: "g1",
      role: "guide",
      email: "irina@example.com",
    });
    createSupabaseServerClientMock.mockImplementation(() =>
      makeSupabaseClient("approved", { failSectionFetch: true }),
    );

    const ui = await GuideProfilePage();
    render(ui);

    expect(screen.getByLabelText("О себе")).toHaveAttribute("data-locked", "true");
    expect(screen.getByLabelText("Юридические данные")).toHaveAttribute("data-locked", "true");
    expect(screen.getByRole("button", { name: "Добавить документ" })).toBeDisabled();
    expect(screen.getByText("Подтверждено")).toBeInTheDocument();
  });
});
