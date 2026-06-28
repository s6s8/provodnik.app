import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Design-sync preview provider. Defines a `process` global at bundle-eval so the
 * many components that read `process.env.*` (Next internals, env helpers) don't
 * throw in the browser, and supplies a react-query client for components that use
 * data hooks. Wrapped around every preview via cfg.provider.
 */
const globalWithProcess = globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};

if (typeof globalWithProcess.process === "undefined") {
  globalWithProcess.process = { env: { NODE_ENV: "development" } };
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

export function DsProvider({ children }: { children?: React.ReactNode }) {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}
