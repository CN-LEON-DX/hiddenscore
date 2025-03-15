/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['"Playwrite IT Moderna"', 'system-ui', '-apple-system', 'sans-serif'],
        // You can keep other custom fonts if needed
        'heading': ['"Playwrite IT Moderna"', 'serif'],
      },
    },
  },
  plugins: [],
}