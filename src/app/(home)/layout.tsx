import type { ReactNode } from "react";

import { SiteHeader } from "@/components/shared/site-header";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="pt-[88px]">{children}</main>
    </>
  );
}
