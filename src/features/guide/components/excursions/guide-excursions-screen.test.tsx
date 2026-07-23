import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { GuideTemplateRow } from "@/lib/supabase/types";

const {
  createGuideTemplateMock,
  createSupabaseBrowserClientMock,
  deleteGuideTemplateMock,
  guidePhotos,
  guideTemplates,
  listGuideLocationPhotosMock,
  listGuideTemplatesMock,
  updateGuideTemplateMock,
} = vi.hoisted(() => ({
  createGuideTemplateMock: vi.fn(),
  createSupabaseBrowserClientMock: vi.fn(),
  deleteGuideTemplateMock: vi.fn(),
  guidePhotos: {
    value: [] as Array<{ id: string; location_name: string; object_path: string }>,
  },
  guideTemplates: { value: [] as GuideTemplateRow[] },
  listGuideLocationPhotosMock: vi.fn(),
  listGuideTemplatesMock: vi.fn(),
  updateGuideTemplateMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: createSupabaseBrowserClientMock,
}));

vi.mock("@/lib/supabase/guide-assets", () => ({
  listGuideLocationPhotos: listGuideLocationPhotosMock,
}));

vi.mock("@/lib/supabase/location-catalog", () => ({
  listActiveLocations: vi.fn().mockResolvedValue([
    { id: "loc-1", name: "Батуми", status: "active" },
    { id: "loc-2", name: "Тбилиси, Грузия", status: "active" },
  ]),
}));

vi.mock("@/lib/supabase/guide-templates", () => ({
  createGuideTemplate: createGuideTemplateMock,
  deleteGuideTemplate: deleteGuideTemplateMock,
  listGuideTemplates: listGuideTemplatesMock,
  updateGuideTemplate: updateGuideTemplateMock,
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

import { GuideExcursionsScreen } from "./guide-excursions-screen";

const baseTemplate: GuideTemplateRow = {
  id: "template-1",
  guide_id: "guide-1",
  title: "Старый город пешком",
  description: "Покажу дворики, смотровые и тихие улочки.",
  duration_text: "3 часа",
  price_from_kopecks: 450_000,
  price_scope: "per_person",
  meeting_point: "Площадь Свободы",
  max_participants: 8,
  photo_urls: ["/photos/old-town.jpg"],
  status: "published",
  rejection_reason: null,
  region: "Тбилиси, Грузия",
  category: "history_culture",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
};

// Radix Select (ui/Select) drives itself with pointer capture + scrollIntoView,
// neither of which jsdom implements.
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

/**
 * Opens the category combobox and picks the option with the given label.
 * jsdom does not implement PointerEvent buttons, so open it the keyboard way —
 * which is the interaction the a11y refactor cares about anyway.
 */
function selectPriceScope(optionLabel: string) {
  fireEvent.click(screen.getByRole("radio", { name: optionLabel }));
}

function selectCategory(optionLabel: string) {
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Категория" }), { key: " " });
  fireEvent.click(screen.getByRole("option", { name: optionLabel }));
}

function selectLocation(optionLabel: string) {
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Локация" }), { key: " " });
  fireEvent.click(screen.getByRole("option", { name: optionLabel }));
}

beforeEach(() => {
  vi.clearAllMocks();
  guidePhotos.value = [];
  guideTemplates.value = [];

  createSupabaseBrowserClientMock.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "guide-1" } },
        error: null,
      }),
    },
    storage: {
      from: () => ({
        getPublicUrl: (objectPath: string) => ({ data: { publicUrl: `/photos/${objectPath}` } }),
      }),
    },
  });
  listGuideLocationPhotosMock.mockImplementation(async () => guidePhotos.value);
  listGuideTemplatesMock.mockImplementation(async () => guideTemplates.value);
  createGuideTemplateMock.mockResolvedValue({
    ...baseTemplate,
    id: "created-template",
    title: "Новый маршрут",
    description: "Описание маршрута",
    duration_text: "2 часа",
    price_from_kopecks: 125_000,
    meeting_point: "У фонтана",
    max_participants: 12,
    photo_urls: ["/photos/batumi.jpg"],
    status: "pending_review",
    region: "Батуми",
    category: "nature",
  });
  updateGuideTemplateMock.mockResolvedValue(baseTemplate);
});

