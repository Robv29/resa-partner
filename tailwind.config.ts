import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "oklch(0.16 0.02 255)",
          soft: "oklch(0.42 0.03 255)",
          faint: "oklch(0.60 0.02 255)",
        },
        bg: "oklch(0.985 0.004 255)",
        surface: "oklch(1 0 0)",
        border: {
          DEFAULT: "oklch(0.90 0.006 255)",
          strong: "oklch(0.82 0.008 255)",
        },
        accent: {
          DEFAULT: "oklch(0.50 0.12 195)",
          hover: "oklch(0.44 0.12 195)",
          soft: "oklch(0.94 0.03 195)",
          ink: "oklch(0.30 0.09 195)",
        },
        // Or de la marque (le "P" du logo) : couleur d'appel à l'action
        // principale, réservée aux moments qui comptent (CTA, mise en avant)
        // pour rester "committed" sans noyer l'interface.
        gold: {
          DEFAULT: "oklch(0.58 0.14 75)",
          hover: "oklch(0.52 0.145 75)",
          soft: "oklch(0.95 0.05 85)",
          ink: "oklch(0.34 0.10 75)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        md: "8px",
        lg: "10px",
      },
      boxShadow: {
        crisp: "0 1px 2px rgba(15, 23, 30, 0.04)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(-50%, 0) scale(1)" },
          "50%": { transform: "translate(-50%, -18px) scale(1.04)" },
        },
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "60%": { transform: "scale(1.03)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        float: "float 9s ease-in-out infinite",
        pop: "pop 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        bob: "bob 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
