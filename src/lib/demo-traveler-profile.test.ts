import { describe, expect, it } from "vitest";

import {
  parseDemoTravelerProfileCookieValue,
  serializeDemoTravelerProfileCookieValue,
} from "./demo-traveler-profile";

describe("demo traveler profile cookie", () => {
  it("round-trips profile fields", () => {
    const payload = {
      full_name: "Анна",
      bio: "Люблю горы",
      home_city: "Москва",
      languages: ["ru", "en"],
      birth_year: 1990,
    };

    const encoded = serializeDemoTravelerProfileCookieValue(payload);
    expect(parseDemoTravelerProfileCookieValue(encoded)).toEqual(payload);
  });
});
