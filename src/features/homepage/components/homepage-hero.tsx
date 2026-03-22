import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

import {
  homeContainerClass,
  homepageContent,
} from "@/features/homepage/components/homepage-content";
import { HomePageNavbar } from "@/features/homepage/components/homepage-navbar";
import { cn } from "@/lib/utils";

const primaryActionClass =
  "inline-flex h-10 items-center justify-center rounded-full bg-[var(--color-primary)] px-7 text-[0.875rem] font-semibold text-white shadow-[0_4px_16px_rgba(15,118,110,0.3)] transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_8px_22px_rgba(15,118,110,0.28)]";

const secondaryActionClass =
  "inline-flex h-10 items-center justify-center rounded-full border border-[rgba(203,213,225,0.95)] bg-[rgba(255,255,255,0.62)] px-7 text-[0.875rem] font-medium text-[var(--color-text)] shadow-[0_6px_18px_rgba(15,23,42,0.06)] backdrop-blur-md transition-[transform,box-shadow] duration-200 hover:-translate-y-px";

export function HomePageHero() {
  const { hero } = homepageContent;

  return (
    <section className={cn(homeContainerClass, "relative pt-2 sm:pt-3")}>
      <div className="relative min-h-[520px] overflow-hidden rounded-[32px] border border-white/70 shadow-[0_28px_80px_rgba(33,49,63,0.14)]">
        <Image
          src={hero.imageUrl}
          alt="Путешественники на берегу большого озера"
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1120px"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.06)_38%,rgba(15,23,42,0.04)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(15,23,42,0.28),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,transparent_0%,rgba(249,248,247,0.55)_100%)]" />

        <div className="relative flex min-h-[520px] flex-col">
          <HomePageNavbar />

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-8 pt-4 text-center sm:px-10 sm:pb-14">
            <p className="text-[0.8125rem] font-medium tracking-[0.05em] text-white/80 drop-shadow-[0_1px_4px_rgba(15,23,42,0.25)]">
              {hero.kicker}
            </p>

            <h1 className="mt-4 max-w-[820px] font-display text-[2.5rem] font-semibold leading-[1.12] text-white drop-shadow-[0_2px_12px_rgba(15,23,42,0.35)] sm:text-[2.85rem] lg:text-[3.35rem]">
              {hero.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>

            <form
              action="/destinations"
              method="get"
              className="mt-6 flex w-full max-w-[480px] items-center gap-2 rounded-full border border-[rgba(203,213,225,0.88)] bg-[rgba(255,255,255,0.72)] px-4 py-2 pl-5 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur-xl backdrop-saturate-150"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                <Search
                  className="size-[17px] shrink-0 text-[var(--color-text-secondary)] opacity-80"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  name="q"
                  aria-label="Поиск направления"
                  placeholder={hero.searchPlaceholder}
                  className="h-9 w-full bg-transparent text-[0.9375rem] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-5 text-[0.8125rem] font-semibold text-white shadow-[0_10px_24px_rgba(15,118,110,0.25)]"
              >
                <Search className="size-3.5 opacity-95" strokeWidth={2.25} />
                {hero.searchButtonLabel}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {hero.actions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={action.tone === "primary" ? primaryActionClass : secondaryActionClass}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
