import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createSupabaseServerClient, signOut } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import * as route from "./route";

describe("/api/auth/signout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseServerClient.mockResolvedValue({
      auth: { signOut },
    });
    signOut.mockResolvedValue({ error: null });
  });

  it("does not expose GET logout", () => {
    expect(route).not.toHaveProperty("GET");
  });

  it("signs out with POST and redirects home", async () => {
    const request = new NextRequest("https://example.test/api/auth/signout", {
      method: "POST",
    });

    const response = await route.POST(request);

    expect(createSupabaseServerClient).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledOnce();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.test/");
  });
});
