import { describe, expect, it, vi } from "vitest";

const { redirectMock, notFoundMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  notFoundMock: vi.fn(() => {
    throw new Error("not-found");
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));

vi.mock("@/lib/flags", () => ({
  flags: { FEATURE_TR_TOURS: false },
}));

import ToursPage from "./page";

describe("/tours legacy route", () => {
  it("redirects to готовые экскурсии instead of rendering visual 404 content", () => {
    expect(() => ToursPage()).toThrow("redirect:/listings");
    expect(redirectMock).toHaveBeenCalledWith("/listings");
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
