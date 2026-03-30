"use client";

import Link from "next/link";
import { useState } from "react";

import type { RequestRecord } from "@/data/supabase/queries";

interface Props {
  requests: RequestRecord[];
}

function formatPrice(budgetRub: number): string {
  if (!budgetRub) return "По договорённости";
  const k = Math.round(budgetRub / 1000);
  return `${k} тыс. ₽`;
}

function MemberAvatarChip({ member }: { member: RequestRecord["members"][number] }) {
  const [hasImageError, setHasImageError] = useState(false);
  const showImage = Boolean(member.avatarUrl) && !hasImageError;

  return (
    <span className="avatar member-avatar" title={member.displayName}>
      {showImage ? (
        <img
          src={member.avatarUrl ?? ""}
          alt={member.displayName}
          className="member-avatar-image"
          loading="lazy"
          decoding="async"
          onError={() => setHasImageError(true)}
        />
      ) : (
        member.initials
      )}
    </span>
  );
}

function MemberAvatars({ members }: { members: RequestRecord["members"] }) {
  if (members.length === 0) return null;

  return (
    <div className="avatars">
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
    <section className="section low" aria-labelledby="gateway-title">
      <div className="container">
        <div className="gateway-header">
          <p className="sec-label">Для кого Provodnik</p>
          <h2 id="gateway-title" className="sec-title">
            Выберите свою роль
          </h2>
        </div>

        <div className="gateway-tab-wrap">
          <div role="tablist" aria-label="Роль" className="gateway-tabs">
            <button
              type="button"
              role="tab"
              id="tab-traveler"
              aria-selected={isTraveler}
              aria-controls="panel-traveler"
              onClick={() => setActiveTab("traveler")}
              className={`gateway-tab ${isTraveler ? "gateway-tab-active" : ""}`}
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
              className={`gateway-tab ${!isTraveler ? "gateway-tab-active" : ""}`}
            >
              Я гид
            </button>
          </div>
        </div>

        <div
          role="tabpanel"
          id="panel-traveler"
          aria-labelledby="tab-traveler"
          hidden={!isTraveler}
          className="glass-panel gateway-panel"
        >
          {travelerCards.length === 0 ? (
            <p className="gateway-empty">Пока нет открытых запросов.</p>
          ) : (
            <div className="grid-3 gateway-grid">
              {travelerCards.map((req) => (
                <Link key={req.id} href={`/requests/${req.id}`}>
                  <article className="req-card">
                    <div className="req-card-top">
                      <span>{req.destination.split(",")[0]}</span>
                      <span className="req-spots">
                        {req.groupSize} / {req.capacity} мест
                      </span>
                    </div>
                    <p className="req-title">{req.destination}</p>
                    <p className="req-desc">
                      {req.dateLabel}
                      {req.description ? ` · ${req.description}` : ""}
                    </p>
                    <progress
                      className="req-progress"
                      value={Math.min(req.groupSize, Math.max(req.capacity, 1))}
                      max={Math.max(req.capacity, 1)}
                    />
                    <div className="req-foot">
                      <MemberAvatars members={req.members} />
                      <span className="req-price">{formatPrice(req.budgetRub)}</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
          <div className="gateway-actions">
            <Link href="/requests/new" className="btn-primary">
              Создать запрос
            </Link>
          </div>
        </div>

        <div
          role="tabpanel"
          id="panel-guide"
          aria-labelledby="tab-guide"
          hidden={isTraveler}
          className="glass-panel gateway-panel"
        >
          {guideCards.length === 0 ? (
            <p className="gateway-empty">Пока нет открытых запросов.</p>
          ) : (
            <div className="grid-3 gateway-grid">
              {guideCards.map((req) => (
                <Link key={req.id} href={`/requests/${req.id}`}>
                  <article className="req-card">
                    <div className="req-card-top">
                      <span>{req.destination.split(",")[0]}</span>
                      <span className="req-spots">{req.groupSize} чел.</span>
                    </div>
                    <p className="req-title">{req.destination}</p>
                    <p className="req-desc">
                      {req.dateLabel} · {req.description || req.format}
                    </p>
                    <progress className="req-progress" value={1} max={1} />
                    <div className="req-foot">
                      <span className="gateway-status">Ждут предложений</span>
                      <span className="req-price">{formatPrice(req.budgetRub)}</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
          <div className="gateway-actions">
            <Link href="/requests" className="btn-primary">
              Предложить цену
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
