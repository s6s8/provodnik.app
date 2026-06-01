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
  GuideAboutForm: () => <form aria-label="О себе" />,
}));

vi.mock("@/features/profile/components/LegalInformationForm", () => ({
  LegalInformationForm: () => <form aria-label="Юридические данные" />,
}));

vi.mock("@/features/guide/components/verification/verification-upload-form", () => ({
  VerificationUploadForm: () => <form aria-label="Верификация" />,
}));

vi.mock("@/app/(protected)/profile/_components/avatar-upload-block", () => ({
  AvatarUploadBlock: () => <div>Фото профиля</div>,
}));

vi.mock("@/features/profile/components/LicenseAddButton", () => ({
  LicenseAddButton: () => <button type="button">Добавить документ</button>,
}));

vi.mock("@/app/(protected)/guide/verification/actions", () => ({
  confirmDocumentUpload: vi.fn(),
  confirmGuideAssetUpload: vi.fn(),
  getUploadUrl: vi.fn(),
  submitForVerification: vi.fn(),
}));

import GuideProfilePage from "./page";

function makeSupabaseClient() {
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
                  verification_status: "draft",
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

    expect(screen.getByLabelText("О себе")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Документ о квалификации" }),
    ).toBeInTheDocument();
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
      screen.getByRole("heading", { name: /^Документ о квалификации$/ }),
    ).toBeInTheDocument();
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
  });
});
