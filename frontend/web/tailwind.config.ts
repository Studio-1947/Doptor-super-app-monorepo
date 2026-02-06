import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    // Also include shared folder if you move it to valid path or symlink
    "../shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        none: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
        // 'full': '9999px', // Keep default full for avatars
      },
      colors: {
        // Premium HSL Color Palette
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6", // Violet
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        slate: {
          850: "#1e293b", // Custom Dark
          900: "#0f172a", // Standard Dark
          950: "#020617", // Deep Dark
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      fontSize: {
        xs: ["0.65rem", { lineHeight: "0.9rem" }], // ~10.4px (was 0.75rem/12px)
        sm: ["0.75rem", { lineHeight: "1.1rem" }], // ~12px   (was 0.875rem/14px) - NEW BASE
        base: ["0.8125rem", { lineHeight: "1.25rem" }], // ~13px (was 1rem/16px)
        lg: ["0.9375rem", { lineHeight: "1.5rem" }], // ~15px
        xl: ["1.125rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.35rem", { lineHeight: "2rem" }],
        "3xl": ["1.7rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.0rem", { lineHeight: "2.5rem" }],
        "5xl": ["2.6rem", { lineHeight: "1" }],
      },
      letterSpacing: {
        tighter: "-0.03em",
        tight: "-0.015em",
        normal: "0",
        wide: "0.015em",
        wider: "0.03em",
        widest: "0.06em",
      },
    },
  },
  plugins: [],
};
export default config;
