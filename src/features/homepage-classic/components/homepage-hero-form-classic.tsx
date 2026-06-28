import Image from "next/image";
import { ArrowDown } from "lucide-react";

import { Scrim } from "@/components/ui/scrim";
import type { DestinationOption } from "@/data/supabase/queries";

import { HomepageRequestFormClassic } from "./homepage-request-form-classic";

const HERO_IMAGE =
  "https://yjzpshutgmhxizosbeef.supabase.co/storage/v1/object/public/listing-media/site/hero-provodnik.png";

interface Props {
  destinations: DestinationOption[];
}

export function HomepageHeroFormClassic({ destinations }: Props) {
  return (
    <section className="relative flex min-h-svh flex-col overflow-hidden bg-overlay">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_44%]"
      />
      <Scrim variant="hero" />

      <div className="relative z-[2] flex flex-1 flex-col items-center justify-center px-gutter pb-24 pt-32 text-center">
        <h1 className="mb-7 font-display text-display font-extrabold leading-none tracking-tighter text-white">
          Куда отправимся?
        </h1>

        <div className="w-full max-w-lg rounded-hero bg-surface p-5 text-left shadow-lift">
          <HomepageRequestFormClassic destinations={destinations} />
        </div>

        <p className="mt-4 text-sm font-medium text-white/80">
          Бесплатно · без регистрации · гиды обычно отвечают в течение дня
        </p>
      </div>

      <div className="absolute bottom-6 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-1.5 text-xs font-semibold tracking-wider text-white/75">
        <span>Открытые группы</span>
        <ArrowDown className="size-4 motion-safe:animate-bounce" aria-hidden="true" />
      </div>
    </section>
  );
}
