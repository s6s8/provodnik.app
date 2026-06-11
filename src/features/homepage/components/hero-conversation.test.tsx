import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockRouterRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({ auth: { getUser: mockGetUser } }),
}));

vi.mock("@/app/(protected)/traveler/requests/new/actions", () => ({
  createRequestAction: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/dates", () => ({
  todayMoscowISODate: () => "2026-06-02",
}));

vi.mock("@/features/homepage-classic/components/homepage-auth-gate", () => ({
  HomepageAuthGate: ({ open }: { open: boolean }) =>
    open ? <div data-testid="auth-gate-open" /> : null,
}));

import { HeroConversation } from "./hero-conversation";

function mockParseResponse(body: unknown) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  }) as unknown as typeof fetch;
}

const COMPLETE_BODY = {
  fields: {
    destination: "Москва",
    startDate: "2026-06-03",
    startTime: null,
    endTime: null,
    groupSize: 2,
    budgetPerPersonRub: 5000,
    interests: ["history_culture", "food"],
    requestedLanguages: [],
    notes: null,
  },
  missingRequired: [],
  complete: true,
  assistantMessage: "Готово! Проверьте детали ниже и отправьте запрос гидам.",
};

describe("HeroConversation", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
  });

  it("shows the initial prompt and no create button before any input", () => {
    render(<HeroConversation />);
    expect(screen.getByText(/куда, когда, сколько вас и бюджет/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /подобрать гида/i })).not.toBeInTheDocument();
  });

  it("fills chips and enables create after a complete parse", async () => {
    mockParseResponse(COMPLETE_BODY);
    render(<HeroConversation />);

    fireEvent.change(screen.getByLabelText(/опишите вашу поездку/i), {
      target: { value: "Москва на завтра, нас двое, 5000, история и еда" },
    });
    fireEvent.click(screen.getByRole("button", { name: /отправить/i }));

    await waitFor(() => {
      expect(screen.getByText("Москва")).toBeInTheDocument();
    });
    expect(screen.getByText(/5\s?000 ₽/)).toBeInTheDocument();
    expect(screen.getByText(/заполнено 5 из 5/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /подобрать гида/i })).toBeEnabled();
  });

  it("keeps create disabled and shows the next question when a field is missing", async () => {
    mockParseResponse({
      fields: { ...COMPLETE_BODY.fields, startDate: null },
      missingRequired: ["startDate"],
      complete: false,
      assistantMessage: "На какую дату планируете поездку?",
    });
    render(<HeroConversation />);

    fireEvent.change(screen.getByLabelText(/опишите вашу поездку/i), {
      target: { value: "Москва, нас двое, 5000, история" },
    });
    fireEvent.click(screen.getByRole("button", { name: /отправить/i }));

    await waitFor(() => {
      expect(screen.getByText(/на какую дату/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /подобрать гида/i })).not.toBeInTheDocument();
  });
});
