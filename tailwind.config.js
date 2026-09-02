/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#eb0028",
          light: "#ff2d55",
          dark: "#c00021",
          glow: "rgba(235, 0, 40, 0.20)",
        },
        oneplus: {
          red: "#eb0028",
          redDark: "#c00021",
          black: "#000000",
          slate: "#09090b",
          card: "#121216",
          elevated: "#1c1c22",
          border: "rgba(255, 255, 255, 0.08)",
          borderStrong: "rgba(255, 255, 255, 0.16)",
        },
        financial: {
          income: "#30d158",
          incomeBg: "rgba(48, 209, 88, 0.12)",
          expense: "#eb0028",
          expenseBg: "rgba(235, 0, 40, 0.12)",
          savings: "#0a84ff",
          savingsBg: "rgba(10, 132, 255, 0.12)",
          warning: "#ff9f0a",
          warningBg: "rgba(255, 159, 10, 0.12)",
          danger: "#eb0028",
          dangerBg: "rgba(235, 0, 40, 0.12)",
        },
        dark: {
          bg: "#000000",
          card: "#121216",
          elevated: "#1c1c22",
          surface: "#1c1c22",
          border: "rgba(255, 255, 255, 0.08)",
          text: "#ffffff",
          muted: "rgba(235, 235, 245, 0.65)",
          subtle: "rgba(235, 235, 245, 0.35)",
        }
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
        '4xl': '32px',
      }
    },
  },
  plugins: [],
};
