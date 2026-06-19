import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { SiteFooter } from "@/components/shared/site-footer";
import type { DestinationOption, RequestRecord } from "@/data/supabase/queries";

import { HomepageRequestFormClassic } from "./homepage-request-form-classic";

interface Props {
  destinations: DestinationOption[];
  requests: RequestRecord[];
}

export function HomePageShell2Classic({ destinations }: Props) {
  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-5 py-10 md:px-8">
        <PageHeader
          eyebrow="ЗАЯВКА"
          title="Заполните заявку вручную"
          subtitle="Опишите поездку — местные гиды предложат варианты."
        />
        <div className="mt-8 rounded-[16px] border border-border bg-surface-lowest p-6 md:p-8">
          <HomepageRequestFormClassic destinations={destinations} />
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-on-surface-muted transition-colors hover:text-on-surface"
          >
            Быстрый подбор через вопросы →
          </Link>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
