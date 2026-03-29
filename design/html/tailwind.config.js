/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html"],
  theme: {
    colors: {
      background: "#F8F8FF",
      card: "#FFFFFF",
      border: "#E5E7EB",
      primary: {
        DEFAULT: "#3B82F6",
        hover: "#2563EB",
      },
      text: {
        primary: "#1A1A1A",
        secondary: "#6B7280",
      },
    },
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      borderRadius: {
        pill: "9999px",
      },
      boxShadow: {
        card: "0 18px 48px rgba(26, 26, 26, 0.08)",
        glass: "0 18px 54px rgba(26, 26, 26, 0.1)",
      },
    },
  },
  plugins: [],
};
