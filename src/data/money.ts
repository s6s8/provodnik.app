/** Convert RUB to kopecks (minor units). */
export const rubToKopecks = (rub: number): number => Math.round(rub * 100);

/** Convert kopecks (minor units) to RUB. */
export const kopecksToRub = (kopecks: number): number => kopecks / 100;
