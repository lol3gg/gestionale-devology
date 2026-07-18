import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          bg: "rgb(var(--brand-bg) / <alpha-value>)",
          surface: "rgb(var(--brand-surface) / <alpha-value>)",
          elevated: "rgb(var(--brand-elevated) / <alpha-value>)",
          border: "rgb(var(--brand-border) / var(--brand-border-alpha))",
          "border-strong": "rgb(var(--brand-border) / var(--brand-border-strong-alpha))",
          text: "rgb(var(--brand-text) / <alpha-value>)",
          soft: "rgb(var(--brand-soft) / <alpha-value>)",
          muted: "rgb(var(--brand-muted) / <alpha-value>)",
          accent: "rgb(var(--brand-accent) / <alpha-value>)",
          "accent-dark": "rgb(var(--brand-accent-dark) / <alpha-value>)",
          "accent-light": "rgb(var(--brand-accent-light) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        brand: "16px",
        "brand-lg": "22px",
      },
      boxShadow: {
        "brand-md": "var(--brand-shadow-md)",
        "brand-lg": "var(--brand-shadow-lg)",
        "brand-glow": "var(--brand-shadow-glow)",
        "brand-inset": "var(--brand-shadow-inset)",
      },
      backgroundImage: {
        "brand-grid":
          "linear-gradient(var(--brand-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--brand-grid-line) 1px, transparent 1px)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
