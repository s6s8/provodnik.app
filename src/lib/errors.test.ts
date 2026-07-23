import { describe, expect, it } from "vitest";
import { z } from "zod";

import { actionFailure, friendlyError } from "./errors";

describe("friendlyError", () => {
  it("surfaces the first Zod issue message", () => {
    const err = z.string().min(3, "Слишком коротко.").safeParse("a");
    expect(friendlyError(err.success ? null : err.error, "fallback")).toBe("Слишком коротко.");
  });

  it("surfaces deliberate app Error messages (auth guards, domain validation)", () => {
    expect(friendlyError(new Error("Доступ только для администраторов."), "fallback")).toBe(
      "Доступ только для администраторов.",
    );
  });

  it("hides raw Postgres/Supabase errors that carry a code", () => {
    const pgError = Object.assign(new Error('duplicate key value violates unique constraint "x"'), {
      code: "23505",
    });
    expect(friendlyError(pgError, "Не удалось сохранить.")).toBe("Не удалось сохранить.");
  });

  it("falls back for non-Error values", () => {
    expect(friendlyError({ message: "raw" }, "fallback")).toBe("fallback");
  });
});

describe("actionFailure", () => {
  it("returns a friendly message and hides raw Postgres errors", () => {
    const pgError = Object.assign(new Error('duplicate key value violates unique constraint "x"'), {
      code: "23505",
    });
    expect(actionFailure(pgError, "Не удалось сохранить.", "test-action")).toBe(
      "Не удалось сохранить.",
    );
  });
});
