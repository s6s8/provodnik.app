import { describe, expect, it } from "vitest";

import { pinElistaInspirations } from "./pin-elista";

const destination = (slug: string, name: string) => ({
  id: slug,
  slug,
  name,
  region: "Россия",
  category: "culture" as const,
  description: "",
  heroImageUrl: `/${slug}.jpg`,
  listingCount: 0,
  guidesCount: 0,
  avgRating: 4.8,
});

describe("pinElistaInspirations", () => {
  it("keeps the top two destinations and pins Элиста into the third inspiration slot", () => {
    const result = pinElistaInspirations([
      destination("moscow", "Москва"),
      destination("kazan-tatarstan", "Казань"),
      destination("saint-petersburg", "Санкт-Петербург"),
      destination("elista", "Элиста"),
    ]);

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.slug)).toEqual([
      "moscow",
      "kazan-tatarstan",
      "elista",
    ]);
    expect(result[2]).toMatchObject({
      label: "Элиста",
      imageUrl: "/elista.jpg",
    });
  });

  it("falls back to the first three destinations when Элиста is absent", () => {
    const result = pinElistaInspirations([
      destination("moscow", "Москва"),
      destination("kazan-tatarstan", "Казань"),
      destination("saint-petersburg", "Санкт-Петербург"),
      destination("sochi", "Сочи"),
    ]);

    expect(result.map((item) => item.slug)).toEqual([
      "moscow",
      "kazan-tatarstan",
      "saint-petersburg",
    ]);
  });
});
