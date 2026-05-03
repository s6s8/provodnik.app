import Image from "next/image";

import type { ListingPhotoRow } from "@/lib/supabase/types";

function buildGalleryUrls(coverUrl: string | null, photos: ListingPhotoRow[]): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string | null | undefined) => {
    if (!raw) return;
    const u = raw.trim();
    if (!u || seen.has(u)) return;
    seen.add(u);
    ordered.push(u);
  };
  push(coverUrl);
  for (const p of photos) push(p.url);
  return ordered;
}

export function PhotoGallery({
  photos,
  coverUrl,
}: {
  photos: ListingPhotoRow[];
  coverUrl: string | null;
}) {
  const urls = buildGalleryUrls(coverUrl, photos);

  if (urls.length === 0) {
    return <div className="aspect-video w-full rounded-xl bg-muted" />;
  }

  if (urls.length === 1) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
        <Image src={urls[0]} alt="" fill priority sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
      </div>
    );
  }

  if (urls.length <= 3) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {urls.map((url, idx) => (
          <div key={url} className="relative aspect-video overflow-hidden rounded-xl">
            <Image src={url} alt="" fill priority={idx === 0} sizes="(max-width: 768px) 50vw, 360px" className="object-cover" />
          </div>
        ))}
      </div>
    );
  }

  const [main, ...rest] = urls;
  const thumbs = rest.slice(0, 4);

  return (
    <>
      <div className="hidden max-h-[min(50vh,28rem)] gap-2 md:grid md:grid-cols-5 md:grid-rows-2">
        <div className="relative col-span-3 row-span-2 min-h-0 overflow-hidden rounded-xl">
          <Image src={main} alt="" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
        {thumbs.map((url) => (
          <div key={url} className="relative min-h-0 overflow-hidden rounded-xl">
            <Image src={url} alt="" fill sizes="(min-width: 768px) 20vw, 50vw" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto md:hidden">
        {urls.map((url, idx) => (
          <div key={url} className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl">
            <Image src={url} alt="" fill priority={idx === 0} sizes="100vw" className="object-cover" />
          </div>
        ))}
      </div>
    </>
  );
}
