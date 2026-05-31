import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { GuideReviewDetail } from "@/lib/supabase/moderation";

const { getGuideReviewDetailMock } = vi.hoisted(() => ({
  getGuideReviewDetailMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("@/lib/supabase/moderation", () => ({
  getGuideReviewDetail: getGuideReviewDetailMock,
}));

vi.mock("./actions", () => ({
  approveGuide: vi.fn(),
  rejectGuide: vi.fn(),
  requestChanges: vi.fn(),
}));

import AdminGuideDetailPage from "./page";

const guideDetail = {
  profile: {
    user_id: "g1",
    slug: "guide-one",
    bio: "Провожу авторские прогулки по старому городу.",
    years_experience: 7,
    specialization: null,
    rating: 0,
    completed_tours: 0,
    is_available: true,
    regions: ["Карелия"],
    languages: ["Русский", "Английский"],
    specialties: [],
    specializations: ["История", "Архитектура"],
    attestation_status: null,
    verification_status: "submitted",
    verification_notes: "Проверить документы.",
    payout_account_label: null,
    created_at: "2026-05-01T10:00:00.000Z",
    updated_at: "2026-05-02T10:00:00.000Z",
    legal_status: "self_employed",
    inn: "123456789012",
    document_country: "RU",
    is_tour_operator: true,
    tour_operator_registry_number: "РТО-123",
    average_rating: 0,
    response_rate: 0,
    review_count: 0,
    contact_visibility_unlocked: false,
    locale: "ru",
    preferred_currency: "RUB",
    notification_prefs: {},
    base_city: "Петрозаводск",
    max_group_size: null,
  },
  account: {
    id: "g1",
    full_name: "Ирина Петрова",
    email: "irina@example.com",
    avatar_url: "/avatars/irina.jpg",
  },
  documents: [],
  licenses: [],
  moderation_case: null,
} as unknown as GuideReviewDetail;

describe("AdminGuideDetailPage", () => {
  it("shows all profile fields the guide can fill", async () => {
    getGuideReviewDetailMock.mockResolvedValueOnce(guideDetail);

    const ui = await AdminGuideDetailPage({
      params: Promise.resolve({ id: "g1" }),
    });
    render(ui);

    expect(
      screen.getByRole("img", { name: "Ирина Петрова" }),
    ).toHaveAttribute("src", "/avatars/irina.jpg");

    for (const label of [
      "Имя в профиле",
      "Описание",
      "Базовый город",
      "Стаж",
      "Языки",
      "Специализации",
      "Правовой статус",
      "ИНН",
      "Страна документа",
      "Туроператор",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("localizes legal status and avoids duplicate qualification document details", async () => {
    getGuideReviewDetailMock.mockResolvedValueOnce({
      ...guideDetail,
      documents: [
        {
          id: "doc-1",
          guide_id: "g1",
          document_type: "passport",
          status: "submitted",
          asset_id: "asset-1",
          created_at: "2026-05-03T10:00:00.000Z",
          updated_at: "2026-05-03T10:00:00.000Z",
          storage_asset: {
            id: "asset-1",
            bucket_id: "guide-documents",
            object_path: "g1/private/passport.pdf",
            signed_url: null,
          },
          signed_url: "https://storage.example/passport.pdf",
        },
      ],
      licenses: [
        {
          id: "license-1",
          guideId: "g1",
          licenseType: "Аттестат",
          licenseNumber: "77-123",
          issuedBy: "Министерством Туризма Республики",
          validUntil: null,
          region: null,
          scopeMode: "all",
          listingTitles: [],
        },
      ],
    } as unknown as GuideReviewDetail);

    const ui = await AdminGuideDetailPage({
      params: Promise.resolve({ id: "g1" }),
    });
    render(ui);

    expect(screen.getByText("Самозанятый")).toBeInTheDocument();
    expect(screen.queryByText("self_employed")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Документ о квалификации" })).toBeInTheDocument();
    expect(screen.getAllByText("Аттестат")).toHaveLength(1);
    expect(screen.getAllByText(/Министерством Туризма Республики/)).toHaveLength(1);
    expect(screen.getByText("passport")).toBeInTheDocument();
    expect(screen.queryByText("guide-documents/g1/private/passport.pdf")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Скачать" })).toHaveAttribute(
      "href",
      "https://storage.example/passport.pdf",
    );
  });
});
