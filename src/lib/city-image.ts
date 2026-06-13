const CITY_IMAGES = [
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1527489377706-5bf97e608852?auto=format&fit=crop&w=1800&q=80",
] as const;

function hashDestination(destination: string): number {
  return Array.from(destination.trim().toLocaleLowerCase("ru-RU")).reduce(
    (hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0,
    0,
  );
}

export function cityImage(destination: string): string {
  // TODO: replace with curated per-city CDN
  const hash = hashDestination(destination);
  return CITY_IMAGES[hash % CITY_IMAGES.length];
}
