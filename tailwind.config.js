/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#12232F",
        secondary: "#004052",
        light: {
          100: "#3cab93", //green
          200: "#287C66", //green
          300: "#9CA4AB", //gray
        },
        dark: {
          100: "#155443", //green-dark
          200: "#0F0D23",
          300: "1a2a2a", //realy-dark-green
        },
        accent: "#3cab93",
        gray: "#c5c5c5",
      },
      fontFamily: {
        bebas: [`BebasNeu`, "sans-serif"],
      },
    },
  },
  plugins: [],
};
