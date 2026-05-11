import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Business Gate brand
        bg: {
          green: "#1a5c37",
          "green-2": "#247a4a",
          "green-3": "#2d9052",
          "green-lt": "#eaf3ed",
          gold: "#c9a84c",
          "gold-2": "#e0bc5a",
          "gold-lt": "#fdf5e0",
          surface: "#eef0ec",
          card: "#ffffff",
          "card-alt": "#f7f9f6",
          line: "#e2e8e3",
          "line-mid": "#c4d0c8",
          "text-1": "#141f18",
          "text-2": "#3e5446",
          "text-3": "#7a8e80",
          danger: "#c0392b",
          info: "#2563eb",
          "info-lt": "#eff6ff",
        },
      },
      fontFamily: {
        sans: ["var(--font-noto-arabic)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        sm2: "8px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(26,92,55,0.07)",
        "card-hover": "0 4px 16px rgba(26,92,55,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
