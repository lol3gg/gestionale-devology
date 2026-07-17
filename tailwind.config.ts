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
          bg: "#090b10",
          surface: "#0f131c",
          elevated: "#12151d",
          border: "rgba(255, 255, 255, 0.08)",
          "border-strong": "rgba(255, 255, 255, 0.14)",
          text: "#eceff8",
          soft: "#c2c8d6",
          muted: "#98a1b5",
          accent: "#d3112b",
          "accent-dark": "#a70d22",
          "accent-light": "#ff6b7e",
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
        "brand-md": "0 18px 50px rgba(0, 0, 0, 0.35)",
        "brand-lg": "0 28px 80px rgba(0, 0, 0, 0.45)",
        "brand-glow": "0 0 0 1px rgba(211,17,43,0.18), 0 20px 45px -12px rgba(211,17,43,0.35)",
        "brand-inset": "inset 0 1px 0 0 rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "brand-grid":
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
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
