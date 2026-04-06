import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import { joinRequestAction } from "@/app/(site)/requests/[requestId]/actions";

function JoinGroupForm({ requestId }: { requestId: string }) {
  const action = joinRequestAction.bind(null, requestId);
  return (
    <form action={action}>
      <Button type="submit" className="w-full justify-center">
        Присоединиться к группе
      </Button>
    </form>
  );
}

type GuideOffer = {
  id: string;
  guideName: string;
  guideInitials: string;
  rating?: string;
  priceTotalRub: number;
  href?: string;
};

interface Props {
  request: OpenRequestRecord;
  offers?: GuideOffer[] | null;
  currentUserId?: string | null;
  isMember?: boolean;
  showJoinButton?: boolean;
  memberCount?: number;
}

function formatPrice(rub?: number): string {
  if (!rub) return "По договорённости";
  return `${new Intl.NumberFormat("ru-RU").format(rub)} ₽ / чел`;
}

/**
 * Build up to 5 evenly distributed data points between groupSizeMin and
 * groupSizeMax, given a fixed total budget in rubles.
 */
function buildPriceScenarios(
  budgetRub: number,
  groupSizeMin: number,
  groupSizeMax: number,
): Array<{ size: number; pricePerPerson: number }> {
  if (budgetRub <= 0 || groupSizeMin < 1 || groupSizeMax < groupSizeMin) {
    return [];
  }

  const range = groupSizeMax - groupSizeMin;

  if (range === 0) {
    // Single scenario
    return [
      {
        size: groupSizeMin,
        pricePerPerson: Math.round(budgetRub / groupSizeMin),
      },
    ];
  }

  // Pick up to 5 evenly-spaced points — always include min and max
  const maxPoints = 5;
  const points: number[] = [];

  if (range + 1 <= maxPoints) {
    // Include every integer
    for (let s = groupSizeMin; s <= groupSizeMax; s++) {
      points.push(s);
    }
  } else {
    // Evenly space maxPoints across [min, max]
    for (let i = 0; i < maxPoints; i++) {
      const fraction = i / (maxPoints - 1);
      const size = Math.round(groupSizeMin + fraction * range);
      if (!points.includes(size)) points.push(size);
    }
  }

  return points.map((size) => ({
    size,
    pricePerPerson: Math.round(budgetRub / size),
  }));
}

