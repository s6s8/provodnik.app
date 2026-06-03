import type { LucideIcon } from "lucide-react";
import {
  Church,
  Landmark,
  Leaf,
  Moon,
  Mountain,
  Palette,
  Sparkles,
  Utensils,
  Waves,
} from "lucide-react";

export type ThemeSlug =
  | "history_culture"
  | "nature"
  | "food"
  | "art"
  | "unusual"
  | "night"
  | "active"
  | "water"
  | "religion";

export type Theme = {
  slug: ThemeSlug;
  label: string;
  Icon: LucideIcon;
};

export const THEMES = [
  { slug: "history_culture", label: "История и культура", Icon: Landmark },
  { slug: "nature", label: "Природа", Icon: Leaf },
  { slug: "food", label: "Гастрономия", Icon: Utensils },
  { slug: "art", label: "Искусство", Icon: Palette },
  { slug: "unusual", label: "Необычные маршруты", Icon: Sparkles },
  { slug: "night", label: "Ночные прогулки", Icon: Moon },
  { slug: "active", label: "Активный отдых", Icon: Mountain },
  { slug: "water", label: "Водные прогулки", Icon: Waves },
  { slug: "religion", label: "Религия и духовность", Icon: Church },
] as const satisfies readonly Theme[];

export function getTheme(slug: string): Theme | undefined {
  return THEMES.find((t) => t.slug === slug);
}
