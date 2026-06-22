import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const globalsCss = read("../globals.css");
const layoutTsx = read("../layout.tsx");

describe("design tokens — additive layer", () => {
  it("globals.css declares the new Layer-1 tint and line tokens", () => {
    for (const token of [
      "--primary-tint",
      "--amber-tint",
      "--green-tint",
      "--line",
      "--line-2",
    ]) {
      expect(globalsCss).toContain(token);
    }
  });

  it("globals.css declares the new Layer-2 radius and shadow tokens", () => {
    for (const token of [
      "--radius-pill",
      "--radius-step",
      "--radius-hero",
      "--shadow-lift",
    ]) {
      expect(globalsCss).toContain(token);
    }
  });

  it("globals.css maps the new tokens into @theme inline utilities", () => {
    for (const token of [
      "--color-primary-tint",
      "--color-line",
      "--color-danger",
      "--color-info",
    ]) {
      expect(globalsCss).toContain(token);
    }
  });

  it("layout.tsx loads Onest weights 500 and 800", () => {
    expect(layoutTsx).toMatch(/weight:\s*\[[^\]]*"500"[^\]]*\]/);
    expect(layoutTsx).toMatch(/weight:\s*\[[^\]]*"800"[^\]]*\]/);
  });
});
