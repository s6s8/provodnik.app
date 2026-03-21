import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { seededDestinations } from "@/data/destinations/seed";
import type { DestinationSummary } from "@/data/destinations/types";

export const metadata: Metadata = {
  title: "Направления",
  description: "Выберите город или регион для экскурсии с локальным гидом.",
};

function DestinationCard({ destination, variant }: { destination: DestinationSummary; variant?: "featured" }) {
  return (
    <Link
      href={`/destinations/${encodeURIComponent(destination.slug)}`}
      className={[
        "group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black",
        variant === "featured" ? "md:col-span-2" : "md:col-span-1",
      ].join(" ")}
    >
      <div
        className={[
          "relative w-full",
          variant === "featured" ? "min-h-[320px] md:min-h-[380px]" : "min-h-[240px] md:min-h-[300px]",
        ].join(" ")}
      >
        <Image
          src={destination.imageUrl ?? "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&h=1200&q=80"}
          alt={destination.name}
          fill
          sizes="(max-width: 768px) 92vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-all duration-300 group-hover:from-black/92" />

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-white">{destination.name}</p>
            <p className="text-sm leading-6 text-white/70">{destination.description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DestinationsPage() {
  const destinations = seededDestinations;
  const featured = destinations[0];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="editorial-kicker">Направления</p>
        <h1 className="text-3xl font-semibold tracking-tight">Популярные направления</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {featured && <DestinationCard destination={featured} variant="featured" />}
        {destinations.slice(1, 3).map((d) => (
          <DestinationCard key={d.slug} destination={d} />
        ))}
      </div>
    </div>
  );
}

