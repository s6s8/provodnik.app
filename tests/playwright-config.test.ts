import { describe, it, expect } from "vitest";
import config from "../playwright.config";

describe("playwright config", () => {
  it("baseURL points at the local dev server", () => {
    expect(config.use?.baseURL).toBe("http://localhost:3000");
  });

  it("boots the dev server via a webServer block", () => {
    expect(config.webServer).toBeDefined();
    const ws = Array.isArray(config.webServer)
      ? config.webServer[0]
      : config.webServer;
    expect(ws).toBeDefined();
    expect(ws!.command).toMatch(/dev/);
    expect(ws!.url).toBe("http://localhost:3000");
    expect(ws!.reuseExistingServer).toBe(true);
  });
});
