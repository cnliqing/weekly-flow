import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#1b1f24",
          700: "#354052",
          500: "#667085",
        },
        paper: "#f7f4ee",
        line: "#ded7cb",
        accent: "#1f7a5b",
        amber: "#b26a1b",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(27, 31, 36, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
