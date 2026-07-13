import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// /help is a core, always-on page now: it must render the real help centre and
// never fall back to the 404 UI, regardless of feature flags.
const notFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(async () => ({ data: [], error: null })),
      })),
    })),
  })),
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
});
