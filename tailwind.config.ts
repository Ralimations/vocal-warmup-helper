import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0D0D1A",
        plum: "#2D1B4E",
        pink: "#FF3AF2",
        cyan: "#00F5D4",
        yellow: "#FFE600",
        orange: "#FF6B35",
        purple: "#7B2FFF",
      },
      fontFamily: { heading: ["Outfit", "Impact", "sans-serif"], body: ["DM Sans", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};

export default config;
