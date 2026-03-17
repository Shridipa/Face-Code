/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fc-bg': '#0B0F1A',
        'fc-card': '#111827',
        'fc-primary': '#6366F1',
        'fc-accent': '#22C55E',
        'fc-warning': '#F59E0B',
        'fc-danger': '#EF4444',
        'fc-border': '#1F2937',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
