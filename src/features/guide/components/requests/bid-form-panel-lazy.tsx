"use client";

import dynamic from "next/dynamic";

// ssr:false is only valid inside a client component — this wrapper is that boundary.
export const BidFormPanel = dynamic(
  () => import("./bid-form-panel").then((m) => m.BidFormPanel),
  { ssr: false, loading: () => null },
);
