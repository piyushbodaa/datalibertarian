/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Mirrors the --dl-* tokens in public/site-nav.css. Legacy names are kept
      // so existing classes keep working; they now resolve to the calm palette.
      colors: {
        paper: "#FFFFFF", // page background
        tint: "#F7F7F5", // at most one full-width band per page
        ink: "#16181D", // text, headings, numbers
        carbon: "#4A4F59", // secondary text
        muted: "#6B7079", // captions, labels
        line: "#E6E6E3", // hairlines
        "line-strong": "#D3D3CF", // inputs, buttons
        accent: { DEFAULT: "#1F4FD1", hover: "#1A40A8", soft: "#EEF2FC" }, // the one action colour
        rust: "#1F4FD1", // legacy name for the accent
        crimson: "#A13A2F", // data semantics only (rise / withdrawn)
        zinc: "#2F6B47", // data semantics only (fall / verified)
        ochre: "#7A5A1E", // data semantics only (pending / incomplete)
      },
      fontFamily: {
        display: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
