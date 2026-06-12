import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadPlaywrightConfig() {
  const { default: config } = await import("../playwright.config");
  return config;
}

async function loadFixtures() {
  return import("./e2e/fixtures");
}

describe("playwright config", () => {
  it("defaults baseURL to the local dev server", async () => {
    vi.stubEnv("E2E_BASE_URL", undefined);
    const config = await loadPlaywrightConfig();

    expect(config.use?.baseURL).toBe("http://localhost:3000");
  });

  it("boots the dev server when E2E_BASE_URL is not set", async () => {
    vi.stubEnv("E2E_BASE_URL", undefined);
    const config = await loadPlaywrightConfig();

    expect(config.webServer).toBeDefined();
    const ws = Array.isArray(config.webServer)
      ? config.webServer[0]
      : config.webServer;
    expect(ws).toBeDefined();
    expect(ws!.command).toMatch(/dev/);
    expect(ws!.url).toBe("http://localhost:3000");
    expect(ws!.reuseExistingServer).toBe(true);
  });

  it("uses E2E_BASE_URL and skips webServer when provided", async () => {
    vi.stubEnv("E2E_BASE_URL", "https://e2e.example.test");
    const config = await loadPlaywrightConfig();

    expect(config.use?.baseURL).toBe("https://e2e.example.test");
    expect(config.webServer).toBeUndefined();
  });
});

describe("e2e fixtures", () => {
  it("uses seeded QA accounts and QA_SEED_PASSWORD", async () => {
    vi.stubEnv("QA_SEED_PASSWORD", "QaSeed123!");
    const { E2E_READY, SEED_USERS } = await loadFixtures();

    expect(E2E_READY).toBe(true);
    expect(SEED_USERS).toEqual({
      admin: { email: "qa-admin@example.com", password: "QaSeed123!" },
      guide: { email: "qa-guide@example.com", password: "QaSeed123!" },
      traveler: { email: "qa-traveler@example.com", password: "QaSeed123!" },
    });
  });

  it("reports not ready when QA_SEED_PASSWORD is absent", async () => {
    vi.stubEnv("QA_SEED_PASSWORD", undefined);
    const { E2E_READY, SEED_USERS } = await loadFixtures();

    expect(E2E_READY).toBe(false);
    expect(SEED_USERS.admin.password).toBe("");
    expect(SEED_USERS.guide.password).toBe("");
    expect(SEED_USERS.traveler.password).toBe("");
  });
});
