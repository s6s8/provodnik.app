import Image from "next/image";
import Link from "next/link";

interface TourCardProps {
  href: string;
  imageUrl: string;
  title: string;
  guide: string;
  rating?: number;
  price: string;
  priority?: boolean;
}

export function TourCard({
  href,
  imageUrl,
  title,
  guide,
  rating,
  price,
  priority,
}: TourCardProps) {
  return (
    <Link href={href} className="relative flex min-h-[260px] items-end overflow-hidden rounded-card no-underline text-inherit transition-transform hover:-translate-y-[3px]">
      {/* Background image */}
      <Image
        src={imageUrl}
        alt={title}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-t from-[rgba(15,23,42,0.78)] to-[rgba(15,23,42,0.06)]"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-[2] w-full p-6 [--on-surface:#fff] [--on-surface-muted:rgba(255,255,255,0.72)] [--outline-variant:rgba(255,255,255,0.20)]">
        <h3 className="font-display text-[2rem] font-semibold leading-[1.02]">{title}</h3>

        <div className="mt-3 grid gap-1.5 text-sm text-white/82">
          <span>
            {guide}
            {rating !== undefined ? ` · ${rating} ★` : null}
          </span>
        </div>

        <div className="mt-3.5 w-fit rounded-full border border-white/20 bg-white/[0.18] px-4 py-2 text-[0.8125rem] font-semibold backdrop-blur-[20px]">
          {price}
        </div>
      </div>
    </Link>
  );
}
