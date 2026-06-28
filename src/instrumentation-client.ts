// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const sentryDisabled = process.env.NEXT_PUBLIC_SENTRY_DISABLED === "1";

if (!sentryDisabled) {
  Sentry.init({
    dsn: "https://172cc3b1dce7af98ef7db96709e88d1d@o4510705499701248.ingest.de.sentry.io/4510705502191696",

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 0.1,

    // Never send PII to Sentry — GDPR compliance for passport/INN/phone data
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = sentryDisabled
  ? () => undefined
  : Sentry.captureRouterTransitionStart;
