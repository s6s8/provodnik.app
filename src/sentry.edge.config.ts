// Sentry initialization for Edge runtime (middleware, edge API routes)
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const sentryDisabled =
  process.env.SENTRY_DISABLED === "1" || process.env.NEXT_PUBLIC_SENTRY_DISABLED === "1";

if (!sentryDisabled) {
  Sentry.init({
    dsn: "https://172cc3b1dce7af98ef7db96709e88d1d@o4510705499701248.ingest.de.sentry.io/4510705502191696",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
