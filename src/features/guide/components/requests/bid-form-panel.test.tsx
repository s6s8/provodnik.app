import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RequestRecord } from "@/data/supabase/queries";
import type { GuideTemplateRow } from "@/lib/supabase/types";

const { guidePhotos, guideTemplates, submitOfferAction, verificationStatus } = vi.hoisted(() => ({
  guidePhotos: {
    value: [] as Array<{ id: string; location_name: string; object_path: string }>,
  },
  guideTemplates: { value: [] as GuideTemplateRow[] },
  submitOfferAction: vi.fn(),
  verificationStatus: { value: "approved" as string | null },
}));

vi.mock("@/app/(protected)/guide/inbox/[requestId]/offer/actions", () => ({
  submitOfferAction,
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "guide-1" } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { verification_status: verificationStatus.value },
            error: null,
          }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        getPublicUrl: (objectPath: string) => ({ data: { publicUrl: `/photos/${objectPath}` } }),
      }),
    },
  }),
}));

vi.mock("@/data/guide-assets/supabase-client", () => ({
  listGuideLocationPhotos: async () => guidePhotos.value,
}));

vi.mock("@/data/guide-templates/supabase-client", () => ({
  listGuideTemplates: async () => guideTemplates.value,
}));

import { BidFormPanel } from "./bid-form-panel";

beforeEach(() => {
  vi.clearAllMocks();
  guidePhotos.value = [];
  guideTemplates.value = [];
  verificationStatus.value = "approved";
  submitOfferAction.mockResolvedValue({ ok: true, offerId: "offer-1" });
});

const baseRequest: RequestRecord = {
  id: "req-1",
  destination: "Сочи",
  destinationSlug: "sochi",
  destinationRegion: "Юг",
  title: "Тестовый запрос",
  dateLabel: "10 июня",
  startsOn: "2026-06-10",
  endsOn: null,
  startTime: null,
  endTime: null,
  groupSize: 2,
  capacity: 2,
  budgetRub: 0,
  budgetLabel: "—",
  requesterName: "Тест",
  requesterInitials: "Т",
  description: "",
  interests: [],
  mode: "assembly",
  format: "tour",
  status: "open",
  createdAt: "2026-01-01T00:00:00Z",
  offerCount: 0,
  imageUrl: "",
  members: [],
};

describe("BidFormPanel — mode line", () => {
  it("renders text line for assembly mode without the colored pill", () => {
    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, mode: "assembly" }}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("Сборная группа")).toBeInTheDocument();
    expect(screen.queryByText(/^Открытая группа$/)).toBeNull();
  });

  it("renders text line for private mode with N count", () => {
    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, mode: "private", groupSize: 4 }}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("Своя группа")).toBeInTheDocument();
  });
});

describe("BidFormPanel — date/time locks", () => {
  it("disables date and time fields when date_locked/time_locked are true", () => {
    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, date_locked: true, time_locked: true }}
        onClose={() => {}}
      />,
    );

    expect(screen.getByLabelText(/Дата/)).toBeDisabled();
    expect(screen.getByLabelText(/Время начала/)).toBeDisabled();
  });

  it("drops the few_days explanatory hint (UX point 7) but keeps the гибкие даты badge", () => {
    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, dateFlexibility: "few_days", date_locked: false }}
        onClose={() => {}}
      />,
    );

    // Point 7 (commit b5240a8, approved) removed explanatory texts under context badges.
    expect(
      screen.queryByText("Путешественник открыт к близким датам — предложите удобную вам дату"),
    ).toBeNull();
    expect(screen.getByText("гибкие даты")).toBeInTheDocument();
  });
});

describe("BidFormPanel — request context", () => {
  it("does not render traveler wishes in the readonly context block", () => {
    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, description: "Хочу неспешную прогулку без музеев." }}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByText("Хочу неспешную прогулку без музеев.")).toBeNull();
  });
});

describe("BidFormPanel — headcount field", () => {
  it("does not render the «предложено» badge when headcount changes", () => {
    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, groupSize: 4 }}
        onClose={() => {}}
      />,
    );

    fireEvent.change(screen.getAllByRole("spinbutton")[0], {
      target: { value: "5" },
    });

    expect(screen.queryByText(/предложено/i)).toBeNull();
  });
});

