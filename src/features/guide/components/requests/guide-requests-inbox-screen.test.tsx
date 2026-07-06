import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mapRequestRow, type RequestRecord } from "@/data/supabase/queries";

import { GuideInboxCardHeader } from "./guide-inbox-card-header";
import { filterInbox, getInboxTabCounts } from "./guide-requests-inbox-filter";
import { GuideRequestsInboxScreen } from "./guide-requests-inbox-screen";

const { createSupabaseBrowserClientMock, loadGuideInboxRequestsMock } = vi.hoisted(() => ({
  createSupabaseBrowserClientMock: vi.fn(),
  loadGuideInboxRequestsMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: createSupabaseBrowserClientMock,
}));

vi.mock("@/app/(protected)/guide/inbox/actions", () => ({
  loadGuideInboxRequests: loadGuideInboxRequestsMock,
}));

const baseRequest: RequestRecord = {
  id: "req-1",
  destination: "Элиста, центр",
  destinationSlug: "elista",
  destinationRegion: "Калмыкия",
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
  requesterAvatarUrl: null,
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

function request(overrides: Partial<RequestRecord>): RequestRecord {
  return { ...baseRequest, ...overrides };
}

describe("filterInbox", () => {
  it("restricts visible requests to the guide base city", () => {
    const items = [
      request({ id: "elista", destination: "Элиста, центр" }),
      request({ id: "karelia", destination: "Карелия, Рускеала" }),
    ];

    const filtered = filterInbox(items, {
      baseCity: "Элиста",
      cityFilter: "all",
      filter: "new",
      offeredIds: new Set(),
      sortKey: "newest",
      specializations: [],
    });

    expect(filtered.map((item) => item.id)).toEqual(["elista"]);
  });

  it("renders no requests when none match the guide base city", () => {
    const items = [
      request({ id: "elista", destination: "Элиста, центр" }),
      request({ id: "karelia", destination: "Карелия, Рускеала" }),
    ];

    const filtered = filterInbox(items, {
      baseCity: "Псков",
      cityFilter: "all",
      filter: "new",
      offeredIds: new Set(),
      sortKey: "newest",
      specializations: [],
    });

    expect(filtered).toEqual([]);
  });
});

describe("getInboxTabCounts", () => {
  const scopeOptions = {
    baseCity: "Элиста",
    cityFilter: "all",
    offeredIds: new Set(["elista-b", "karelia-c"]),
    sortKey: "newest" as const,
    specializations: [] as string[],
  };

  it("counts «Новые» only for unanswered requests in the guide base city", () => {
    const items = [
      request({ id: "elista-a", destination: "Элиста, центр" }),
      request({ id: "elista-b", destination: "Элиста, музеи" }),
      request({ id: "karelia-c", destination: "Карелия, Рускеала" }),
    ];

    const { newCount } = getInboxTabCounts(items, scopeOptions);

    expect(newCount).toBe(1);
    expect(
      filterInbox(items, { ...scopeOptions, filter: "new" }).length,
    ).toBe(newCount);
  });

  it("counts «Мои предложения» only for offers in the guide base city", () => {
    const items = [
      request({ id: "elista-a", destination: "Элиста, центр" }),
      request({ id: "elista-b", destination: "Элиста, музеи" }),
      request({ id: "karelia-c", destination: "Карелия, Рускеала" }),
    ];

    const { myOffersCount } = getInboxTabCounts(items, scopeOptions);

    expect(myOffersCount).toBe(1);
    expect(
      filterInbox(items, { ...scopeOptions, filter: "my-offers" }).length,
    ).toBe(myOffersCount);
  });
});

describe("GuideRequestsInboxScreen meta layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadGuideInboxRequestsMock.mockResolvedValue({
      data: [
        request({ id: "elista", destination: "Элиста, центр" }),
        request({ id: "karelia", destination: "Карелия, Рускеала" }),
      ],
      error: null,
    });
    createSupabaseBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "guide-1" } },
          error: null,
        }),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
      from: vi.fn((table: string) => {
        const query = {
          select: vi.fn(() => query),
          eq: vi.fn(() => query),
          maybeSingle: vi.fn().mockResolvedValue({
            data:
              table === "guide_profiles"
                ? {
                    specializations: [],
                    base_city: "Элиста",
                    verification_status: "approved",
                  }
                : null,
            error: null,
          }),
        };
        if (table === "guide_offers") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          };
        }
        return query;
      }),
    });
  });


  it("loads request rows through the server-side inbox loader", async () => {
    render(<GuideRequestsInboxScreen />);

    await waitFor(() => {
      expect(loadGuideInboxRequestsMock).toHaveBeenCalledTimes(1);
    });
  });


  it("renders request rows when offers metadata fails", async () => {
    createSupabaseBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "guide-1" } },
          error: null,
        }),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
      from: vi.fn((table: string) => {
        if (table === "guide_offers") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: null, error: { message: "offers down" } }),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  specializations: [],
                  base_city: "Элиста",
                  verification_status: "approved",
                },
                error: null,
              }),
            })),
          })),
        };
      }),
    });

    render(<GuideRequestsInboxScreen />);

    expect(await screen.findByText("Элиста, центр")).toBeInTheDocument();
    expect(
      screen.getByText("Запросы загружены, но часть данных по откликам временно недоступна."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Не удалось загрузить запросы. Попробуйте обновить страницу.")).toBeNull();
  });

  it("keeps the request time inline with the date meta row", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/guide/components/requests/guide-requests-inbox-screen.tsx",
      ),
      "utf8",
    );
    const metaBlock = source.match(/\{\/\* Meta \*\/\}([\s\S]*?)\{\/\* Actions \*\/\}/)?.[1];

    expect(metaBlock).toContain(
      'className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground"',
    );
    expect(metaBlock).not.toContain("sm:grid-cols-2");
    expect(metaBlock).toMatch(
      /<p>[\s\S]*Даты:[\s\S]*formatTimeRange\(item\.startTime, item\.endTime\)[\s\S]*Время:[\s\S]*<\/p>/,
    );
  });

  it("uses auth.getUser() rather than auth.getSession() for guide identity", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/guide/components/requests/guide-requests-inbox-screen.tsx",
      ),
      "utf8",
    );

    expect(source).toContain("auth.getUser()");
    expect(source).not.toContain("auth.getSession()");
  });
});

