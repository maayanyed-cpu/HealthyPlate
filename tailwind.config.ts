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
        bounceJump: {
          "0%, 100%": { transform: "translate(-50%, -50%) translateY(0) scale(1)" },
          "30%": { transform: "translate(-50%, -50%) translateY(-18px) scale(1.05)" },
          "60%": { transform: "translate(-50%, -50%) translateY(0) scale(0.96)" },
        },
        popIn: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "70%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        dance: {
          "0%": { transform: "translate(0, 0) rotate(0deg) scale(1)" },
          "15%": { transform: "translate(-3px, -9px) rotate(-9deg) scale(1.04)" },
          "30%": { transform: "translate(2px, -16px) rotate(7deg) scale(1.08)" },
          "45%": { transform: "translate(5px, -7px) rotate(11deg) scale(1.02)" },
          "60%": { transform: "translate(0, -2px) rotate(-4deg) scale(0.96)" },
          "75%": { transform: "translate(-5px, -12px) rotate(-8deg) scale(1.05)" },
          "90%": { transform: "translate(3px, -5px) rotate(5deg) scale(1)" },
          "100%": { transform: "translate(0, 0) rotate(0deg) scale(1)" },
        },
        floatDrift: {
          "0%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(-4%, -3%)" },
          "50%": { transform: "translate(3%, -4%)" },
          "75%": { transform: "translate(4%, 2%)" },
          "100%": { transform: "translate(0, 0)" },
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
        "bounce-jump": "bounceJump 0.7s ease-in-out infinite",
        "pop-in": "popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        dance: "dance 1.6s ease-in-out infinite",
        "float-drift": "floatDrift 6s ease-in-out infinite",
        sparkle: "sparkle 1.4s ease-in-out infinite",
        "reveal-box": "revealBox 0.4s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
