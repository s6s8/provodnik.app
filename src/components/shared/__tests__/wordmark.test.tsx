import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/features/messaging/hooks/use-unread-count", () => ({
  useUnreadCount: () => ({ unreadCount: 0, refetch: vi.fn() }),
}));

import { SiteHeader } from "../site-header";
import { SiteFooter } from "../site-footer";

describe("Cyrillic «Проводник» wordmark", () => {
  it("renders the Cyrillic brand name in the header without the Latin form", () => {
    const { container } = render(<SiteHeader />);

    expect(container.textContent).toContain("Проводник");
    expect(container.textContent).not.toContain("Provodnik");
  });

  it("renders the Cyrillic brand name in the footer without the Latin form", () => {
    const { container } = render(<SiteFooter />);

    expect(container.textContent).toContain("Проводник");
    expect(container.textContent).not.toContain("Provodnik");
  });
});
