import Image from "next/image";

import type { ListingPhotoRow } from "@/lib/supabase/types";

type GalleryItem = {
  url: string;
  alt: string | null;
};

function buildGalleryItems(coverUrl: string | null, photos: ListingPhotoRow[]): GalleryItem[] {
  const ordered: GalleryItem[] = [];
  const seen = new Set<string>();
  const altByUrl = new Map(
    photos.map((photo) => [photo.url.trim(), photo.alt_text?.trim() || null]),
  );
  const push = (raw: string | null | undefined, alt: string | null = null) => {
    if (!raw) return;
    const u = raw.trim();
    if (!u || seen.has(u)) return;
    seen.add(u);
    ordered.push({ url: u, alt: alt?.trim() || altByUrl.get(u) || null });
  };
  push(coverUrl);
  for (const p of photos) push(p.url, p.alt_text);
  return ordered;
}

function getImageAlt(item: GalleryItem, idx: number): string {
  return item.alt ?? `Фото предложения — фото ${idx + 1}`;
}

export function PhotoGallery({
  photos,
  coverUrl,
}: {
  photos: ListingPhotoRow[];
  coverUrl: string | null;
}) {
  const items = buildGalleryItems(coverUrl, photos);

  if (items.length === 0) {
    return <div className="aspect-video w-full rounded-xl bg-muted" />;
  }

  if (items.length === 1) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
        <Image src={items[0].url} alt={getImageAlt(items[0], 0)} fill priority fetchPriority="high" sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
      </div>
    );
  }

  if (items.length <= 3) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, idx) => (
          <div key={item.url} className="relative aspect-video overflow-hidden rounded-xl">
            <Image src={item.url} alt={getImageAlt(item, idx)} fill priority={idx === 0} fetchPriority={idx === 0 ? "high" : "auto"} sizes="(max-width: 768px) 50vw, 360px" className="object-cover" />
          </div>
        ))}
      </div>
    );
  }

  const [main, ...rest] = items;
  const thumbs = rest.slice(0, 4);

  return (
    <>
      <div className="hidden max-h-[min(50vh,28rem)] gap-2 md:grid md:grid-cols-5 md:grid-rows-2">
        <div className="relative col-span-3 row-span-2 min-h-0 overflow-hidden rounded-xl">
          <Image src={main.url} alt={getImageAlt(main, 0)} fill priority fetchPriority="high" sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
        {thumbs.map((item, idx) => (
          <div key={item.url} className="relative min-h-0 overflow-hidden rounded-xl">
            <Image src={item.url} alt={getImageAlt(item, idx + 1)} fill sizes="(min-width: 768px) 20vw, 50vw" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto md:hidden">
        {items.map((item, idx) => (
          <div key={item.url} className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl">
            <Image src={item.url} alt={getImageAlt(item, idx)} fill priority={idx === 0} fetchPriority={idx === 0 ? "high" : "auto"} sizes="100vw" className="object-cover" />
          </div>
        ))}
      </div>
    </>
  );
}
