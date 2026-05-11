import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "!./src/components/AdminDashboard.tsx",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#0A0A0A",
        accent: "#A855F7",
        border: "#E5E5E5",
        muted: "#6B6B6B",
        "off-white": "#F5F5F5",
        purple: {
          50: "#f5e6ff",
          100: "#e6ccff",
          200: "#d4a6ff",
          300: "#c280ff",
          400: "#b059ff",
          500: "#A855F7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        grotesk: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "purple-gradient": "linear-gradient(135deg, #A855F7 0%, #9333ea 100%)",
        "purple-gradient-subtle":
          "linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)",
        "void-purple":
          "linear-gradient(135deg, #0F0F0F 0%, #1A1A1A 50%, #A855F7 100%)",
        "hero-dark":
          "linear-gradient(160deg, #0A0A0A 0%, #1a1a1a 60%, rgba(168, 85, 247, 0.08) 100%)",
      },
      maxWidth: {
        content: "1280px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        slideDown: {
          from: { transform: "translateY(-8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        marquee: "marquee 35s linear infinite",
        slideDown: "slideDown 0.18s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
