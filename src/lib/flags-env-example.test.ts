import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { flags } from "./flags";

describe("flags documentation contract", () => {
  it("documents every registered flag in .env.example", () => {
    const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");

    for (const flag of Object.keys(flags)) {
      expect(envExample).toContain(flag);
    }

    expect(envExample).not.toContain("FEATURE_TR_HELP");
  });
});
