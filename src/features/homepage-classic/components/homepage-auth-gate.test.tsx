import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/features/requests/create-request-actions", () => ({
  createRequestAction: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({ auth: { signInWithPassword: vi.fn() } }),
}));

vi.mock("@/features/auth/actions/signUpAction", () => ({
  signUpAction: vi.fn(),
}));

import { HomepageAuthGate } from "./homepage-auth-gate";
import { REQUEST_DRAFT_KEY } from "./use-request-form";

const draft = {
  mode: "assembly",
  interests: ["history_culture"],
  requestedLanguages: ["Русский"],
  destination: "Тбилиси",
  startDate: "2026-05-15",
  dateFlexibility: "exact",
  startTime: "10:00",
  endTime: "12:00",
  groupSize: 3,
  groupSizeCurrent: 3,
  allowGuideSuggestionsOutsideConstraints: true,
  budgetPerPersonRub: 7000,
  notes: "",
};

describe("HomepageAuthGate trip recap", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("recaps the pending trip above the auth form", () => {
    window.sessionStorage.setItem(REQUEST_DRAFT_KEY, JSON.stringify(draft));

    render(<HomepageAuthGate open onOpenChange={vi.fn()} onAuthSuccess={vi.fn()} />);

    expect(screen.getByText("Тбилиси")).toBeInTheDocument();
    expect(screen.getByText("15 мая")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/7\s?000\s?₽/)).toBeInTheDocument();
    // The auth form is still there — the recap only sits above it.
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders without a recap when there is no pending draft", () => {
    render(<HomepageAuthGate open onOpenChange={vi.fn()} onAuthSuccess={vi.fn()} />);

    expect(screen.queryByText("Ваша заявка")).toBeNull();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });
});
