import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { linkPrefetchByHref } = vi.hoisted(() => ({
  linkPrefetchByHref: [] as Array<{ href: string; prefetch?: boolean | null }>,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    prefetch,
    children,
    ...rest
  }: {
    href: string;
    prefetch?: boolean | null;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    linkPrefetchByHref.push({ href, prefetch });
    return (
      <a href={href} data-prefetch={prefetch === undefined ? "default" : String(prefetch)} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn(async () => ({ data: [] })),
    })),
  })),
}));

vi.mock("@/data/supabase/queries", () => ({
  getActiveGuideDestinations: vi.fn(async () => ({ data: [] })),
  getGuideBySlug: vi.fn(async () => null),
  getHomepageRequests: vi.fn(async () => ({ data: [] })),
}));

vi.mock("@/lib/supabase/homepage", () => ({
  getHomepageInventory: vi.fn(async () => ({
    data: { listings: [], guides: [], reviews: [] },
  })),
}));

vi.mock("@/lib/supabase/guide-template-listings", () => ({
  getPublishedTemplateDetail: vi.fn(async () => null),
}));

vi.mock("@/lib/flags", () => ({
  flags: { FEATURE_PUBLIC_CATALOG: false },
}));

vi.mock("@/components/shared/site-header-server", () => ({
  SiteHeaderServer: () => <header data-testid="site-header" />,
}));

vi.mock("@/features/homepage-classic/components/homepage-shell2-classic", () => ({
  HomePageShell2Classic: () => <main data-testid="homepage-shell" />,
}));

import HomePage from "./page";

describe("HomePage route preparation", () => {
  beforeEach(() => {
    linkPrefetchByHref.length = 0;
  });

  it("eagerly prefetches /guides from the server-rendered homepage", async () => {
    render(
      await HomePage({
        searchParams: Promise.resolve({}),
      }),
    );

    const guidesLinks = linkPrefetchByHref.filter((entry) => entry.href === "/guides");
    expect(guidesLinks.length).toBeGreaterThanOrEqual(1);
    expect(guidesLinks.some((entry) => entry.prefetch === true)).toBe(true);
  });
});
