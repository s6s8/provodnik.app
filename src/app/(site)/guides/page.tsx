import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { getGuides, type GuideRecord } from "@/data/supabase/queries";

export function generateMetadata(): Metadata {
  return {
    title: "Гиды",
    description: "Найдите опытного гида для вашего путешествия",
  };
}

export default async function GuidesPage() {
  let guides: GuideRecord[] = [];

  const result = await getGuides(null as any);
  if (result.data) guides = result.data;

  return (
    <section
      style={{
        background: "var(--surface)",
        padding: "110px 0 80px",
      }}
    >
      <div className="container">
        <p className="sec-label">Проводники</p>
        <h1
          className="display-lg"
          style={{
            color: "var(--on-surface)",
            marginBottom: "16px",
          }}
        >
          Местные знатоки
        </h1>
        <p
          style={{
            fontSize: "1rem",
            lineHeight: 1.7,
            color: "var(--on-surface-muted)",
            maxWidth: "46rem",
            marginBottom: "48px",
          }}
        >
          Гиды, которые превращают маршрут в историю. Каждый проверен и имеет живые отзывы путешественников.
        </p>

        {guides.length === 0 && (
          <p style={{ color: "var(--on-surface-muted)" }}>Пока нет доступных гидов.</p>
        )}

        <div className="guides-grid">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="guide-card"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div className="avatar-lg">
                  {guide.avatarUrl ? (
                    <Image
                      src={guide.avatarUrl}
                      alt={guide.fullName}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    guide.initials
                  )}
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: "1rem",
                      color: "var(--on-surface)",
                    }}
                  >
                    {guide.fullName}
                  </p>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--on-surface-muted)",
                    }}
                  >
                    {guide.homeBase}
                  </p>
                </div>
              </div>

              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--on-surface-muted)",
                  lineHeight: 1.55,
                  marginBottom: "16px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {guide.bio}
              </p>

              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--on-surface-muted)",
                }}
              >
                ★ {guide.rating} · {guide.reviewCount} отзывов
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
