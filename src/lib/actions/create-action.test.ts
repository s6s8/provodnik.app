import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const { captureException } = vi.hoisted(() => ({ captureException: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException }));

import { ActionError, createAction } from "./create-action";

describe("createAction", () => {
  beforeEach(() => {
    captureException.mockClear();
  });

  it("returns ok+data on success", async () => {
    const echo = createAction(z.object({ name: z.string().min(1) }), async (i) => i.name);
    expect(await echo({ name: "x" })).toEqual({ ok: true, data: "x" });
  });

  it("returns a validation error and does not run the handler", async () => {
    const handler = vi.fn();
    const action = createAction(z.object({ name: z.string().min(1) }), handler);
    const result = await action({ name: "" });
    expect(result.ok).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it("maps ActionError to its message without Sentry", async () => {
    const action = createAction(z.object({}), async () => {
      throw new ActionError("нельзя");
    });
    expect(await action({})).toEqual({ ok: false, error: "нельзя" });
    expect(captureException).not.toHaveBeenCalled();
  });

  it("captures unknown throws to Sentry and returns a generic error", async () => {
    const action = createAction(z.object({}), async () => {
      throw new Error("db down");
    });
    const result = await action({});
    expect(result.ok).toBe(false);
    expect(result).toEqual({
      ok: false,
      error: "Что-то пошло не так. Попробуйте ещё раз.",
    });
    expect(captureException).toHaveBeenCalledOnce();
  });

  it("tags the Sentry capture with the provided context", async () => {
    const action = createAction(
      z.object({}),
      async () => {
        throw new Error("boom");
      },
      { context: "offers.accept" },
    );
    await action({});
    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      { tags: { context: "offers.accept" } },
    );
  });

  it("rejects a non-object payload at the validation boundary", async () => {
    const handler = vi.fn();
    const action = createAction(z.object({ name: z.string() }), handler);
    expect(await action("not-an-object")).toEqual({
      ok: false,
      error: "Некорректные данные.",
    });
    expect(await action(null)).toEqual({ ok: false, error: "Некорректные данные." });
    expect(handler).not.toHaveBeenCalled();
    expect(captureException).not.toHaveBeenCalled();
  });

  it("passes the parsed (coerced) data to the handler", async () => {
    const action = createAction(
      z.object({ count: z.coerce.number() }),
      async (input) => input.count + 1,
    );
    expect(await action({ count: "41" })).toEqual({ ok: true, data: 42 });
  });
});
