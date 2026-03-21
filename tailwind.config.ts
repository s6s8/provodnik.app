import type { Config } from "tailwindcss";

/**
 * Homepage spec palette (HOMEPAGE-SPEC.md — Global design tokens).
 * Loaded via `@config` in `src/app/globals.css` for Tailwind v4.
 */
const config = {
  theme: {
    extend: {
      colors: {
        canvas: "#F9F8F7",
        surface: "#F2EDE6",
        card: "#FFFFFF",
        glass: "rgb(255 255 255 / 0.55)",
        "glass-border": "rgb(255 255 255 / 0.6)",
        primary: "#0F766E",
        "primary-mid": "#14B8A6",
        "primary-light": "#2DD4BF",
        amber: "#D97706",
        "amber-mid": "#F97316",
        neutral: {
          DEFAULT: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
        },
        border: "#CBD5E1",
        "border-light": "#E2E8F0",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
      },
      fontFamily: {
        serif: ["var(--font-cormorant-garamond)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
} satisfies Config;

export default config;
