import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 기존 navy 토큰 유지 (하위 호환)
        navy: {
          50: "#f3f7fb",
          100: "#dfe8f2",
          500: "#35506b",
          700: "#1d3550",
          900: "#112033"
        },
        // 오렌지 팔레트 확장 (포인트 컬러)
        orange: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          400: "#f19a4b",
          500: "#e57c23",
          600: "#c96515"
        },
        sand: "#fff9f3"
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.04)",
        sm: "0 1px 3px 0 rgba(0,0,0,0.05)",
        md: "0 4px 8px -2px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)",
        lg: "0 12px 24px -6px rgba(0,0,0,0.08), 0 4px 8px -4px rgba(0,0,0,0.04)",
        calm: "0 2px 8px rgba(17,32,51,0.04)"
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "24px"
      }
    }
  },
  plugins: []
};

export default config;
