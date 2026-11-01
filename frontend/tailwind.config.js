/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: '#0c0d19',
          sidebar: '#0e101f',
          card: '#141628',
          cardHover: '#1c1f38',
          cardBorder: '#25294a',
          purple: '#8b5cf6',
          purpleDark: '#6d28d9',
          purpleGlow: '#a855f7',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          accent: '#9333ea',
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Kantumruy Pro"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

