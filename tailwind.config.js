/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        ink: "var(--ink)",
        carbon: "var(--carbon)",
        rust: "var(--rust)",
        ochre: "var(--ochre)",
        zinc: "var(--zinc)",
        shade: "var(--paper-shade)",
      },
      fontFamily: {
        display: ['"Source Serif 4"', "Georgia", "ui-serif", "serif"],
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
