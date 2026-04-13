"use client";

import Link from "next/link";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { RequestRecord } from "@/data/supabase/queries";
import { cn } from "@/lib/utils";

interface Props {
  requests: RequestRecord[];
}

function formatPrice(budgetRub: number): string {
  if (!budgetRub) return "По договорённости";
  const k = Math.floor(budgetRub / 1000);
  return `${k} тыс. ₽`;
}

function MemberAvatarChip({ member }: { member: RequestRecord["members"][number] }) {
  const [hasImageError, setHasImageError] = useState(false);
  const showImage = Boolean(member.avatarUrl) && !hasImageError;

  return (
    <Avatar
      className="size-7 -ml-1.5 border-2 border-surface-high first:ml-0"
      title={member.displayName}
    >
      {showImage ? (
        <AvatarImage
          src={member.avatarUrl ?? ""}
          alt={member.displayName}
          loading="lazy"
          decoding="async"
          onError={() => setHasImageError(true)}
        />
      ) : (
        null
      )}
      <AvatarFallback className="bg-surface-low text-[0.5625rem] font-semibold">
        {member.initials}
      </AvatarFallback>
    </Avatar>
  );
}

function MemberAvatars({ members }: { members: RequestRecord["members"] }) {
  if (members.length === 0) return null;

  return (
    <div className="flex items-center">
      {members.slice(0, 5).map((member) => (
        <MemberAvatarChip key={member.id} member={member} />
      ))}
    </div>
  );
}

export function HomePageGateway({ requests }: Props) {
  const [activeTab, setActiveTab] = useState<"traveler" | "guide">("traveler");
  const isTraveler = activeTab === "traveler";

  const travelerCards = requests.slice(0, 3);
  const guideCards = requests.slice(0, 3);

  return (
    <section
      className="relative overflow-hidden bg-surface-low py-sec-pad"
      aria-labelledby="gateway-title"
    >
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="mb-8 flex items-center justify-between">
          <h2
            id="gateway-title"
            className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]"
          >
            Путешественники ищут прямо сейчас
          </h2>
          <Link
            href="/requests"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Все запросы →
          </Link>
        </div>

        <div className="mb-7 flex justify-center">
          <div
            role="tablist"
            aria-label="Роль"
            className="inline-flex gap-0.5 rounded-full border border-outline-variant bg-surface-high p-1"
          >
            <button
              type="button"
              role="tab"
              id="tab-traveler"
              aria-selected={isTraveler}
              aria-controls="panel-traveler"
              onClick={() => setActiveTab("traveler")}
              className={cn(
                "cursor-pointer rounded-full border-none bg-transparent px-[30px] py-2.5 font-sans text-sm font-semibold text-muted-foreground transition-[background,color] duration-200 max-md:flex-1 max-md:px-4",
                isTraveler && "bg-primary text-white",
              )}
            >
              Я путешественник
            </button>
            <button
              type="button"
              role="tab"
              id="tab-guide"
              aria-selected={!isTraveler}
              aria-controls="panel-guide"
              onClick={() => setActiveTab("guide")}
              className={cn(
                "cursor-pointer rounded-full border-none bg-transparent px-[30px] py-2.5 font-sans text-sm font-semibold text-muted-foreground transition-[background,color] duration-200 max-md:flex-1 max-md:px-4",
                !isTraveler && "bg-primary text-white",
              )}
            >
              Я гид
            </button>
          </div>
        </div>

        <div className="relative isolate">
          <div
            role="tabpanel"
            id="panel-traveler"
            aria-labelledby="tab-traveler"
            hidden={!isTraveler}
            className="relative z-[1] rounded-glass border border-glass-border bg-glass p-8 shadow-glass backdrop-blur-[20px] max-md:p-6"
          >
            {travelerCards.length === 0 ? (
              <p className="text-center text-muted-foreground">Пока нет открытых запросов.</p>
            ) : (
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {travelerCards.map((req) => (
                  <Link
                    key={req.id}
                    href={`/requests/${req.id}`}
                    className="block bg-surface-high text-inherit no-underline rounded-card p-5 shadow-card transition-transform hover:-translate-y-[3px]"
                  >
                    <article>
                      <div className="mb-3.5 flex items-center justify-between gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        <span>{req.destination.split(",")[0]}</span>
                        <span className="text-primary">
                          {req.groupSize} / {req.capacity} мест
                        </span>
                      </div>
                      <p className="mb-1.5 font-sans text-[1.125rem] font-semibold text-foreground">
                        {req.destination}
                      </p>
                      <p className="mb-3.5 line-clamp-2 text-sm leading-[1.55] text-muted-foreground">
                        {req.dateLabel}
                        {req.description ? ` · ${req.description}` : ""}
                      </p>
                      <Progress
                        value={
                          (Math.min(req.groupSize, Math.max(req.capacity, 1)) /
                            Math.max(req.capacity, 1)) *
                          100
                        }
                        max={100}
                        className="mb-3.5 h-1"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <MemberAvatars members={req.members} />
                        <span className="text-sm font-semibold text-foreground">
                          {formatPrice(req.budgetRub)}
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/requests/new">Создать запрос</Link>
              </Button>
            </div>
          </div>

          <div
            role="tabpanel"
            id="panel-guide"
            aria-labelledby="tab-guide"
            hidden={isTraveler}
            className="relative z-[1] rounded-glass border border-glass-border bg-glass p-8 shadow-glass backdrop-blur-[20px] max-md:p-6"
          >
            {guideCards.length === 0 ? (
              <p className="text-center text-muted-foreground">Пока нет открытых запросов.</p>
            ) : (
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {guideCards.map((req) => (
                  <Link
                    key={req.id}
                    href={`/requests/${req.id}`}
                    className="block bg-surface-high text-inherit no-underline rounded-card p-5 shadow-card transition-transform hover:-translate-y-[3px]"
                  >
                    <article>
                      <div className="mb-3.5 flex items-center justify-between gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        <span>{req.destination.split(",")[0]}</span>
                        <span className="text-primary">{req.groupSize} чел.</span>
                      </div>
                      <p className="mb-1.5 font-sans text-[1.125rem] font-semibold text-foreground">
                        {req.destination}
                      </p>
                      <p className="mb-3.5 line-clamp-2 text-sm leading-[1.55] text-muted-foreground">
                        {req.dateLabel} · {req.description || req.format}
                      </p>
                      <Progress value={100} max={100} className="mb-3.5 h-1" />
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-primary">
                          Ждут предложений
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatPrice(req.budgetRub)}
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/requests">Предложить цену</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
