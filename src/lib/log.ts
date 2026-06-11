import * as Sentry from "@sentry/nextjs";

/** Report an error to monitoring without crashing the flow. Dev also logs to the console. */
export function logError(context: string, err: unknown, extra?: Record<string, unknown>) {
  Sentry.captureException(err, { tags: { context }, extra });
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context}]`, err, extra ?? "");
  }
}
