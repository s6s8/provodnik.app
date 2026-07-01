import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createSupabaseServerClient, signOut } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
  getSiteUrl: () => "https://provodnik.app",
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

  it("redirects to the public host from x-forwarded-host behind a proxy", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/signout", {
      method: "POST",
      headers: {
        "x-forwarded-host": "vps.provodnik.app",
        "x-forwarded-proto": "https",
      },
    });

    const response = await route.POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://vps.provodnik.app/");
  });

  it("never sends production users to localhost when the host is not forwarded", async () => {
    const original = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "production");

    const request = new NextRequest("http://localhost:3000/api/auth/signout", {
      method: "POST",
    });

    const response = await route.POST(request);

    expect(response.headers.get("location")).toBe("https://provodnik.app/");

    vi.stubEnv("NODE_ENV", original ?? "test");
  });
});
