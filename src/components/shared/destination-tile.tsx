import Image from "next/image";
import Link from "next/link";

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
 * Popular-destinations card (homepage). 172px photo with a bottom gradient,
 * city name + "{N} гидов · от {price}" caption. Image comes from the existing
 * city-image pipeline.
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
      className="relative block h-[172px] overflow-hidden rounded-2xl border border-border no-underline text-inherit transition-transform hover:-translate-y-[3px]"
    >
      <Image
        src={imageUrl}
        alt={name}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[rgba(8,14,24,0.1)] via-transparent to-[rgba(8,14,24,0.68)]"
        aria-hidden="true"
      />
      <div className="absolute bottom-3.5 left-4 right-4 text-white">
        <div className="text-xl font-bold leading-tight tracking-[-0.02em]">{name}</div>
        <div className="mt-0.5 text-[12.5px] font-medium text-white/85">
          {guidesCount} гидов{fromPrice ? ` · от ${fromPrice}` : ""}
        </div>
      </div>
    </Link>
  );
}
