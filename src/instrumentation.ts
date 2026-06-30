import * as Sentry from "@sentry/nextjs";

const sentryDisabled =
  process.env.SENTRY_DISABLED === "1" || process.env.NEXT_PUBLIC_SENTRY_DISABLED === "1";

export async function register() {
  if (sentryDisabled) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = sentryDisabled ? () => undefined : Sentry.captureRequestError;
