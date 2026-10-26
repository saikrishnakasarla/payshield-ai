/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0B0E14',
          card: '#121721',
          cardHover: '#18202F',
          border: '#1F293D',
          borderLight: '#2D3A54',
          accent: '#0EA5E9',
          danger: '#F43F5E',
          warning: '#F59E0B',
          success: '#10B981',
          textMuted: '#94A3B8',
          textBright: '#F8FAFC',
        }
      }
    },
  },
  plugins: [],
}
