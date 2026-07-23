export const PUBLIC_CATALOG_PAGE_SIZE = 24;

export function parseCatalogPage(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(Math.floor(parsed), 500);
}

export function catalogPageOffset(page: number): number {
  const safePage = parseCatalogPage(String(page));
  return (safePage - 1) * PUBLIC_CATALOG_PAGE_SIZE;
}
