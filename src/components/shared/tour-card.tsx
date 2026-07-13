import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { Scrim } from "@/components/ui/scrim";

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
        fetchPriority={priority ? "high" : "auto"}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
      />

      {/* Gradient overlay */}
      <Scrim className="z-[1]" />

      {/* Content */}
      <div className="relative z-[2] w-full p-6 text-primary-foreground">
        <h3 className="line-clamp-2 font-display text-[1.5rem] font-semibold leading-[1.1]">{title}</h3>

        <div className="mt-3 grid gap-1.5 text-sm text-primary-foreground/80">
          <span className="inline-flex items-center gap-1">
            {guide}
            {rating !== undefined && rating > 0 ? (
              <>
                ·
                <Star className="size-3.5 fill-gold text-gold" />
                {rating}
              </>
            ) : null}
          </span>
        </div>

        <div className="mt-3.5 w-fit rounded-full border border-primary-foreground/20 bg-primary-foreground/20 px-4 py-2 text-[0.8125rem] font-semibold backdrop-blur-xl">
          {price}
        </div>
      </div>
    </Link>
  );
}
