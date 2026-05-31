import { describe, expect, it } from "vitest";

import { STORAGE_ASSET_UPSERT_ON_CONFLICT } from "./upload";

describe("storage upload", () => {
  it("uses storage_assets unique key columns for upsert onConflict", () => {
    expect(STORAGE_ASSET_UPSERT_ON_CONFLICT).toBe("bucket_id,object_path");
  });
});