describe("GuideInboxCardHeader", () => {
  it("renders «Путешественник» (not real name) on the guide inbox card", () => {
    render(
      <GuideInboxCardHeader
        item={request({
          id: "r1",
          requesterName: "Анна Петрова",
          destination: "Элиста",
          interests: ["nature", "history_culture"],
        })}
        matched={false}
      />,
    );

    expect(screen.queryByText("Анна Петрова")).toBeNull();
    expect(screen.getByText("Путешественник")).toBeInTheDocument();
  });

  it("renders a ProfileAvatar (not initials) for the traveler row", () => {
    render(
      <GuideInboxCardHeader
        item={request({
          id: "r1",
          requesterName: "Анна",
          requesterAvatarUrl: "/avatars/anna.jpg",
          destination: "Элиста",
        })}
        matched={false}
      />,
    );

    expect(screen.getByRole("img")).toHaveAttribute("src", "/avatars/anna.jpg");
  });

  it("does not render the word «Поездка» as a card title prefix", () => {
    render(
      <GuideInboxCardHeader
        item={request({ id: "r1", destination: "Элиста", interests: [] })}
        matched={false}
      />,
    );

    expect(screen.queryByText(/^Поездка/)).toBeNull();
  });

  it("renders the actual themes in the top-right (not the «Соответствует» phrase)", () => {
    render(
      <GuideInboxCardHeader
        item={request({
          id: "r1",
          destination: "Элиста",
          interests: ["nature", "history_culture"],
        })}
        matched={false}
      />,
    );

    expect(screen.queryByText(/Соответствует/)).toBeNull();
    expect(
      screen.getByText(/природа.*история и культура|история и культура.*природа/i),
    ).toBeInTheDocument();
  });

  it("renders a cleaned mapped destination instead of polluted text", () => {
    const item = mapRequestRow({
      id: "r1",
      destination: "МоскваМосква",
      notes: JSON.stringify({
        destinationLabel:
          "Москва, Санкт-Петербург… placeholder=Москва, Санкт-Петербург… autocomplete=list",
      }),
      starts_on: "2026-06-10",
      ends_on: "2026-06-10",
      participants_count: 2,
      category: "city",
      status: "open",
      created_at: "2026-01-01T00:00:00Z",
    });

    render(<GuideInboxCardHeader item={item} matched={false} />);

    expect(screen.getByText("Москва, Санкт-Петербург…")).toBeInTheDocument();
    expect(screen.queryByText(/placeholder|autocomplete/i)).toBeNull();
  });
});
