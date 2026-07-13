import Image from "next/image";
import Link from "next/link";

export type Inspiration = {
  slug: string;
  label: string;
  imageUrl: string;
};

export function EmptyCabinet({ inspirations }: { inspirations: Inspiration[] }) {
  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6 py-16 text-center">
      <h1 className="text-4xl font-semibold">Куда поедем?</h1>
      <p className="text-lg text-muted-foreground">
        Опишите поездку — местные гиды пришлют предложения
      </p>
      <Link
        href="/"
        className="inline-block rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground"
      >
        Создать запрос
      </Link>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {inspirations.map((d) => (
          <Link
            key={d.slug}
            href={`/destinations/${d.slug}`}
            className="overflow-hidden rounded-lg border"
          >
            <div className="relative aspect-video">
              <Image
                src={d.imageUrl}
                alt={d.label}
                fill
                className="object-cover"
                sizes="(max-width: 767px) 100vw, 240px"
              />
            </div>
            <p className="p-2 font-medium">{d.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
