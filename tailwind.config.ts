import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        "brand-mid": "var(--brand-mid)",
        "brand-light": "var(--brand-light)",
        surface: "var(--surface)",
        "surface-low": "var(--surface-low)",
        "surface-high": "var(--surface-high)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        glass: "var(--glass-bg)",
        "glass-border": "var(--glass-border)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        popover: "var(--popover)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        destructive: "var(--destructive)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        glass: "var(--glass-shadow)",
        editorial: "0 28px 80px rgba(33,49,63,0.14)",
      },
    },
  },
} satisfies Config;

export default config;
