import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E8C77E',
          dark: '#B8941F',
        },
        ivory: '#FAF7F2',
        charcoal: '#1A1A1A',
        jet: '#0A0A0A',
      },
      fontFamily: {
        serif: ['Amiri', 'serif'],
        sans: ['Tajawal', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear'
      }
    },
  },
  plugins: [require('tailwindcss-rtl')],
}
