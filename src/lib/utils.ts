import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Display route separators as "→" (data may store "->"). Render-layer only. */
export function arrowizeRoute(text: string | null | undefined): string {
  return (text ?? "").replace(/\s*->\s*/g, " → ");
}

export function pluralize(n: number, form1: string, form2: string, form3: string) {
  const mod10 = Math.abs(n) % 10;
  const mod100 = Math.abs(n) % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return form1;
  }

  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return form2;
  }

  return form3;
}

/** Genitive "человек(а)" form used after a number (e.g. "до 5 человек"). */
export function pluralizePeopleGenitive(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "человека";
  return "человек";
}
