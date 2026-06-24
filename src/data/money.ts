/** Convert RUB to kopecks (minor units). */
export const rubToKopecks = (rub: number): number => Math.round(rub * 100);

/** Convert kopecks (minor units) to RUB. */
export const kopecksToRub = (kopecks: number): number => kopecks / 100;

/** Shared ru-RU grouping formatter (one instance, not one per call site). */
const rubNumberFormatter = new Intl.NumberFormat("ru-RU");

/** Group a RUB amount Russian-style: `3500` → `"3 500"`. */
export const formatRubNumber = (rub: number): string => rubNumberFormatter.format(rub);

/** Full RUB display: `3500` → `"3 500 ₽"`. */
export const formatRub = (rub: number): string => `${rubNumberFormatter.format(rub)} ₽`;

/** RUB display from kopecks (minor units): `350000` → `"3 500 ₽"`. */
export const formatRubFromMinor = (minor: number): string =>
  formatRub(Math.round(minor / 100));
