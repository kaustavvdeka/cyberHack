/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0f0f1a',
          card: 'rgba(26, 26, 46, 0.8)',
          cardBorder: 'rgba(233, 69, 96, 0.2)',
          accent: '#e94560',
          accentHover: '#ff6b6b',
          darkBlue: '#16213e',
          textMain: '#e0e0e0',
          textMuted: '#a0a0b0',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
