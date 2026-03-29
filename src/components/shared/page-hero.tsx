import Image from "next/image";

import { DestinationBadge } from "@/components/shared/destination-badge";

type PageHeroProps = {
  imageUrl: string;
  imageAlt: string;
  kicker?: string;
  title: string;
  description?: string;
  badges?: string[];
};

export function PageHero({
  imageUrl,
  imageAlt,
  kicker,
  title,
  description,
  badges = [],
}: PageHeroProps) {
  return (
    <section className="px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[2rem] shadow-editorial">
        <div className="relative min-h-[420px] sm:min-h-[520px]">
          <Image src={imageUrl} alt={imageAlt} fill sizes="100vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-[rgba(15,23,42,0.3)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.15),rgba(15,23,42,0.55))]" />

          <div className="relative z-10 flex min-h-[420px] flex-col justify-end gap-5 px-6 py-8 text-white sm:min-h-[520px] sm:px-10 sm:py-10">
            {kicker ? <p className="editorial-kicker text-white/80">{kicker}</p> : null}
            <h1 className="max-w-4xl text-[clamp(2.75rem,5vw,4.25rem)] font-semibold leading-[1.04] text-white">
              {title}
            </h1>
            {description ? <p className="max-w-3xl text-base leading-7 text-white/82">{description}</p> : null}
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {badges.map((badge) => (
                  <DestinationBadge key={badge} name={badge} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
