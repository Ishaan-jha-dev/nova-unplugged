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
          bg: "#0D0D2B",
          navy: "#0A0A1F",
          surface: "rgba(255,255,255,0.05)",
          border: "rgba(108,61,232,0.35)",
          primary: "#6C3DE8",
          "primary-light": "#8B5CF6",
          accent: "#E83D8A",
          "accent-light": "#F472B6",
          success: "#00FF88",
          warning: "#FFB800",
          danger: "#FF4444",
          muted: "#64748B",
          text: "#E2E8F0",
          "text-dim": "#94A3B8",
        },
      },
      fontFamily: {
        display: ["var(--font-orbitron)", "monospace"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "nova-gradient":
          "linear-gradient(135deg, #0D0D2B 0%, #1a0a3d 50%, #0D0D2B 100%)",
        "nova-hero":
          "radial-gradient(ellipse at top, #2d1b69 0%, #0D0D2B 60%), radial-gradient(ellipse at bottom right, #6C3DE820 0%, transparent 50%)",
        "purple-glow":
          "radial-gradient(circle, rgba(108,61,232,0.3) 0%, transparent 70%)",
        "pink-glow":
          "radial-gradient(circle, rgba(232,61,138,0.3) 0%, transparent 70%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
      },
      boxShadow: {
        "glow-purple": "0 0 20px rgba(108,61,232,0.5), 0 0 60px rgba(108,61,232,0.2)",
        "glow-pink": "0 0 20px rgba(232,61,138,0.5), 0 0 60px rgba(232,61,138,0.2)",
        "glow-green": "0 0 20px rgba(0,255,136,0.5), 0 0 60px rgba(0,255,136,0.2)",
        "glow-sm": "0 0 10px rgba(108,61,232,0.4)",
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
        "spin-slow": "spin 8s linear infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(108,61,232,0.4)" },
          "50%": { boxShadow: "0 0 40px rgba(108,61,232,0.8), 0 0 80px rgba(108,61,232,0.3)" },
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
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
