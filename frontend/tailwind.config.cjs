/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Custom gray shades used by Discord-style UI
        "gray-850": "#1e2130",
        "gray-950": "#0d0f14",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "bounce-slow": "bounce 1.4s infinite",
      },
    },
  },
  plugins: [],
};