import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import {
  markOnboardingComplete,
  saveOnboardingStep,
} from "./completeOnboarding";

function makeSupabase(opts: {
  user?: { id: string } | null;
  profile?: Record<string, unknown> | null;
  updateResult?: { error: Error | null; count: number | null };
}) {
  const query = {
    select: vi.fn(() => query),
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({
      data: opts.profile ?? { notification_prefs: {} },
      error: null,
    }),
    then: vi.fn(),
  };
  query.then.mockImplementation((resolve, reject) =>
    Promise.resolve(opts.updateResult ?? { error: null, count: 1 }).then(
      resolve,
      reject,
    ),
  );

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: opts.user ?? { id: "guide-1" } },
        error: null,
      }),
    },
    from: vi.fn(() => query),
  };

  createSupabaseServerClientMock.mockResolvedValue(supabase);
  return { supabase, query };
}

describe("guide onboarding actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists selected regions to guide_profiles when saving onboarding", async () => {
    const { query } = makeSupabase({
      profile: { notification_prefs: { existing: true } },
    });

    await saveOnboardingStep(2, { regions: ["moscow", "spb"] });

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        regions: ["moscow", "spb"],
      }),
      { count: "exact" },
    );
  });

  it("throws when saving an onboarding step updates no guide profile", async () => {
    makeSupabase({
      updateResult: { error: null, count: 0 },
    });

    await expect(saveOnboardingStep(1, {})).rejects.toThrow(
      "Профиль гида не найден или не доступен.",
    );
  });

  it("throws before DB work when saving an invalid onboarding step", async () => {
    createSupabaseServerClientMock.mockRejectedValue(
      new Error("unexpected DB work"),
    );

    await expect(saveOnboardingStep(-1, {})).rejects.toThrow("invalid_step");
  });

  it("throws when marking onboarding complete updates no guide profile", async () => {
    makeSupabase({
      updateResult: { error: null, count: 0 },
    });

    await expect(markOnboardingComplete()).rejects.toThrow(
      "Профиль гида не найден или не доступен.",
    );
  });
});
