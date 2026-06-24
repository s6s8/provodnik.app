function hashDestination(destination: string): number {
  return Array.from(destination.trim().toLocaleLowerCase("ru-RU")).reduce(
    (hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0,
    0,
  );
}

/**
 * Deterministic on-canon backdrop. Returns a soft navy gradient (with one quiet
 * amber accent) as an inline SVG data-URI, so it drops straight into
 * `background-image: url(...)`. No external photos: a foreign stock shot for,
 * say, a Kalmykia city was a truth + brand bug. Seed varies the gradient
 * deterministically, so distinct seeds (heroes, cards) read as distinct.
 */
export function brandGradient(seed = "provodnik"): string {
  const hash = hashDestination(seed);

  const angle = hash % 360;
  const amberX = (0.18 + ((hash >>> 3) % 64) / 100).toFixed(2);
  const amberY = (0.12 + ((hash >>> 7) % 48) / 100).toFixed(2);
  const glowX = (0.22 + ((hash >>> 11) % 56) / 100).toFixed(2);
  const glowY = (0.4 + ((hash >>> 15) % 50) / 100).toFixed(2);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">` +
    `<defs>` +
    `<linearGradient id="b" gradientTransform="rotate(${angle} 0.5 0.5)">` +
    `<stop offset="0" stop-color="#1A56A4"/>` +
    `<stop offset="1" stop-color="#15467F"/>` +
    `</linearGradient>` +
    `<radialGradient id="n" cx="${glowX}" cy="${glowY}" r="0.75">` +
    `<stop offset="0" stop-color="#15467F" stop-opacity="0.55"/>` +
    `<stop offset="1" stop-color="#15467F" stop-opacity="0"/>` +
    `</radialGradient>` +
    `<radialGradient id="a" cx="${amberX}" cy="${amberY}" r="0.6">` +
    `<stop offset="0" stop-color="#D4872B" stop-opacity="0.3"/>` +
    `<stop offset="1" stop-color="#D4872B" stop-opacity="0"/>` +
    `</radialGradient>` +
    `</defs>` +
    `<rect width="1600" height="900" fill="url(#b)"/>` +
    `<rect width="1600" height="900" fill="url(#n)"/>` +
    `<rect width="1600" height="900" fill="url(#a)"/>` +
    `</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Curated, real, ON-PLACE photography per destination — the "replace the
 * gradient with a real city photo" the product always wanted. Foreign stock is
 * banned (a Moscow/alpine shot for a Kalmykia city was a truth + brand bug); only
 * verified-correct local imagery goes here. Keys are normalized (lowercase, ru-RU)
 * and matched by substring, so "Элиста" and "Элиста, Калмыкия" both resolve.
 */
const CURATED_CITY_IMAGES: Record<string, string> = {
  // Элиста — Золотая обитель Будды Шакьямуни (Golden Abode), the city's landmark.
  "элиста":
    "https://images.unsplash.com/photo-1657293493705-557ab000afe1?auto=format&fit=crop&w=1600&h=900&q=80",
};

function normalizeCity(s: string): string {
  return s.trim().toLocaleLowerCase("ru-RU");
}

/**
 * Backdrop for request heroes/cards, keyed by a destination name. Returns
 * curated real photography for known cities; otherwise an on-canon branded
 * gradient (never foreign stock).
 */
export function cityImage(destination: string): string {
  const key = normalizeCity(destination);
  for (const [city, url] of Object.entries(CURATED_CITY_IMAGES)) {
    if (key.includes(city)) return url;
  }
  return brandGradient(destination);
}
