/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cyber-dark': '#0a0a0a',
        'cyber-amber': '#ffb000',
        'cyber-amber-dark': '#ff8800',
        'cyber-green': '#00ff41',
        'cyber-red': '#ff0066',
      },
      fontFamily: {
        mono: ['Share Tech Mono', 'monospace'],
        display: ['Rajdhani', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 3s infinite',
        'glitch': 'glitch-skew 5s infinite linear alternate-reverse',
        'border-pulse': 'border-pulse 2s infinite',
        'scan': 'scan 8s linear infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'glitch-skew': {
          '0%': { transform: 'skewX(0deg)' },
          '10%': { transform: 'skewX(0deg)' },
          '11%': { transform: 'skewX(2deg)' },
          '13%': { transform: 'skewX(0deg)' },
          '100%': { transform: 'skewX(0deg)' },
        },
        'border-pulse': {
          '0%, 100%': { borderColor: '#ffb000' },
          '50%': { borderColor: '#ff8800' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
}
