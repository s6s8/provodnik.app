import Image from "next/image";
import { ArrowDown } from "lucide-react";

import type { DestinationOption } from "@/data/supabase/queries";
import { cityImage } from "@/lib/city-image";

import { HomepageRequestFormClassic } from "./homepage-request-form-classic";

interface Props {
  destinations: DestinationOption[];
}

export function HomepageHeroFormClassic({ destinations }: Props) {
  const heroImage = cityImage(destinations[0]?.name ?? "Байкал");

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#0c1622]">
      <Image
        src={heroImage}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_44%]"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,22,0.66)_0%,rgba(8,14,22,0.22)_28%,rgba(8,14,22,0.3)_58%,rgba(8,14,22,0.82)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-[2] flex flex-1 flex-col items-center justify-center px-[clamp(20px,4vw,44px)] pb-24 pt-32 text-center">
        <h1 className="mb-7 font-display text-[clamp(46px,6vw,68px)] font-extrabold leading-none tracking-[-0.04em] text-white">
          Куда отправимся?
        </h1>

        <div className="w-full max-w-[440px] rounded-[22px] bg-surface p-5 text-left shadow-[0_30px_64px_-24px_rgba(8,14,24,0.55)]">
          <HomepageRequestFormClassic destinations={destinations} />
        </div>

        <p className="mt-4 text-[13px] font-medium text-white/80">
          Бесплатно · без регистрации · гиды обычно отвечают в течение дня
        </p>
      </div>

      <div className="absolute bottom-6 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-1.5 text-xs font-semibold tracking-[0.04em] text-white/75">
        <span>Открытые группы</span>
        <ArrowDown className="h-[18px] w-[18px] motion-safe:animate-bounce" aria-hidden="true" />
      </div>
    </section>
  );
}