function formatRub(rub: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(rub)} ₽`;
}

export function PublicRequestDetailScreen({
  request,
  offers,
  currentUserId,
  isMember = false,
  showJoinButton = false,
  memberCount,
}: Props) {
  const fillPct = Math.min(
    100,
    Math.round((request.group.sizeCurrent / request.group.sizeTarget) * 100),
  );
  const members = request.members ?? [];
  const visibleMembers = members.slice(0, 5);
  const overflowCount = members.length - visibleMembers.length;
  const heroImage =
    request.imageUrl ??
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1800&q=80";

  const heroLabel = request.regionLabel
    ? `Открытая группа · ${request.regionLabel}`
    : "Открытая группа";

  const title = request.highlights[0] ?? request.destinationLabel;
  const description = request.highlights[1] ?? "";
  const aboutText =
    request.highlights.slice(2).join(" ") || request.highlights.join(" ");

  // Price scenarios: use budgetPerPersonRub * sizeTarget as total budget proxy
  const totalBudget =
    request.budgetPerPersonRub && request.group.sizeTarget
      ? request.budgetPerPersonRub * request.group.sizeTarget
      : 0;

  const priceScenarios =
    totalBudget > 0
      ? buildPriceScenarios(totalBudget, 1, request.group.sizeTarget)
      : [];

  // Current active size for highlighting
  const activeMemberCount = memberCount ?? request.group.sizeCurrent;

  // Find the highlighted column — closest to current member count
  const highlightedSize =
    priceScenarios.length > 0
      ? priceScenarios.reduce((prev, curr) =>
          Math.abs(curr.size - activeMemberCount) <
          Math.abs(prev.size - activeMemberCount)
            ? curr
            : prev,
        ).size
      : null;

  return (
    <main>
      {/* Hero */}
      <section className="relative -mt-nav-h flex min-h-[480px] items-end overflow-hidden [--on-surface:#fff] [--on-surface-muted:rgba(255,255,255,0.72)]">
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[rgba(15,23,42,0.78)] to-[rgba(15,23,42,0.06)]"
          aria-hidden="true"
        />
        <div className="relative z-[2] mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] pb-14 pt-[calc(var(--nav-h)+48px)] [--outline-variant:rgba(255,255,255,0.20)]">
          <div className="max-w-[760px]">
            <p className="mb-3 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-white/75">
              {heroLabel}
            </p>
            <h1 className="font-display text-[clamp(2.4rem,5vw,3rem)] font-semibold leading-[1.04] text-white">
              {title}
            </h1>
            {description && (
              <p className="mt-4 text-base leading-[1.65] text-white/80">
                {description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-surface py-[56px] pb-20">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            {/* Left column */}
            <div>
              {/* Status card */}
              <article className="mb-6 rounded-card bg-surface-high p-7 shadow-card">
                <div className="mb-[18px] flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <h2 className="text-base font-semibold text-on-surface">
                    Участники группы
                  </h2>
                  <div className="flex items-center gap-2.5">
                    {/* Avatar stack */}
                    {visibleMembers.length > 0 && (
                      <div className="flex items-center">
                        {visibleMembers.map((m, i) => (
                          <Avatar
                            key={m.id}
                            className={`size-7 border-2 border-surface-high ${i === 0 ? "ml-0" : "-ml-1.5"}`}
                            title={m.displayName}
                          >
                            <AvatarImage
                              src={m.avatarUrl ?? undefined}
                              alt={m.displayName}
                            />
                            <AvatarFallback className="bg-surface-low text-[0.5625rem] font-semibold">
                              {m.initials}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {overflowCount > 0 && (
                          <Avatar
                            className="size-7 -ml-1.5 border-2 border-surface-high"
                            title={`Ещё ${overflowCount} участник(а)`}
                          >
                            <AvatarFallback className="bg-surface-low text-[0.5625rem] font-semibold">
                              +{overflowCount}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                    <span className="text-[0.875rem] text-on-surface-muted">
                      {request.group.sizeCurrent} из {request.group.sizeTarget}{" "}
                      мест занято
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <Progress value={fillPct} className="mb-[22px] h-1" />

                {/* Meta grid */}
                <dl className="grid gap-x-5 gap-y-[18px] sm:grid-cols-2">
                  <div>
                    <dt className="mb-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
                      Даты
                    </dt>
                    <dd className="text-[0.9375rem] font-medium text-on-surface">
                      {request.dateRangeLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
                      Направление
                    </dt>
                    <dd className="text-[0.9375rem] font-medium text-on-surface">
                      {request.destinationLabel.split(",")[0].trim()}
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
                      Бюджет
                    </dt>
                    <dd className="text-[0.9375rem] font-medium text-on-surface">
                      {formatPrice(request.budgetPerPersonRub)}
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
                      Формат
                    </dt>
                    <dd className="text-[0.9375rem] font-medium text-on-surface">
                      {request.group.openToMoreMembers
                        ? "Открыта запись"
                        : "Группа закрыта"}
                    </dd>
                  </div>
                </dl>
              </article>

              {/* Price scenarios */}
              {priceScenarios.length > 0 && (
                <div className="mb-6">
                  <p className="mb-3 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Стоимость на человека
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {priceScenarios.map(({ size, pricePerPerson }) => (
                      <div
                        key={size}
                        className={`rounded-card border px-4 py-3 text-center shadow-card ${
                          highlightedSize === size
                            ? "border-primary/30 bg-primary/[0.08]"
                            : "border-outline-variant/30 bg-surface-high"
                        }`}
                      >
                        <div className="text-sm font-medium text-muted-foreground">
                          {size} чел.
                        </div>
                        <div className="mt-1 text-base font-semibold text-foreground">
                          {formatRub(pricePerPerson)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* О маршруте */}
              <section className="pt-6">
                <h2 className="mb-[14px] font-display text-[1.75rem] leading-[1.1] text-on-surface">
                  О маршруте
                </h2>
                <p className="text-[0.9375rem] leading-[1.72] text-on-surface-muted">
                  {aboutText}
                </p>
              </section>

              {/* Что запланировано */}
              {request.highlights.length > 1 && (
                <section className="pt-8">
                  <h2 className="mb-[14px] font-display text-[1.75rem] leading-[1.1] text-on-surface">
                    Что запланировано
                  </h2>
                  <ul className="grid gap-3">
                    {request.highlights.map((item, i) => (
                      <li
                        key={i}
                        className="text-[0.9375rem] leading-[1.72] text-on-surface-muted"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Right column — sticky offer card */}
            <aside>
              <div className="sticky top-24 rounded-card bg-surface-high p-7 shadow-card">
                {/* Price */}
                <div className="mb-2 font-display text-[2.5rem] leading-none text-on-surface">
                  {formatPrice(request.budgetPerPersonRub)}
                </div>
                <p className="mb-5 text-[0.875rem] text-on-surface-muted">
                  на человека при заполнении группы
                </p>

                {/* Join / Member state */}
                {isMember ? (
                  <span className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-success/10 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-success">
                    Вы участник ✓
                  </span>
                ) : showJoinButton ? (
                  <JoinGroupForm requestId={request.id} />
                ) : !currentUserId ? (
                  <Button asChild className="w-full justify-center">
                    <Link href={`/auth?next=/requests/${request.id}`}>
                      Войти и присоединиться
                    </Link>
                  </Button>
                ) : null}

                {/* Divider */}
                <div className="my-[22px] h-px bg-outline-variant/30" />

                {/* Guide offers */}
                <p className="mb-3 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Офферы гидов
                </p>
                <div className="grid gap-3">
                  {offers && offers.length > 0 ? (
                    offers.map((offer) => (
                      <article
                        key={offer.id}
                        className="grid gap-3 rounded-card bg-background/70 p-4 shadow-card"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-[38px]">
                              <AvatarFallback className="bg-surface-low text-[0.75rem] font-semibold text-primary">
                                {offer.guideInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <strong className="block text-[0.9375rem] text-on-surface">
                                {offer.guideName}
                              </strong>
                              {offer.rating && (
                                <span className="text-[0.8125rem] text-on-surface-muted">
                                  {offer.rating} ★
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[0.875rem] font-semibold text-on-surface">
                            {new Intl.NumberFormat("ru-RU").format(
                              offer.priceTotalRub,
                            )}{" "}
                            ₽ / группа
                          </span>
                        </div>
                        <Button
                          asChild
                          variant="outline"
                          className="justify-center"
                        >
                          <Link href={offer.href ?? "#"}>Посмотреть</Link>
                        </Button>
                      </article>
                    ))
                  ) : (
                    <p className="text-[0.9375rem] leading-[1.65] text-on-surface-muted">
                      Пока нет предложений. Запрос уже виден гидам в системе.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
