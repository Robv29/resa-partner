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
    },
  },
  plugins: [],
};
export default config;
