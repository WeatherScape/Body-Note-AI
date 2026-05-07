import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        muted: "#6B7280",
        line: "#E5E7EB",
        coach: "#E9F8F2",
        apple: "#0A84FF",
        mint: "#19C37D",
        coral: "#FF6B5A",
        amberSoft: "#FFF4D8"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15, 23, 42, 0.08)",
        card: "0 8px 28px rgba(15, 23, 42, 0.07)"
      },
      borderRadius: {
        "3xl": "1.75rem",
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
