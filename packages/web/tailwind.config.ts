import type { Config } from "tailwindcss";

export default {
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          950: "#0a0f17", // fondo base
          900: "#0d141f",
        },
        card: {
          DEFAULT: "rgba(13,20,31,0.62)",
          stroke: "rgba(148,163,184,0.18)", // slate-400/18
        },
        brand: {
          200: "#f2e9c7",
          300: "#efd58e",
          400: "#e3c46a",
        },
      },
      fontFamily: {
        display: ['"Cinzel"', "serif"], // para el H1
      },
      boxShadow: {
        "card-elev": "0 6px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
