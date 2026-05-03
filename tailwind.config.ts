import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nova: {
          bg: "#1c0505", 
          navy: "#2e0808",
          surface: "rgba(255,255,255,0.05)",
          border: "rgba(255, 100, 100, 0.35)",
          primary: "#FF3366", 
          "primary-light": "#FF6688",
          accent: "#FF9933", 
          "accent-light": "#FFBB66",
          success: "#00FF88",
          warning: "#FFB800",
          danger: "#FF4444",
          muted: "#FBBF24", 
          text: "#FFE4E6", 
          "text-dim": "#FDA4AF",
        },
      },
      fontFamily: {
        display: ["var(--font-orbitron)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "nova-gradient": "linear-gradient(135deg, #1c0505 0%, #3e0c15 50%, #1c0505 100%)",
        "nova-hero": "radial-gradient(ellipse at bottom, #8a1c1c 0%, #1c0505 60%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 2px 2px rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2)",
        "bento-glow": "0 0 20px rgba(255,255,255,0.2)",
        "glow-red": "0 0 40px rgba(255,51,102,0.6)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "slide-up": "slideUp 0.6s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
        "breathe": "breathe 4s ease-in-out infinite",
        "spin-slow": "spin 12s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255,51,102,0.4)" },
          "50%": { boxShadow: "0 0 40px rgba(255,51,102,0.8), 0 0 80px rgba(255,51,102,0.3)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        slideUp: {
          "0%": { transform: "translateY(40px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        }
      },
    },
  },
  plugins: [],
};

export default config;
