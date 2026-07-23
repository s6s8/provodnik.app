import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("overlay z-index tokens", () => {
  it("defines the ERR-094 stacking tier in globals.css", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    expect(css).toContain("--z-100: 100");
    expect(css).toContain("--z-110: 110");
    expect(css).toContain("--z-120: 120");
  });

  it("uses theme z-index utilities in the shared sheet primitive", () => {
    const sheet = readFileSync(
      join(process.cwd(), "src/components/ui/sheet.tsx"),
      "utf8",
    );

    expect(sheet).toContain("z-110");
    expect(sheet).toContain("z-120");
    expect(sheet).not.toContain("z-[110]");
    expect(sheet).not.toContain("z-[120]");
  });

  it("uses the nav z-index token in the site header", () => {
    const header = readFileSync(
      join(process.cwd(), "src/components/shared/site-header.tsx"),
      "utf8",
    );

    expect(header).toContain("z-100");
    expect(header).not.toContain("z-[100]");
  });
});
