// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/components/**/*.{vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f2f7f3',
          100: '#deeee2',
          200: '#beddca',
          300: '#93c5a9',
          400: '#64a685',
          500: '#6B9E76',
          600: '#4a7d57',
          700: '#3b6446',
          800: '#315139',
          900: '#294330',
          950: '#132419',
        },
        warm: {
          bg: '#FAFAF8',
          card: '#FFFFFF',
          text: '#1A1A17',
          muted: '#6B6860',
          border: '#E5E0D8',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
