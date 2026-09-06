/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3EDE1",
        ink: "#1C1915",
        tyrian: "#8E1D32",
        khaki: "#C6B48A",
        slate: "#3E6A68",
        stamp: "#B05A2A",
      },
      fontFamily: {
        display: ['"Newsreader"', "Georgia", "serif"],
        sans: ['"Source Sans 3"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        rule: "inset 0 -1px 0 rgb(28 25 21 / 0.14)",
      },
    },
  },
  plugins: [],
};
