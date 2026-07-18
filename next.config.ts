import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const hasSentryAuthToken = Boolean(process.env.SENTRY_AUTH_TOKEN);
const sentryDisabled =
  process.env.SENTRY_DISABLED === "1" || process.env.NEXT_PUBLIC_SENTRY_DISABLED === "1";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["dev.provodnik.app"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/tours", destination: "/listings", permanent: true },
      // `/search` was a third marketplace template duplicating `/listings`.
      // Fold it into the canonical discovery page (query params pass through).
      { source: "/search", destination: "/listings", permanent: true },
      { source: "/requests/new", destination: "/", permanent: true },
      { source: "/traveler/requests/new", destination: "/", permanent: true },
      { source: "/partner", destination: "/referrals", permanent: true },
      { source: "/guide/verification", destination: "/guide/profile#verification", permanent: true },
      { source: "/profile/guide/about", destination: "/guide/profile", permanent: true },
      { source: "/profile/guide/license", destination: "/guide/profile#license", permanent: true },
      { source: "/profile/guide/legal-information", destination: "/guide/profile#legal", permanent: true },
      { source: "/guide/excursions", destination: "/guide/listings", permanent: true },
      { source: "/guide/orders", destination: "/guide/bookings", permanent: true },
      { source: "/traveler", destination: "/trips", permanent: true },
      { source: "/traveler/requests", destination: "/trips", permanent: true },
      { source: "/traveler/requests/:id", destination: "/requests/:id", permanent: true },
      { source: "/guide/inbox/:id", destination: "/requests/:id", permanent: true },
      { source: "/traveler/requests/:id/sent", destination: "/requests/:id", permanent: true },
      { source: "/traveler/bookings/:id", destination: "/bookings/:id", permanent: true },
      { source: "/traveler/bookings/:id/review", destination: "/bookings/:id/review", permanent: true },
      { source: "/traveler/bookings/:id/dispute", destination: "/bookings/:id/dispute", permanent: true },
      { source: "/traveler/bookings", destination: "/trips", permanent: true },
      { source: "/guide/settings", destination: "/guide/profile", permanent: true },
      // Legacy alias: the guide account/profile lives at /guide/profile. Without
      // this, /guide/account rendered a crashed error boundary (RSC throw) on 200.
      { source: "/guide/account", destination: "/guide/profile", permanent: true },
      { source: "/profile/personal", destination: "/account", permanent: true },
      { source: "/profile/personal/notifications", destination: "/account/notifications", permanent: true },
      { source: "/policies/cancellation", destination: "/trust", permanent: false },
      { source: "/policies/refunds", destination: "/trust", permanent: false },
      { source: "/login", destination: "/auth", permanent: true },
      { source: "/signin", destination: "/auth", permanent: true },
      { source: "/signup", destination: "/auth", permanent: true },
      { source: "/sign-in", destination: "/auth", permanent: true },
      { source: "/sign-up", destination: "/auth", permanent: true },
      { source: "/forgot-password", destination: "/auth/forgot-password", permanent: true },
      { source: "/reset-password", destination: "/auth/update-password", permanent: true },
    ];
  },
};

const sentryConfig = withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "na-3z2",

  project: "javascript-nextjs",

  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Local builds usually run without release credentials; avoid noisy upload warnings.
  silent: !process.env.CI,
  sourcemaps: {
    disable: !hasSentryAuthToken,
  },

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite only when Sentry is enabled.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});

export default sentryDisabled ? nextConfig : sentryConfig;
