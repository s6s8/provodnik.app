import Image from "next/image";

interface GuidePhotoGridProps {
  photos: { id: string; locationName: string; imageUrl: string }[];
}

export function GuidePhotoGrid({ photos }: GuidePhotoGridProps) {
  if (photos.length === 0) return null;

  return (
    <section className="rounded-[var(--card-radius)] border border-[var(--outline)] bg-[var(--surface-lowest)] p-[clamp(22px,4vw,30px)] shadow-[var(--card-shadow)]">
      <p className="mb-3 font-sans text-[0.75rem] font-semibold tracking-[0.1em] text-[var(--primary)] uppercase">
        Фото
      </p>
      <h2 className="mb-6 font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1] text-[var(--on-surface)]">
        Локации
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square overflow-hidden rounded-[20px] border border-[var(--outline)] bg-[var(--brand-50)]"
          >
            <Image
              src={photo.imageUrl}
              alt={photo.locationName}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-x-2 bottom-2 rounded-full border border-[var(--outline)] bg-[var(--surface-lowest)] px-3 py-1.5 shadow-[var(--card-shadow)]">
              <p className="truncate text-xs font-semibold text-[var(--on-surface)]">
                {photo.locationName}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
