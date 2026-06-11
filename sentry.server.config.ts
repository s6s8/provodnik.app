// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://172cc3b1dce7af98ef7db96709e88d1d@o4510705499701248.ingest.de.sentry.io/4510705502191696",

  // Define how likely traces are sampled by transaction path.
  tracesSampler: (samplingContext) => {
    const name = samplingContext?.name ?? "";
    if (name.includes("/admin/")) return 0.5;
    if (name.includes("/bookings") || name.includes("/offer")) return 0.3;
    return 0.1;
  },

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
