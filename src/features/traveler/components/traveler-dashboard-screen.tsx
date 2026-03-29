"use client";

import * as React from "react";
import Link from "next/link";

import { ReqCard } from "@/components/shared/req-card";
import type { AuthContext } from "@/lib/auth/types";
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
      return { label: "Активный", cls: "state active" };
    case "shortlisted":
      return { label: "Набор группы", cls: "state wait" };
    case "booked":
    case "closed":
      return { label: "Завершён", cls: "state done" };
    default:
      return { label: "Черновик", cls: "state wait" };
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
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--surface)",
          padding: "110px 0 32px",
        }}
      >
        <div className="container">
          <p className="sec-label">Личный кабинет</p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 600,
            }}
          >
            Добро пожаловать, {displayName}
          </h1>
          <p
            style={{
              marginTop: "14px",
              color: "var(--on-surface-muted)",
            }}
          >
            Ваши активные запросы, группы и предложения гидов.
          </p>
        </div>
      </section>

      {/* ── Dashboard layout ──────────────────────────────────────────────── */}
      <section style={{ padding: "0 0 80px" }}>
        <div className="container">
          <div className="dashboard-grid">
            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <aside className="dashboard-sidebar">
              {/* Avatar */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "var(--surface-low)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "var(--primary)",
                }}
              >
                {userInitials}
              </div>

              <strong
                style={{
                  display: "block",
                  fontSize: "0.9375rem",
                  marginTop: "12px",
                }}
              >
                {displayName}
              </strong>

              {email && (
                <small
                  style={{
                    display: "block",
                    marginTop: "4px",
                    color: "var(--on-surface-muted)",
                    fontSize: "0.8125rem",
                  }}
                >
                  {email}
                </small>
              )}

              {/* Divider */}
              <div className="dashboard-sidebar-divider" />

              {/* Nav links */}
              <nav
                style={{ display: "grid", gap: "4px" }}
                aria-label="Навигация по кабинету"
              >
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
                    className={`side-nav-link${active ? " active" : ""}`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </aside>

            {/* ── Main content ────────────────────────────────────────────── */}
            <div>
              {/* Section header */}
              <div
                className="section-hd"
                style={{
                  marginBottom: "20px",
                }}
              >
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.5rem",
                    fontWeight: 600,
                  }}
                >
                  Мои запросы
                </h2>
                <Link href="/requests/new" className="btn-primary">
                  Создать запрос
                </Link>
              </div>

              {/* Request cards grid */}
              <div className="dashboard-req-grid">
                {items.map((record) => {
                  const { request, id, status } = record;
                  const badge = statusBadge(status);
                  const offers: number = 0;
                  const budget = request.budgetPerPersonRub;
                  const priceLabel = `от ${(budget * 0.8).toLocaleString("ru-RU")} ₽`;
                  const startFmt = new Date(request.startDate).toLocaleDateString(
                    "ru-RU",
                    { day: "numeric", month: "short" }
                  );
                  const endFmt = new Date(request.endDate).toLocaleDateString(
                    "ru-RU",
                    { day: "numeric", month: "short" }
                  );
                  const spotsLabel = `${request.groupSize} чел.`;

                  // fill bar: submitted=30%, offers_received=65%, shortlisted=80%, booked=100%, closed=100%
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
                    <div key={id} style={{ position: "relative" }}>
                      {/* Status badge overlay — uses .state CSS classes from globals.css */}
                      <span
                        className={badge.cls}
                        style={{
                          position: "absolute",
                          top: "16px",
                          right: "16px",
                          zIndex: 1,
                          pointerEvents: "none",
                        }}
                      >
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

              {/* Stats row — white cards, no decorative borders, just gap */}
              <div
                className="grid-3"
                style={{
                  marginTop: "20px",
                }}
              >
                {[
                  { value: activeCount, label: "активных запроса" },
                  { value: offersCount, label: "оффера от гидов" },
                  { value: confirmedCount, label: "подтверждённых поездки" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    style={{
                      background: "var(--surface-lowest)",
                      borderRadius: "16px",
                      boxShadow: "var(--card-shadow)",
                      padding: "20px",
                      textAlign: "center",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        fontFamily: "var(--font-display)",
                        fontSize: "2rem",
                        fontWeight: 600,
                        color: "var(--on-surface)",
                      }}
                    >
                      {value}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--on-surface-muted)",
                      }}
                    >
                      {label}
                    </span>
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
