import type { ReactNode } from "react";

import { SiteHeader } from "@/components/shared/site-header";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
