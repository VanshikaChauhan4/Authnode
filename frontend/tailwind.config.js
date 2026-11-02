/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--rail-${name}) / <alpha-value>)`

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  // The site is dark-only: <html class="dark"> switches on the dark: variants
  // used by the picture-rail gallery.
  darkMode: "class",
  corePlugins: {
    // The rest of the app is hand-styled with plain CSS (index.css / App.css /
    // per-page .css files). We only want Tailwind's utility classes for the
    // new animated components, not its base reset, so we don't touch pages
    // outside this redesign.
    preflight: false,
  },
  theme: {
    extend: {
      // shadcn-style semantic colours (values live in index.css as --rail-* channels)
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        card: token("card"),
        "card-foreground": token("card-foreground"),
        muted: token("muted"),
        "muted-foreground": token("muted-foreground"),
        border: token("border"),
        ring: token("ring"),
        chart: { 2: token("chart-2") },
      },
    },
  },
  plugins: [],
}
