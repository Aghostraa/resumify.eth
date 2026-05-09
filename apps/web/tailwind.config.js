/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Hallmark palette
        hm: {
          blue: '#2997ff',
          green: '#30d158',
          red: '#ff453a',
          amber: '#ffd60a',
        },
        // Legacy aliases mapped onto Hallmark surfaces
        ink: {
          950: '#000000',
          900: '#050505',
          800: 'rgba(255,255,255,0.025)',
          700: 'rgba(255,255,255,0.07)',
          600: 'rgba(255,255,255,0.10)',
          500: 'rgba(255,255,255,0.22)',
          400: 'rgba(255,255,255,0.40)',
          300: 'rgba(255,255,255,0.55)',
          200: 'rgba(255,255,255,0.75)',
          100: '#ffffff',
        },
        acid: {
          500: '#30d158',
          400: '#5fdf80',
          300: '#7ee787',
        },
        rose: {
          400: '#ff453a',
          300: '#ff7b72',
        },
      },
      letterSpacing: {
        hm: '0.22em',
        hmwide: '0.32em',
        hmxwide: '0.38em',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-up': 'fadeUp 0.8s ease both',
        'fade-down': 'fadeDown 0.8s ease both',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'eyebrow-pulse': 'eyebrowPulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        eyebrowPulse: {
          '0%,100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.3)' },
        },
      },
    },
  },
  plugins: [],
};
