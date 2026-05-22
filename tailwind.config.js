/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 55px rgba(15, 23, 42, 0.10)',
        glow: '0 14px 40px rgba(59, 130, 246, 0.18)',
      },
    },
  },
  plugins: [],
}