describe("GuideExcursionsScreen", () => {
  it("renders the empty state when the guide has no excursions", async () => {
    render(<GuideExcursionsScreen />);

    expect(await screen.findByText("Экскурсий пока нет")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Добавить экскурсию" })).toBeInTheDocument();
  });

  it("renders existing excursions from loaded guide templates", async () => {
    guideTemplates.value = [
      baseTemplate,
      {
        ...baseTemplate,
        id: "template-2",
        title: "Горы и водопады",
        status: "draft",
        photo_urls: [],
      },
    ];

    render(<GuideExcursionsScreen />);

    expect(await screen.findByText("Старый город пешком")).toBeInTheDocument();
    expect(screen.getByText("Горы и водопады")).toBeInTheDocument();
    expect(screen.getByText("Опубликована")).toBeInTheDocument();
    expect(screen.getByText("Черновик")).toBeInTheDocument();
  });

  it("opens the create form with the current required fields and actions", async () => {
    render(<GuideExcursionsScreen />);

    fireEvent.click(await screen.findByRole("button", { name: "Добавить экскурсию" }));

    expect(screen.getByText("Новая экскурсия")).toBeInTheDocument();
    expect(screen.getByLabelText(/Название/)).toBeInTheDocument();
    expect(screen.getByText("Цена")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "за группу" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "за человека" })).toBeInTheDocument();
    expect(screen.getByLabelText("Цена, ₽")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument();
  });

  it("defaults new excursions to per-group pricing", async () => {
    render(<GuideExcursionsScreen />);

    fireEvent.click(await screen.findByRole("button", { name: "Добавить экскурсию" }));

    expect(screen.getByRole("radio", { name: "за группу" })).toHaveAttribute("data-state", "on");
    expect(screen.getByRole("radio", { name: "за человека" })).toHaveAttribute("data-state", "off");
  });

  it("shows the current title validation error and does not save without a title", async () => {
    render(<GuideExcursionsScreen />);

    fireEvent.click(await screen.findByRole("button", { name: "Добавить экскурсию" }));
    fireEvent.change(screen.getByLabelText("Цена, ₽"), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(screen.getByText("Название обязательно.")).toBeInTheDocument();
    expect(createGuideTemplateMock).not.toHaveBeenCalled();
    expect(updateGuideTemplateMock).not.toHaveBeenCalled();
  });

  it("saves a new excursion for review by default", async () => {
    guidePhotos.value = [
      { id: "photo-1", location_name: "Батуми", object_path: "batumi.jpg" },
    ];

    render(<GuideExcursionsScreen />);

    fireEvent.click(await screen.findByRole("button", { name: "Добавить экскурсию" }));
    fireEvent.change(screen.getByLabelText(/Название/), {
      target: { value: "  Новый маршрут  " },
    });
    fireEvent.change(screen.getByLabelText("Текст отклика"), {
      target: { value: "Описание маршрута" },
    });
    fireEvent.change(screen.getByLabelText("Длительность"), {
      target: { value: "2 часа" },
    });
    fireEvent.change(screen.getByLabelText("Цена, ₽"), {
      target: { value: "1250" },
    });
    fireEvent.change(screen.getByLabelText("Место сбора"), {
      target: { value: "У фонтана" },
    });
    fireEvent.change(screen.getByLabelText("Макс. участников в группе"), {
      target: { value: "12" },
    });
    selectLocation("Батуми");
    selectCategory("Природа");
    fireEvent.click(screen.getByRole("button", { name: "Выбрать фото маршрута" }));
    fireEvent.click(screen.getByRole("button", { name: "Батуми" }));
    fireEvent.click(screen.getByRole("button", { name: "Готово" }));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByText("Новый маршрут")).toBeInTheDocument();
    expect(createGuideTemplateMock).toHaveBeenCalledWith({
      title: "Новый маршрут",
      description: "Описание маршрута",
      durationText: "2 часа",
      priceScope: "per_group",
      priceFromRub: 1250,
      meetingPoint: "У фонтана",
      maxParticipants: 12,
      photoUrls: ["/photos/batumi.jpg"],
      region: "Батуми",
      category: "nature",
    });
  });

  it("saves per-person pricing when the guide selects за человека", async () => {
    guidePhotos.value = [
      { id: "photo-1", location_name: "Батуми", object_path: "batumi.jpg" },
    ];
    createGuideTemplateMock.mockResolvedValue({
      ...baseTemplate,
      id: "created-template",
      title: "Индивидуальный маршрут",
      price_scope: "per_person",
      price_from_kopecks: 150_000,
      status: "pending_review",
    });

    render(<GuideExcursionsScreen />);

    fireEvent.click(await screen.findByRole("button", { name: "Добавить экскурсию" }));
    fireEvent.change(screen.getByLabelText(/Название/), {
      target: { value: "Индивидуальный маршрут" },
    });
    selectPriceScope("за человека");
    fireEvent.change(screen.getByLabelText("Цена, ₽"), {
      target: { value: "1500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Выбрать фото маршрута" }));
    fireEvent.click(screen.getByRole("button", { name: "Батуми" }));
    fireEvent.click(screen.getByRole("button", { name: "Готово" }));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByText("Индивидуальный маршрут")).toBeInTheDocument();
    expect(createGuideTemplateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Индивидуальный маршрут",
        priceScope: "per_person",
        priceFromRub: 1500,
      }),
    );
  });

  it("does not expose a draft bypass in the create form", async () => {
    render(<GuideExcursionsScreen />);

    fireEvent.click(await screen.findByRole("button", { name: "Добавить экскурсию" }));

    expect(screen.queryByRole("button", { name: "Черновик" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Отправить на проверку" })).not.toBeInTheDocument();
    expect(
      screen.getByText(/отправляется на проверку и публикуется после одобрения/i),
    ).toBeInTheDocument();
  });

  it("keeps the location and category selects controlled while filling the form", async () => {
    // Radix warns via console.warn when a Select flips uncontrolled → controlled,
    // which is what passing `undefined` for an empty value used to do.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<GuideExcursionsScreen />);

    fireEvent.click(await screen.findByRole("button", { name: "Добавить экскурсию" }));
    selectLocation("Батуми");
    selectCategory("Природа");

    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining("changing from uncontrolled to controlled"),
    );
    warn.mockRestore();
  });

  it("prefills the edit form with the selected excursion values", async () => {
    guideTemplates.value = [baseTemplate];

    render(<GuideExcursionsScreen />);

    expect(await screen.findByText("Старый город пешком")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Изменить" }));

    expect(screen.getByText("Изменить экскурсию")).toBeInTheDocument();
    expect(screen.getByLabelText(/Название/)).toHaveValue("Старый город пешком");
    expect(screen.getByLabelText("Текст отклика")).toHaveValue(
      "Покажу дворики, смотровые и тихие улочки.",
    );
    expect(screen.getByLabelText("Длительность")).toHaveValue("3 часа");
    expect(screen.getByLabelText("Цена, ₽")).toHaveValue(4500);
    expect(screen.getByRole("radio", { name: "за человека" })).toHaveAttribute("data-state", "on");
    expect(screen.getByRole("radio", { name: "за группу" })).toHaveAttribute("data-state", "off");
    expect(screen.getByLabelText("Место сбора")).toHaveValue("Площадь Свободы");
    expect(screen.getByLabelText("Макс. участников в группе")).toHaveValue(8);
    expect(screen.getByRole("combobox", { name: "Локация" })).toHaveTextContent(
      "Тбилиси, Грузия",
    );
    expect(screen.getByRole("combobox", { name: "Категория" })).toHaveTextContent(
      "История и культура",
    );
    expect(screen.getByText("Выбрано: 1 фото")).toBeInTheDocument();
  });
});
