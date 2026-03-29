import Image from "next/image";
import Link from "next/link";

interface TourCardProps {
  href: string;
  imageUrl: string;
  title: string;
  guide: string;
  rating?: number;
  price: string;
}

export function TourCard({
  href,
  imageUrl,
  title,
  guide,
  rating,
  price,
}: TourCardProps) {
  return (
    <Link
      href={href}
      className="tour-card"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
        minHeight: "260px",
        borderRadius: "28px",
        overflow: "hidden",
      }}
    >
      {/* Background image */}
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{ objectFit: "cover" }}
      />

      {/* Gradient overlay */}
      <div className="overlay-top" aria-hidden="true" style={{ zIndex: 1 }} />

      {/* Content */}
      <div
        className="tour-content on-dark"
        style={{
          position: "relative",
          zIndex: 2,
          padding: "24px",
          width: "100%",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            lineHeight: 1.02,
            fontWeight: 600,
          }}
        >
          {title}
        </h3>

        <div
          className="tour-meta"
          style={{
            marginTop: "12px",
            display: "grid",
            gap: "6px",
            fontSize: "0.875rem",
            color: "rgba(255,255,255,0.82)",
          }}
        >
          <span>
            {guide}
            {rating !== undefined ? ` · ${rating} ★` : null}
          </span>
        </div>

        <div
          className="price-pill"
          style={{
            width: "fit-content",
            marginTop: "14px",
            padding: "8px 16px",
            borderRadius: "9999px",
            background: "rgba(249,249,255,0.18)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.20)",
            fontSize: "0.8125rem",
            fontWeight: 600,
          }}
        >
          {price}
        </div>
      </div>
    </Link>
  );
}
