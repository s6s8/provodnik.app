/** Split comma-separated guide work regions; preserve spaces inside each region name. */
export function parseGuideRegionsInput(raw: string): string[] {
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function formatGuideRegionsInput(regions: readonly string[]): string {
  return regions.join(", ");
}
