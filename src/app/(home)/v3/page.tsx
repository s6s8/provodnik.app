import type { Metadata } from "next";

import { SiteHeaderServer } from "@/components/shared/site-header-server";
import { SiteFooter } from "@/components/shared/site-footer";
import { HeroConversation } from "@/features/homepage3/components/hero-conversation";

export const metadata: Metadata = {
  title: "Проводник — опишите поездку",
  description:
    "Опишите поездку своими словами — подберём местного гида под ваш запрос.",
};

export default function HomeV3Page() {
  return (
    <>
      <SiteHeaderServer />
      <main className="pt-nav-h">
        <HeroConversation />
      </main>
      <SiteFooter />
    </>
  );
}
