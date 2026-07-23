import { z } from "zod";

/**
 * Convert an unknown thrown value into a user-safe message.
 *
 * Zod validation errors carry messages we authored, so surface the first issue.
 * Everything else — notably raw Supabase/Postgres error strings — is hidden
 * behind the caller's friendly Russian fallback so DB internals never leak to
 * the UI (PRD-027).
 */
/**
 * Log a failure for operators and return a user-safe message for action boundaries.
 * Technical Postgres/Supabase details stay in the log, never in the returned string.
 */
export function actionFailure(
  error: unknown,
  fallback: string,
  logContext?: string,
): string {
  if (logContext) {
    console.error(`[${logContext}]`, error);
  }
  return friendlyError(error, fallback);
}

export function friendlyError(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof Error) {
    // Raw Supabase/Postgres errors carry a `code` (e.g. "23505", "PGRST116")
    // and a DB-internal message — never user-safe, so hide behind the fallback.
    // Deliberate app errors (auth guards, domain validation) are plain Errors
    // with a curated Russian message and no code — surface those.
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && code.length > 0) return fallback;
    return error.message;
  }
  return fallback;
}
