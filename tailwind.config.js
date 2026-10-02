/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7fc',
          100: '#e0eff9',
          200: '#b9ddf2',
          300: '#7cc1e7',
          400: '#38a2d7',
          500: '#1184c0',
          600: '#0769a1',
          700: '#075483',
          800: '#0a476c',
          900: '#0e3c5a',
          950: '#09273c',
        }
      }
    },
  },
  plugins: [],
}
