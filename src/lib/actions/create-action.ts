import * as Sentry from "@sentry/nextjs";
import type { z } from "zod";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const GENERIC_ERROR = "Что-то пошло не так. Попробуйте ещё раз.";

/** Throw this inside a handler for a known, user-facing failure (message shown to the user). */
export class ActionError extends Error {}

/**
 * Standard server-action wrapper: zod-validate -> run -> never throw.
 * - validation failure -> { ok:false, error:"Некорректные данные." }
 * - ActionError thrown  -> { ok:false, error: <its message> }
 * - any other throw     -> Sentry.captureException + { ok:false, error: GENERIC_ERROR }
 */
export function createAction<S extends z.ZodType, T>(
  schema: S,
  handler: (input: z.infer<S>) => Promise<T>,
  options?: { context?: string },
) {
  return async (raw: unknown): Promise<ActionResult<T>> => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: "Некорректные данные." };

    try {
      return { ok: true, data: await handler(parsed.data) };
    } catch (err) {
      if (err instanceof ActionError) return { ok: false, error: err.message };

      Sentry.captureException(err, { tags: { context: options?.context ?? "server-action" } });
      return { ok: false, error: GENERIC_ERROR };
    }
  };
}
