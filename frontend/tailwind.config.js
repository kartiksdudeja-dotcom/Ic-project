/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#f3faff",
        "primary": "#001e42",
        "primary-container": "#003368",
        "secondary-container": "#fc820c",
        "on-surface-variant": "#43474f",
        "outline-variant": "#c3c6d1",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "error": "#ba1a1a",
      }
    },
  },
  plugins: [],
}
