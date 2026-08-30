import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F6F3",
        ink: {
          DEFAULT: "#17161C",
          soft: "#4B4856",
          mute: "#8B8798",
        },
        line: "#EAE8E1",
        /* Jaune ComeUp — extrait de comeup.com (--bs-yellow: #fe6, --bs-yellow-100: #fffde8) */
        primary: {
          50: "#FFFDE8",
          100: "#FFF9C2",
          200: "#FFF285",
          300: "#FFEE66",
          400: "#FDE047",
          500: "#EAB308",
          600: "#CA8A04",
          700: "#A16207",
          800: "#854D0E",
          900: "#713F12",
        },
        brand: "#FFEE66",
        /* Bleu marine d'accent — harmonie jaune/navy */
        navy: {
          DEFAULT: "#1E2A5A",
          soft: "#2C3B78",
          50: "#EEF1FA",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23,22,28,0.04), 0 12px 32px -12px rgba(23,22,28,0.10)",
        card: "0 1px 2px rgba(23,22,28,0.03), 0 6px 20px -8px rgba(23,22,28,0.08)",
        pop: "0 4px 12px -2px rgba(23,22,28,0.08), 0 24px 56px -16px rgba(23,22,28,0.18)",
      },
      borderRadius: {
        "4xl": "1.75rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        "fade-in": "fade-in 0.25s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
