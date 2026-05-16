import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Building2,
  Church,
  Landmark,
  Leaf,
  Palette,
  Sparkles,
  Utensils,
} from "lucide-react";

export type ThemeSlug =
  | "history"
  | "architecture"
  | "nature"
  | "food"
  | "art"
  | "religion"
  | "kids"
  | "unusual";

export type Theme = {
  slug: ThemeSlug;
  label: string;
  Icon: LucideIcon;
};

export const THEMES = [
  { slug: "history", label: "История", Icon: Landmark },
  { slug: "architecture", label: "Архитектура", Icon: Building2 },
  { slug: "nature", label: "Природа", Icon: Leaf },
  { slug: "food", label: "Гастрономия", Icon: Utensils },
  { slug: "art", label: "Искусство", Icon: Palette },
  { slug: "religion", label: "Религия", Icon: Church },
  { slug: "kids", label: "Для детей", Icon: Baby },
  { slug: "unusual", label: "Необычное", Icon: Sparkles },
] as const satisfies readonly Theme[];

export function getTheme(slug: string): Theme | undefined {
  return THEMES.find((t) => t.slug === slug);
}
