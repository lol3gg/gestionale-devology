import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx,css}",
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
        /** Palette dedicata alla sezione ProntoPro CRM */
        pp: {
          navy: "#0f172a",
          "navy-light": "#1e293b",
          surface: "#f1f5f9",
          "surface-raised": "#f8fafc",
          border: "#e2e8f0",
          accent: "#1d4ed8",
          "accent-hover": "#1e40af",
          "accent-light": "#eff6ff",
          "accent-muted": "rgba(29, 78, 216, 0.08)",
        },
        navy: {
          DEFAULT: "#0f172a",
          light: "#1e293b",
        },
        surface: {
          DEFAULT: "#f1f5f9",
          raised: "#f8fafc",
          overlay: "#ffffff",
        },
        card: {
          DEFAULT: "#ffffff",
          hover: "#fafbfc",
        },
        border: {
          DEFAULT: "#e2e8f0",
          subtle: "#f1f5f9",
        },
        accent: {
          DEFAULT: "#1d4ed8",
          hover: "#1e40af",
          light: "#eff6ff",
          muted: "rgba(29, 78, 216, 0.08)",
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
        "pp-card": "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.04)",
        "pp-card-hover": "0 4px 16px rgba(15, 23, 42, 0.08)",
        "pp-header": "0 1px 0 rgba(255,255,255,0.06)",
        "pp-modal": "0 24px 48px -12px rgba(15, 23, 42, 0.18)",
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.04)",
        "card-hover": "0 4px 16px rgba(15, 23, 42, 0.08)",
        header: "0 1px 0 rgba(255,255,255,0.06)",
        modal: "0 24px 48px -12px rgba(15, 23, 42, 0.18)",
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
