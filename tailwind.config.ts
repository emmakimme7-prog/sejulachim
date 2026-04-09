import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f3f7fb",
          100: "#dfe8f2",
          500: "#35506b",
          700: "#1d3550",
          900: "#112033"
        },
        orange: {
          400: "#f19a4b",
          500: "#e57c23"
        },
        sand: "#fff9f3"
      },
      boxShadow: {
        calm: "0 16px 40px rgba(17, 32, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
