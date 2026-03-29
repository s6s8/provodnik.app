import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { seededPublicGuides } from "@/data/public-guides/seed";

export const metadata: Metadata = {
  title: "Гиды | Provodnik",
  description: "Локальные гиды по России — проверенные маршруты, живые отзывы.",
};

export default function GuidesPage() {
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

        <div className="guides-grid">
          {seededPublicGuides.map((guide) => (
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
                  {guide.avatarImageUrl ? (
                    <Image
                      src={guide.avatarImageUrl}
                      alt={guide.displayName}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    guide.avatarInitials
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
                    {guide.displayName}
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
                {guide.headline}
              </p>

              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--on-surface-muted)",
                }}
              >
                ★ {guide.reviewsSummary.averageRating} · {guide.reviewsSummary.totalReviews} отзывов
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
