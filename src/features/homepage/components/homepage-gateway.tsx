import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Coins, Star, Users } from "lucide-react";

import {
  type HomeHeroAction,
  type HomeMiniListing,
  type HomeMiniRequest,
  homeContainerClass,
  homepageContent,
} from "@/features/homepage/components/homepage-content";
import { cn } from "@/lib/utils";

const gatewayGlassClass =
  "rounded-[28px] border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.58)] p-6 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-[20px] backdrop-saturate-150 sm:p-7";

export function HomePageGateway() {
  const { requests, listings } = homepageContent.gateway;

  return (
    <section
      className={cn(
        homeContainerClass,
        "relative z-20 -mt-11 pb-8 sm:-mt-12 lg:-mt-[3.25rem]",
      )}
    >
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-5">
        <GatewayCard
          title={requests.title}
          description={requests.description}
          actions={requests.actions}
          className={gatewayGlassClass}
        >
          <div className="mt-6 grid gap-2.5 sm:grid-cols-3 sm:gap-2.5">
            {requests.cards.map((card, index) => (
              <MiniRequestCard key={`${card.destination}-${card.datesLabel}-${index}`} card={card} />
            ))}
          </div>
        </GatewayCard>

        <GatewayCard
          title={listings.title}
          description={listings.description}
          actions={listings.actions}
          className={gatewayGlassClass}
        >
          <div className="mt-6 overflow-hidden pr-1">
            <div className="flex w-[calc(100%+72px)] gap-2.5">
              {listings.cards.map((card) => (
                <MiniListingCard key={card.title} card={card} />
              ))}
            </div>
          </div>
        </GatewayCard>
      </div>
    </section>
  );
}

function GatewayCard({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: string;
  description: string;
  actions: readonly HomeHeroAction[];
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={className}>
      <div className="space-y-2">
        <h2 className="text-[1.25rem] font-semibold tracking-tight text-[var(--color-text)]">
          {title}
        </h2>
        <p className="max-w-[34rem] text-[0.8125rem] leading-relaxed text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {actions.map((action) => (
          <GatewayAction key={action.label} action={action} />
        ))}
      </div>

      {children}
    </article>
  );
}

function GatewayAction({ action }: { action: HomeHeroAction }) {
  return (
    <Link
      href={action.href}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-full px-[1.15rem] text-[0.8125rem] font-semibold transition-[transform,box-shadow] duration-200 hover:-translate-y-px",
        action.tone === "primary"
          ? "bg-[var(--color-primary)] text-white shadow-[0_12px_28px_rgba(15,118,110,0.22)]"
          : "border border-[rgba(203,213,225,0.95)] bg-[rgba(255,255,255,0.55)] text-[var(--color-text)] shadow-[0_6px_16px_rgba(15,23,42,0.05)] backdrop-blur-md",
      )}
    >
      {action.label}
    </Link>
  );
}

function MiniRequestCard({ card }: { card: HomeMiniRequest }) {
  return (
    <Link
      href={card.href}
      className="group relative flex min-h-[168px] flex-col rounded-[14px] border border-[rgba(226,232,240,0.95)] bg-[rgba(255,255,255,0.72)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_22px_rgba(15,23,42,0.05)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5"
    >
      {card.badge ? (
        <span className="absolute right-2.5 top-2.5 inline-flex items-center rounded-full bg-[var(--color-amber)] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-white shadow-sm">
          {card.badge}
        </span>
      ) : null}

      <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
        <Users className="size-3.5" strokeWidth={1.75} />
        <span className="text-[0.6875rem] font-medium">Группа</span>
      </div>

      <div className="mt-2.5 space-y-1.5">
        <p className="text-[0.8125rem] font-semibold text-[var(--color-text)]">{card.destination}</p>
        <div className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--color-text-secondary)]">
          <CalendarDays className="size-3" strokeWidth={1.75} />
          <span>{card.groupLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--color-text-secondary)]">
          <Coins className="size-3" strokeWidth={1.75} />
          <span>{card.priceLabel}</span>
        </div>
        <p className="text-[0.6875rem] text-[var(--color-text-secondary)]">{card.datesLabel}</p>
      </div>

      <div className="mt-auto flex items-center pt-3">
        {card.avatars.map((avatar, index) => (
          <div
            key={avatar}
            className="relative size-[18px] overflow-hidden rounded-full border-2 border-white shadow-sm"
            style={{ marginLeft: index === 0 ? 0 : -6 }}
          >
            <Image src={avatar} alt="" fill sizes="18px" className="object-cover" />
          </div>
        ))}
      </div>
    </Link>
  );
}

function MiniListingCard({ card }: { card: HomeMiniListing }) {
  return (
    <Link
      href={card.href}
      className="group relative min-w-[168px] max-w-[200px] flex-[1_0_30%] overflow-hidden rounded-[14px] border border-[rgba(226,232,240,0.9)] bg-[rgba(255,255,255,0.78)] shadow-[0_12px_26px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="relative h-20 overflow-hidden">
        <Image
          src={card.imageUrl}
          alt={card.title}
          fill
          sizes="200px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05)_0%,rgba(15,23,42,0.22)_100%)]" />
        {card.badge ? (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center rounded-full bg-[rgba(217,119,6,0.92)] px-2 py-0.5 text-[0.625rem] font-semibold text-white shadow-sm">
            {card.badge}
          </span>
        ) : null}
      </div>

      <div className="space-y-1.5 p-3">
        <div>
          <p className="text-[0.75rem] font-semibold text-[var(--color-text)]">{card.title}</p>
          <p className="text-[0.6875rem] text-[var(--color-text-secondary)]">{card.subtitle}</p>
        </div>

        <div className="flex items-center gap-1 text-[0.6875rem] text-[var(--color-text-secondary)]">
          <Star className="size-3 fill-[var(--color-amber)] text-[var(--color-amber)]" strokeWidth={1.25} />
          <span>{card.ratingLabel}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="relative size-5 overflow-hidden rounded-full border border-white/90 ring-1 ring-black/5">
            <Image
              src={card.guideAvatarUrl}
              alt=""
              fill
              sizes="20px"
              className="object-cover"
            />
          </div>
          <span className="text-[0.6875rem] font-semibold text-[var(--color-text)]">{card.priceLabel}</span>
        </div>
      </div>
    </Link>
  );
}
