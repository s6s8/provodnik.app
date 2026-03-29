"use client";

import Link from "next/link";
import { useState } from "react";

import type { RequestRecord } from "@/data/supabase/queries";

interface Props {
  requests: RequestRecord[];
}

function deriveAvatars(count: number): string[] {
  const pool = ["АК", "МЛ", "ТГ", "ВС", "ОР", "ЛК", "ИА", "ДМ"];
  return pool.slice(0, Math.min(count, pool.length));
}

function formatPrice(budgetRub: number): string {
  if (!budgetRub) return "По договорённости";
  const k = Math.round(budgetRub / 1000);
  return `${k} тыс. ₽`;
}

export function HomePageGateway({ requests }: Props) {
  const [activeTab, setActiveTab] = useState<"traveler" | "guide">("traveler");
  const isTraveler = activeTab === "traveler";

  const travelerCards = requests.slice(0, 3);
  const guideCards = requests.slice(0, 3);

  return (
    <section className="section low" aria-labelledby="gateway-title">
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <p className="sec-label" style={{ marginBottom: "8px" }}>
            Для кого Provodnik
          </p>
          <h2 id="gateway-title" className="sec-title">
            Выберите свою роль
          </h2>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
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
          {travelerCards.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--on-surface-muted)" }}>Пока нет открытых запросов.</p>
          ) : (
            <div className="grid-3" style={{ marginBottom: "24px" }}>
              {travelerCards.map((req) => {
                const fillPct = req.capacity > 0 ? Math.round((req.groupSize / req.capacity) * 100) : 0;
                const avatars = deriveAvatars(req.groupSize);
                return (
                  <article key={req.id} className="req-card">
                    <div className="req-card-top">
                      <span>{req.destination.split(",")[0]}</span>
                      <span className="req-spots">{req.groupSize} / {req.capacity} мест</span>
                    </div>
                    <p className="req-title">{req.destination}</p>
                    <p className="req-desc">{req.dateLabel} · {req.format}</p>
                    <div className="req-bar">
                      <div className="req-bar-fill" style={{ width: `${fillPct}%` }} />
                    </div>
                    <div className="req-foot">
                      <div className="avatars">
                        {avatars.map((initials) => (
                          <span key={initials} className="avatar">{initials}</span>
                        ))}
                      </div>
                      <span className="req-price">{formatPrice(req.budgetRub)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
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
          {guideCards.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--on-surface-muted)" }}>Пока нет открытых запросов.</p>
          ) : (
            <div className="grid-3" style={{ marginBottom: "24px" }}>
              {guideCards.map((req) => (
                <article key={req.id} className="req-card">
                  <div className="req-card-top">
                    <span>{req.destination.split(",")[0]}</span>
                    <span className="req-spots">{req.groupSize} чел.</span>
                  </div>
                  <p className="req-title">{req.destination}</p>
                  <p className="req-desc">{req.dateLabel} · {req.description || req.format}</p>
                  <div className="req-bar">
                    <div className="req-bar-fill" style={{ width: "100%" }} />
                  </div>
                  <div className="req-foot">
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)" }}>
                      Ждут предложений
                    </span>
                    <span className="req-price">{formatPrice(req.budgetRub)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
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
