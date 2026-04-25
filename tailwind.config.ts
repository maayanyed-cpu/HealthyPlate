import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        "cream-soft": "var(--cream-soft)",
        surface: "var(--surface)",
        "sage-deep": "var(--sage-deep)",
        sage: "var(--sage)",
        "sage-soft": "var(--sage-soft)",
        "sage-pale": "var(--sage-pale)",
        moss: "var(--moss)",
        carrot: "var(--carrot)",
        "carrot-soft": "var(--carrot-soft)",
        tomato: "var(--tomato)",
        gold: "var(--gold)",
        berry: "var(--berry)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-mute": "var(--ink-mute)",
        line: "var(--border)",
        "line-soft": "var(--border-soft)",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "12px",
        DEFAULT: "20px",
        lg: "28px",
        xl: "36px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(45,58,54,0.04), 0 2px 8px rgba(45,58,54,0.04)",
        md: "0 4px 12px rgba(45,58,54,0.06), 0 12px 32px rgba(45,58,54,0.08)",
        lg: "0 16px 48px rgba(45,58,54,0.12)",
      },
      keyframes: {
        scan: {
          "0%, 100%": { top: "5%", opacity: "0.7" },
          "50%": { top: "95%", opacity: "1" },
        },
        wiggle: {
          "0%, 100%": { transform: "translateY(0) rotate(-4deg)" },
          "50%": { transform: "translateY(-8px) rotate(4deg)" },
        },
        sparkle: {
          "0%, 100%": { transform: "scale(0.5)", opacity: "0.4" },
          "50%": { transform: "scale(1.3)", opacity: "1" },
        },
        revealBox: {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        scan: "scan 2s ease-in-out infinite",
        wiggle: "wiggle 1.2s ease-in-out infinite",
        sparkle: "sparkle 1.4s ease-in-out infinite",
        "reveal-box": "revealBox 0.4s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
