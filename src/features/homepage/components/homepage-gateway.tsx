"use client";

import Link from "next/link";
import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type TravelerCard = {
  location: string;
  spots: string;
  title: string;
  desc: string;
  fillPct: number;
  avatars: string[];
  price: string;
};

type GuideCard = {
  location: string;
  spots: string;
  title: string;
  desc: string;
  fillPct: number;
  openTag: string;
  price: string;
};

// ── Hardcoded demo data matching the HTML SOT ─────────────────────────────────

const travelerCards: TravelerCard[] = [
  {
    location: "Байкал",
    spots: "4 / 6 мест",
    title: "Ольхон, Иркутская область",
    desc: "24–26 июля · джип, катер и вечер у воды",
    fillPct: 66,
    avatars: ["АК", "МЛ", "ТГ"],
    price: "35–50 тыс. ₽",
  },
  {
    location: "Казань",
    spots: "2 / 4 мест",
    title: "Казанский кремль и старый город",
    desc: "10–12 августа · кремль, медина, ночной Кабан",
    fillPct: 50,
    avatars: ["АС", "ОЗ"],
    price: "18–25 тыс. ₽",
  },
  {
    location: "Мурманск",
    spots: "3 / 5 мест",
    title: "Кольский полуостров, Арктика",
    desc: "5–8 сентября · полярное сияние, саамские истории",
    fillPct: 60,
    avatars: ["ВТ", "НК", "ЗИ"],
    price: "42–58 тыс. ₽",
  },
];

const guideCards: GuideCard[] = [
  {
    location: "Алтай",
    spots: "5 чел.",
    title: "Чуйский тракт, перевалы",
    desc: "2–5 августа · бюджет 40–60 тыс. на группу, нужен транспорт",
    fillPct: 100,
    openTag: "Ждут предложений",
    price: "40–60 тыс. ₽",
  },
  {
    location: "Карелия",
    spots: "4 чел.",
    title: "Ладога, скалы, баня",
    desc: "15–18 июля · водный маршрут, нужна лодка и знаток края",
    fillPct: 100,
    openTag: "Ждут предложений",
    price: "28–40 тыс. ₽",
  },
  {
    location: "Калмыкия",
    spots: "6 чел.",
    title: "Степь, хурулы, Элиста",
    desc: "12–14 сентября · этнопрограмма, степные ночёвки",
    fillPct: 100,
    openTag: "Ждут предложений",
    price: "22–34 тыс. ₽",
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function TravelerReqCard({ card }: { card: TravelerCard }) {
  return (
    <article className="req-card">
      <div className="req-card-top">
        <span>{card.location}</span>
        <span className="req-spots">{card.spots}</span>
      </div>
      <p className="req-title">{card.title}</p>
      <p className="req-desc">{card.desc}</p>
      <div className="req-bar">
        <div className="req-bar-fill" style={{ width: `${card.fillPct}%` }} />
      </div>
      <div className="req-foot">
        <div className="avatars">
          {card.avatars.map((initials) => (
            <span key={initials} className="avatar">
              {initials}
            </span>
          ))}
        </div>
        <span className="req-price">{card.price}</span>
      </div>
    </article>
  );
}

function GuideReqCard({ card }: { card: GuideCard }) {
  return (
    <article className="req-card">
      <div className="req-card-top">
        <span>{card.location}</span>
        <span className="req-spots">{card.spots}</span>
      </div>
      <p className="req-title">{card.title}</p>
      <p className="req-desc">{card.desc}</p>
      <div className="req-bar">
        <div className="req-bar-fill" style={{ width: `${card.fillPct}%` }} />
      </div>
      <div className="req-foot">
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--primary)",
          }}
        >
          {card.openTag}
        </span>
        <span className="req-price">{card.price}</span>
      </div>
    </article>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function HomePageGateway() {
  const [activeTab, setActiveTab] = useState<"traveler" | "guide">("traveler");
  const isTraveler = activeTab === "traveler";

  return (
    <section
      className="section low"
      aria-labelledby="gateway-title"
    >
      <div className="container">
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <p className="sec-label" style={{ marginBottom: "8px" }}>
            Для кого Provodnik
          </p>
          <h2 id="gateway-title" className="sec-title">
            Выберите свою роль
          </h2>
        </div>

        {/* Role toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "28px",
          }}
        >
          <div
            role="tablist"
            aria-label="Роль"
            style={{
              display: "inline-flex",
              padding: "4px",
              gap: "2px",
              borderRadius: "9999px",
              background: "var(--surface-lowest)",
              border: "1px solid var(--outline-variant)",
            }}
          >
            <button
              type="button"
              role="tab"
              id="tab-traveler"
              aria-selected={isTraveler}
              aria-controls="panel-traveler"
              onClick={() => setActiveTab("traveler")}
              style={{
                padding: "10px 30px",
                borderRadius: "9999px",
                fontFamily: "var(--font-ui)",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: isTraveler ? "#fff" : "var(--on-surface-muted)",
                background: isTraveler ? "var(--primary)" : "transparent",
                transition: "background 0.2s, color 0.2s",
                border: "none",
                cursor: "pointer",
              }}
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
              style={{
                padding: "10px 30px",
                borderRadius: "9999px",
                fontFamily: "var(--font-ui)",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: !isTraveler ? "#fff" : "var(--on-surface-muted)",
                background: !isTraveler ? "var(--primary)" : "transparent",
                transition: "background 0.2s, color 0.2s",
                border: "none",
                cursor: "pointer",
              }}
            >
              Я гид
            </button>
          </div>
        </div>

        {/* Traveler panel */}
        <div
          role="tabpanel"
          id="panel-traveler"
          aria-labelledby="tab-traveler"
          hidden={!isTraveler}
          className="glass-panel"
          style={{ padding: "32px" }}
        >
          <div className="grid-3" style={{ marginBottom: "24px" }}>
            {travelerCards.map((card) => (
              <TravelerReqCard key={card.title} card={card} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link href="/requests/new" className="btn-primary">
              Создать запрос
            </Link>
          </div>
        </div>

        {/* Guide panel */}
        <div
          role="tabpanel"
          id="panel-guide"
          aria-labelledby="tab-guide"
          hidden={isTraveler}
          className="glass-panel"
          style={{ padding: "32px" }}
        >
          <div className="grid-3" style={{ marginBottom: "24px" }}>
            {guideCards.map((card) => (
              <GuideReqCard key={card.title} card={card} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link href="/requests" className="btn-primary">
              Предложить цену
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
