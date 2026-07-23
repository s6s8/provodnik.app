import { describe, expect, it } from "vitest";

import type { OpenRequestRecord } from "@/data/open-requests/types";
import type { PublicListing } from "@/data/public-listings/types";
import {
  getListingDiscoverySearchText,
  getRequestDiscoverySearchText,
  matchesDiscoveryQuery,
  namedLocationsFromDestination,
} from "./public-discovery-search";

function makeListing(
  overrides: Partial<PublicListing> = {},
): Pick<
  PublicListing,
  "title" | "highlights" | "city" | "region" | "locationLabels"
> {
  return {
    title: "Прогулка",
    highlights: ["Исторический центр"],
    city: "Казань",
    region: "Татарстан",
    locationLabels: [],
    ...overrides,
  };
}

function makeRequest(
  overrides: Partial<OpenRequestRecord> = {},
): Pick<
  OpenRequestRecord,
  "destinationLabel" | "regionLabel" | "highlights" | "locationLabels"
> {
  return {
    destinationLabel: "Казань",
    regionLabel: "Татарстан",
    highlights: ["Экскурсия по кремлю"],
    locationLabels: [],
    ...overrides,
  };
}

describe("getListingDiscoverySearchText", () => {
  it("matches by a named location only", () => {
    const haystack = getListingDiscoverySearchText(
      makeListing({
        city: "Казань",
        region: "Татарстан",
        locationLabels: ["Свияжск"],
      }),
    );

    expect(matchesDiscoveryQuery(haystack, "свияжск")).toBe(true);
    expect(matchesDiscoveryQuery(haystack, "татарстан")).toBe(true);
    expect(matchesDiscoveryQuery(haystack, "сочи")).toBe(false);
  });

  it("keeps city and region searchable", () => {
    const haystack = getListingDiscoverySearchText(makeListing());

    expect(haystack).toContain("казань");
    expect(haystack).toContain("татарстан");
  });
});

describe("getRequestDiscoverySearchText", () => {
  it("matches by a named location only", () => {
    const haystack = getRequestDiscoverySearchText(
      makeRequest({
        destinationLabel: "Казань",
        regionLabel: "Татарстан",
        locationLabels: ["Свияжск"],
      }),
    );

    expect(matchesDiscoveryQuery(haystack, "свияжск")).toBe(true);
    expect(matchesDiscoveryQuery(haystack, "татарстан")).toBe(true);
    expect(matchesDiscoveryQuery(haystack, "сочи")).toBe(false);
  });

  it("keeps city and region searchable", () => {
    const haystack = getRequestDiscoverySearchText(makeRequest());

    expect(haystack).toContain("казань");
    expect(haystack).toContain("татарстан");
  });

  it("does not index private notes that are absent from the public projection", () => {
    const haystack = getRequestDiscoverySearchText(
      makeRequest({
        highlights: ["Экскурсия по кремлю"],
        locationLabels: ["Свияжск"],
      }),
    );

    expect(haystack).not.toContain("секрет");
    expect(matchesDiscoveryQuery(haystack, "секрет")).toBe(false);
    expect(matchesDiscoveryQuery(haystack, "свияжск")).toBe(true);
  });
});

describe("namedLocationsFromDestination", () => {
  it("returns trailing destination segments as named locations", () => {
    expect(namedLocationsFromDestination("Казань, Свияжск")).toEqual(["Свияжск"]);
  });
});
