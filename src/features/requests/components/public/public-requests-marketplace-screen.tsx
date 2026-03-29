"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

import type { OpenRequestRecord } from "@/data/open-requests/types";
import { ReqCard } from "@/components/shared/req-card";

const STATIC_AVATARS = ["АК", "МЛ", "ТГ", "ВС", "ОР", "ЛК", "ИА", "ДМ"];

const CATEGORY_PILLS = ["Все", "Природа", "Города", "Север", "Зима", "Семейные"] as const;
type CategoryPill = (typeof CATEGORY_PILLS)[number];

function deriveAvatars(sizeCurrent: number): string[] {
  return STATIC_AVATARS.slice(0, Math.min(sizeCurrent, STATIC_AVATARS.length));
}

function derivePrice(budgetPerPersonRub?: number): string {
  if (!budgetPerPersonRub) return "По договорённости";
  return `${new Intl.NumberFormat("ru-RU").format(budgetPerPersonRub)} ₽ / чел`;
}

interface Props {
  initialData?: OpenRequestRecord[] | null;
}

export function PublicRequestsMarketplaceScreen({ initialData }: Props) {
  const requests = initialData ?? [];

  const [activeCategory, setActiveCategory] = useState<CategoryPill>("Все");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (searchQuery && !r.destinationLabel.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Category filtering: for demo, "Все" shows all; others filter by keywords in destinationLabel / highlights
      if (activeCategory !== "Все") {
        const haystack = [r.destinationLabel, ...(r.highlights ?? [])].join(" ").toLowerCase();
        const categoryMap: Record<Exclude<CategoryPill, "Все">, string[]> = {
          Природа: ["байкал", "алтай", "карелия", "камчатка", "природа", "лес", "гора", "степь"],
          Города: ["казань", "суздаль", "калининград", "москва", "питер", "город"],
          Север: ["мурманск", "кольский", "север", "арктика", "ямал"],
          Зима: ["зима", "лёд", "снег", "лыжи", "сноуборд"],
          Семейные: ["семья", "семейн", "дети", "ребёнок"],
        };
        const keywords = categoryMap[activeCategory as Exclude<CategoryPill, "Все">] ?? [];
        if (!keywords.some((kw) => haystack.includes(kw))) return false;
      }
      return true;
    });
  }, [requests, activeCategory, searchQuery]);

  return (
    <main>
      {/* Page header */}
      <section
        className="page-header"
        style={{
          background: "var(--surface-low)",
          paddingTop: "100px",
          paddingBottom: "48px",
          textAlign: "center",
        }}
      >
        <div className="container">
          <p className="sec-label">Биржа запросов</p>
          <h1 className="sec-title">Открытые группы путешественников по России</h1>
          <p
            style={{
              maxWidth: "760px",
              margin: "16px auto 0",
              fontSize: "1rem",
              color: "var(--on-surface-muted)",
              lineHeight: 1.65,
            }}
          >
            Выберите направление, присоединяйтесь к формирующейся группе или создайте свой запрос —
            и гиды предложат маршрут под вашу компанию.
          </p>

          {/* Search bar */}
          <div
            style={{
              width: "min(560px, 100%)",
              margin: "28px auto 0",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 8px 8px 22px",
              borderRadius: "9999px",
              background: "rgba(249,249,255,0.60)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(194,198,214,0.18)",
              boxShadow: "0 8px 32px rgba(25,28,32,0.06)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: "var(--on-surface-muted)", flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по направлению или маршруту"
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--on-surface)",
                fontSize: "0.9375rem",
              }}
            />
          </div>

          <div style={{ marginTop: "20px" }}>
            <Link href="/requests/new" className="btn-primary">
              Создать запрос
            </Link>
          </div>
        </div>
      </section>

      {/* Filter pills */}
      <section
        style={{
          background: "var(--surface)",
          paddingBlock: "20px",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {CATEGORY_PILLS.map((pill) => (
              <button
                key={pill}
                type="button"
                className={`filter-pill${activeCategory === pill ? " active" : ""}`}
                onClick={() => setActiveCategory(pill)}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Requests grid */}
      <section
        style={{
          background: "var(--surface)",
          paddingBlock: "48px",
        }}
      >
        <div className="container">
          {filteredRequests.length > 0 ? (
            <div className="requests-grid">
              {filteredRequests.map((request) => {
                const location = request.destinationLabel.split(",")[0].trim();
                const fillPct = Math.round(
                  (request.group.sizeCurrent / request.group.sizeTarget) * 100,
                );
                return (
                  <ReqCard
                    key={request.id}
                    href={`/requests/${request.id}`}
                    location={location}
                    spotsLabel={`${request.group.sizeCurrent} / ${request.group.sizeTarget} мест`}
                    title={request.highlights[0] ?? request.destinationLabel}
                    date={request.dateRangeLabel}
                    desc={request.highlights[1]}
                    fillPct={fillPct}
                    avatars={deriveAvatars(request.group.sizeCurrent)}
                    price={derivePrice(request.budgetPerPersonRub)}
                  />
                );
              })}
            </div>
          ) : (
            <p
              style={{
                textAlign: "center",
                color: "var(--on-surface-muted)",
                padding: "48px 0",
                fontSize: "1rem",
              }}
            >
              Ничего не найдено. Попробуйте изменить запрос или фильтр.
            </p>
          )}
        </div>
      </section>

      {/* CTA strip */}
      <section
        className="section low"
        style={{
          background: "var(--surface-low)",
          paddingBlock: "48px",
          textAlign: "center",
        }}
      >
        <div className="container">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.875rem, 3vw, 2.5rem)",
              fontWeight: 600,
              marginBottom: "18px",
              color: "var(--on-surface)",
            }}
          >
            Не нашли подходящую группу?
          </h2>
          <p
            style={{
              color: "var(--on-surface-muted)",
              fontSize: "1rem",
              marginBottom: "24px",
              maxWidth: "480px",
              margin: "0 auto 24px",
            }}
          >
            Создайте свой запрос — гиды предложат маршрут специально под вашу компанию.
          </p>
          <Link href="/requests/new" className="btn-primary">
            Создать запрос
          </Link>
        </div>
      </section>
    </main>
  );
}
