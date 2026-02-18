/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // OrbisLocal-matched palette
        base: "#05080f",
        surface: "#0c111d",
        "surface-2": "#111827",
        border: "rgba(255,255,255,0.07)",
        teal: {
          DEFAULT: "#14b8a6",
          dark: "#0d9488",
          dim: "rgba(20,184,166,0.12)",
        },
        coral: "#f97316",
        "text-primary": "#f0f4fa",
        "text-secondary": "rgba(240,244,250,0.6)",
        "text-dim": "rgba(240,244,250,0.35)",
        // legacy kept for compatibility
        "orbit-blue": "#0B1B3B",
        "signal-cyan": "#14b8a6",
        "plasma-orange": "#f97316",
        "aurora-green": "#10b981",
        void: "#05080f",
        slate: "#1C2433",
        mist: "#f0f4fa",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
