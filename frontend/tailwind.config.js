/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  corePlugins: {
    // The rest of the app is hand-styled with plain CSS (index.css / App.css /
    // per-page .css files). We only want Tailwind's utility classes for the
    // new animated components, not its base reset, so we don't touch pages
    // outside this redesign.
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
