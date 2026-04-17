"use client";

import * as React from "react";
import Link from "next/link";

import { ReqCard } from "@/components/shared/req-card";
import { Button } from "@/components/ui/button";
import type { AuthContext } from "@/lib/auth/types";
import { cn } from "@/lib/utils";
import { listTravelerRequestsFromSupabase } from "@/data/traveler-request/supabase-client";
import type { TravelerRequestRecord } from "@/data/traveler-request/types";

// ─── helpers ────────────────────────────────────────────────────────────────

function deriveName(auth: AuthContext | null | undefined): string {
  if (!auth) return "Путешественник";
  if (auth.email) {
    const local = auth.email.split("@")[0];
    // capitalise first char and replace dots/underscores with spaces
    return local
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Путешественник";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function statusBadge(
  status: TravelerRequestRecord["status"]
): { label: string; cls: string } {
  switch (status) {
    case "offers_received":
    case "submitted":
      return {
        label: "Активный",
        cls: "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary",
      };
    case "shortlisted":
      return {
        label: "Набор группы",
        cls: "inline-flex items-center gap-1.5 rounded-full bg-surface-low px-2.5 py-1 text-xs font-semibold text-muted-foreground",
      };
    case "booked":
    case "closed":
      return {
        label: "Завершён",
        cls: "inline-flex items-center gap-1.5 rounded-full bg-[rgba(13,114,82,0.10)] px-2.5 py-1 text-xs font-semibold text-[#0d7252]",
      };
    default:
      return {
        label: "Черновик",
        cls: "inline-flex items-center gap-1.5 rounded-full bg-surface-low px-2.5 py-1 text-xs font-semibold text-muted-foreground",
      };
  }
}

// ─── types ───────────────────────────────────────────────────────────────────

interface Props {
  auth?: AuthContext | null;
  requests?: TravelerRequestRecord[] | null;
}

// ─── component ───────────────────────────────────────────────────────────────

export function TravelerDashboardScreen({ auth, requests }: Props) {
  const displayName = deriveName(auth);
  const userInitials = initials(displayName);
  const email = auth?.email ?? null;

  const [loaded, setLoaded] = React.useState<TravelerRequestRecord[]>([]);

  React.useEffect(() => {
    if (requests) return;
    let cancelled = false;
    void listTravelerRequestsFromSupabase()
      .then((data) => { if (!cancelled) setLoaded(data); })
      .catch(() => { if (!cancelled) setLoaded([]); });
    return () => { cancelled = true; };
  }, [requests]);

  const items = requests ?? loaded;

  // stats
  const activeCount = items.filter(
    (r) => r.status === "submitted" || r.status === "offers_received"
  ).length;
  const offersCount = 0;
  const confirmedCount = items.filter(
    (r) => r.status === "booked" || r.status === "shortlisted"
  ).length;

  return (
    <>
      <section className="bg-surface pt-[110px] pb-8">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <p className="mb-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Личный кабинет
          </p>
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.05]">
            Добро пожаловать, {displayName}
          </h1>
          <p className="mt-3.5 text-muted-foreground">
            Ваши активные запросы, группы и предложения гидов.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="self-start rounded-card bg-surface-high p-5 shadow-card max-lg:static lg:sticky lg:top-24">
              <div className="flex size-[72px] items-center justify-center rounded-full bg-surface-low font-display text-2xl font-semibold text-primary">
                {userInitials}
              </div>

              <strong className="mt-3 block text-[0.9375rem]">{displayName}</strong>

              {email && (
                <small className="mt-1 block text-[0.8125rem] text-muted-foreground">
                  {email}
                </small>
              )}

              <div className="my-[18px] h-px bg-outline-variant/30" />

              <nav className="grid gap-1" aria-label="Навигация по кабинету">
                {[
                  { label: "Мои запросы", href: "/dashboard", active: true },
                  { label: "Группы", href: "/dashboard/groups", active: false },
                  {
                    label: "Офферы гидов",
                    href: "/dashboard/offers",
                    active: false,
                  },
                  {
                    label: "Бронирования",
                    href: "/dashboard/bookings",
                    active: false,
                  },
                ].map(({ label, href, active }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "block rounded-[10px] px-3 py-2 text-sm font-medium text-muted-foreground no-underline transition-[background,color] duration-150 hover:bg-primary/5 hover:text-foreground",
                      active && "bg-primary/[0.08] font-semibold text-primary"
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </aside>

            <div>
              <div className="mb-5 flex items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-semibold">Мои запросы</h2>
                <Button asChild>
                  <Link href="/requests/new">Создать запрос</Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map((record) => {
                  const { request, id, status } = record;
                  const badge = statusBadge(status);
                  const offers: number = 0;
                  const budget = request.budgetPerPersonRub;
                  const priceLabel = `от ${budget.toLocaleString("ru-RU")} ₽ / чел.`;
                  const startFmt = new Date(request.startDate).toLocaleDateString(
                    "ru-RU",
                    { day: "numeric", month: "short" }
                  );
                  const endFmt = new Date(request.endDate).toLocaleDateString(
                    "ru-RU",
                    { day: "numeric", month: "short" }
                  );
                  const spotsLabel = `${request.groupSize} чел.`;

                  const fillMap: Record<string, number> = {
                    draft: 10,
                    submitted: 30,
                    offers_received: 65,
                    shortlisted: 80,
                    booked: 100,
                    closed: 100,
                  };
                  const fillPct = fillMap[status] ?? 30;

                  return (
                    <div key={id} className="relative">
                      <span className={cn("pointer-events-none absolute top-4 right-4 z-[1]", badge.cls)}>
                        {badge.label}
                      </span>

                      <ReqCard
                        href={`/requests/${id}`}
                        location={request.destination}
                        spotsLabel={spotsLabel}
                        title={`${request.destination} · ${startFmt}–${endFmt}`}
                        date={`${request.groupSize} чел. · ${offers} ${offers === 1 ? "оффер" : offers >= 2 && offers <= 4 ? "оффера" : "офферов"}`}
                        desc={request.notes ?? undefined}
                        fillPct={fillPct}
                        price={priceLabel}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { value: activeCount, label: "активных запроса" },
                  { value: offersCount, label: "оффера от гидов" },
                  { value: confirmedCount, label: "подтверждённых поездки" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-surface-lowest p-5 text-center shadow-card"
                  >
                    <strong className="block font-display text-[2rem] font-semibold leading-none">
                      {value}
                    </strong>
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
