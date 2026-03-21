import Link from "next/link";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSeededOpenRequests } from "@/data/open-requests/seed";

import type { OpenRequestRecord } from "@/data/open-requests/types";

import { PublicRequestCard } from "./public-request-card";

function getOpenRequests(requests: OpenRequestRecord[]) {
  // Marketplace shows public groups that are not closed.
  return requests.filter(
    (r) => r.status === "open" || r.status === "forming_group",
  );
}

export function PublicRequestsMarketplaceScreen() {
  const requests = getOpenRequests(getSeededOpenRequests());

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
          Маркетплейс запросов
        </h1>
        <p className="text-base text-muted-foreground">
          Присоединяйтесь к группам и путешествуйте по лучшей цене
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="default" size="lg" className="rounded-full">
            <Link href="/requests/new">Создать запрос</Link>
          </Button>
        </div>
      </header>

      <div className="glass-panel rounded-[1.5rem] border border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
            aria-pressed="true"
          >
            Все регионы
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
            aria-pressed="false"
          >
            По дате
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
            aria-pressed="false"
          >
            По бюджету
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
            aria-pressed="false"
          >
            По размеру группы
          </button>
        </div>
      </div>

      {requests.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {requests.map((request) => (
            <PublicRequestCard key={request.id} request={request} />
          ))}
        </section>
      ) : (
        <section className="glass-panel rounded-[1.5rem] border border-white/10 p-8">
          <div className="space-y-4">
            <Users className="size-10 text-white/20" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Нет открытых запросов
              </h3>
            </div>
            <Button asChild variant="default" size="lg" className="w-full rounded-full">
              <Link href="/requests/new">Создать запрос</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

