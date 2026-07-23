import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// /help is a core, always-on page now: it must render the real help centre and
// never fall back to the 404 UI, regardless of feature flags.
const notFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/lib/flags", () => ({
  flags: {
    FEATURE_TR_PAYMENT: false,
  },
}));

// HelpSearch now owns the category accordions, so the stub echoes the article
// titles the page hands it — that is what proves the fallback FAQ reached it.
vi.mock("@/components/help/HelpSearch", () => ({
  HelpSearch: ({
    groups,
  }: {
    groups: { id: string; label: string; articles: { id: string; title: string }[] }[];
  }) => (
    <div>
      {groups.flatMap((group) => group.articles).map((article) => (
        <div key={article.id}>{article.title}</div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/help/HelpArticle", () => ({
  HelpArticle: ({ body }: { body: string }) => <div>{body}</div>,
}));

import HelpPage from "./page";

describe("HelpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseServerClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(async () => ({ data: [], error: null })),
        })),
      })),
    });
  });

  it("renders the real help centre rather than the 404 UI", async () => {
    render(await HelpPage());

    expect(notFound).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { level: 1, name: "Центр помощи" }),
    ).toBeInTheDocument();
    // Falls back to the built-in FAQ when the table is empty.
    expect(screen.getByText("Как забронировать экскурсию?")).toBeInTheDocument();
    // Support escape hatch is always present.
    expect(screen.getByRole("link", { name: /Написать в поддержку/ })).toBeInTheDocument();
  });

  it("hides payment-category articles when FEATURE_TR_PAYMENT is off", async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(async () => ({
            data: [
              {
                id: "8a000000-0000-4000-8000-000000000001",
                slug: "payment-test",
                category: "payment",
                title: "Секретная оплата",
                body_md: "Payment copy",
                position: 1,
              },
              {
                id: "8a000000-0000-4000-8000-000000000002",
                slug: "booking-test",
                category: "booking",
                title: "Публичное бронирование",
                body_md: "Booking copy",
                position: 2,
              },
            ],
            error: null,
          })),
        })),
      })),
    });

    render(await HelpPage());

    expect(screen.queryByText("Секретная оплата")).not.toBeInTheDocument();
    expect(screen.getByText("Публичное бронирование")).toBeInTheDocument();
  });
});
