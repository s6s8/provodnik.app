import Image from "next/image";
import Link from "next/link";

import { Scrim } from "@/components/ui/scrim";

interface DestinationTileProps {
  href: string;
  name: string;
  imageUrl: string;
  guidesCount: number;
  /** e.g. "от 2 900 ₽" — omitted when no price data is available. */
  fromPrice?: string;
  priority?: boolean;
}

/**
 * Popular-destinations card (homepage). Photo with a bottom scrim, city name +
 * "{N} гидов · от {price}" caption. Image comes from the city-image pipeline.
 */
export function DestinationTile({
  href,
  name,
  imageUrl,
  guidesCount,
  fromPrice,
  priority,
}: DestinationTileProps) {
  return (
    <Link
      href={href}
      className="relative block h-44 overflow-hidden rounded-card border border-border no-underline text-inherit transition-transform hover:-translate-y-0.5"
    >
      <Image
        src={imageUrl}
        alt={name}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
      />
      <Scrim />
      <div className="absolute bottom-3.5 left-4 right-4 text-white">
        <div className="text-xl font-bold leading-tight tracking-tight">{name}</div>
        <div className="mt-0.5 text-xs font-medium text-white/85">
          {guidesCount} гидов{fromPrice ? ` · от ${fromPrice}` : ""}
        </div>
      </div>
    </Link>
  );
}
