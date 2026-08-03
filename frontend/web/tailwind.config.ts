import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    // Explicitly target shared UI components to avoid node_modules scanning
    "../shared/ui/**/*.{ts,tsx}",
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

        /*
         * Semantic tokens.
         *
         * These are **exactly** Tailwind's `emerald` and `indigo` ramps, hex for
         * hex. That is deliberate: the migration off the ad-hoc classes was done
         * as a pure rename so it could ship with a provably empty visual diff.
         * Re-theming is now a change to these two blocks instead of a sweep
         * across ~60 files.
         *
         * Pick by meaning, not by colour:
         *   success — a positive *state*: approved, present, active, valid,
         *             done, published, saved. Pairs with red for the negative
         *             half (reject/absent), which is still raw pending the
         *             wider migration.
         *   brand   — a primary *action*: the filled button, the active tab,
         *             the form focus ring, the interactive hover accent.
         *             Distinct from `primary` (violet) above, which is the
         *             product chrome and was never the action colour here.
         *
         * Decorative colour is NOT a token and must not be forced into one.
         * Stat-tile swatches, avatar gradients and category chips (Holiday,
         * "In Class", timetable cards) deliberately still use raw palette
         * names — see `TONES` in features/dashboard/DashboardPrimitives.tsx
         * and `verticalTheme` in contexts/VerticalContext.tsx, both of which
         * are themselves token definitions and so legitimately hold raw values.
         */
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
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