describe("BidFormPanel — excursion picker", () => {
  it("selects a published excursion inline without changing request price defaults", async () => {
    guideTemplates.value = [
      {
        id: "template-1",
        guide_id: "guide-1",
        title: "Морской променад",
        description: "Покажу любимый маршрут вдоль моря и старых дач.",
        duration_text: "2 часа",
        price_from_kopecks: 990_000,
        meeting_point: null,
        max_participants: null,
        photo_urls: [],
        status: "published",
        region: null,
        category: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, budgetRub: 1500, groupSize: 2 }}
        onClose={() => {}}
      />,
    );

    expect(await screen.findByRole("button", { name: "Выбрать из моих экскурсий ↓" })).toBeInTheDocument();
    expect(screen.queryByText("Из шаблона ↑")).toBeNull();

    expect(screen.getByPlaceholderText("За группу, ₽")).toHaveValue(3000);
    expect(screen.getByPlaceholderText("На человека, ₽")).toHaveValue(1500);

    fireEvent.click(screen.getByRole("button", { name: "Выбрать из моих экскурсий ↓" }));
    fireEvent.click(screen.getByRole("button", { name: /Морской променад/ }));

    expect(screen.getByPlaceholderText("дополнительная информация об экскурсии, вопросы и условия")).toHaveValue(
      "Покажу любимый маршрут вдоль моря и старых дач.",
    );
    expect(screen.getByText("Морской променад")).toBeInTheDocument();
    expect(screen.getByText("2 часа")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "× изменить" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("За группу, ₽")).toHaveValue(3000);
    expect(screen.getByPlaceholderText("На человека, ₽")).toHaveValue(1500);
  });
});

describe("BidFormPanel — catalog and route switcher", () => {
  const template: GuideTemplateRow = {
    id: "template-1",
    guide_id: "guide-1",
    title: "Морской променад",
    description: "Покажу любимый маршрут вдоль моря и старых дач.",
    duration_text: "2 часа",
    price_from_kopecks: 990_000,
    meeting_point: null,
    max_participants: null,
    photo_urls: [],
    status: "published",
    region: null,
    category: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("shows tabs when catalog templates and route photos are both available", async () => {
    guideTemplates.value = [template];
    guidePhotos.value = [
      { id: "photo-1", location_name: "Морской вокзал", object_path: "photo-1.jpg" },
    ];

    render(<BidFormPanel requestId="req-1" request={baseRequest} onClose={() => {}} />);

    expect(await screen.findByRole("button", { name: "Мой каталог" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Построить путь" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Выбрать из моих экскурсий ↓" })).toBeInTheDocument();
    expect(screen.queryByText("Создайте персонализированный маршрут из фото-локаций")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Построить путь" }));

    expect(screen.queryByRole("button", { name: "Выбрать из моих экскурсий ↓" })).toBeNull();
    expect(screen.getByText("Создайте персонализированный маршрут из фото-локаций")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Морской вокзал/ })).toBeInTheDocument();
  });

  it("shows route builder without tabs when only route photos are available", async () => {
    guidePhotos.value = [
      { id: "photo-1", location_name: "Морской вокзал", object_path: "photo-1.jpg" },
    ];

    render(<BidFormPanel requestId="req-1" request={baseRequest} onClose={() => {}} />);

    expect(await screen.findByText("Создайте персонализированный маршрут из фото-локаций")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Мой каталог" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Построить путь" })).toBeNull();
  });
});

describe("BidFormPanel — form copy", () => {
  it("renders updated labels and placeholder text", () => {
    render(<BidFormPanel requestId="req-1" request={baseRequest} onClose={() => {}} />);

    expect(screen.getByText("Начало")).toBeInTheDocument();
    expect(screen.getByText("Конец")).toBeInTheDocument();
    expect(screen.getByText("Сколько человек готов взять")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("дополнительная информация об экскурсии, вопросы и условия"),
    ).toBeInTheDocument();
  });
});

describe("BidFormPanel — verification gate", () => {
  it("does not submit an offer when the guide is not approved", async () => {
    verificationStatus.value = "submitted";
    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, budgetRub: 1500 }}
        onClose={() => {}}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("дополнительная информация об экскурсии, вопросы и условия"), {
      target: { value: "Готов провести маршрут по вашему запросу." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Отправить предложение" }));

    expect(
      await screen.findByText("Предложения доступны только после одобрения профиля гида."),
    ).toBeInTheDocument();
    expect(submitOfferAction).not.toHaveBeenCalled();
  });
});
