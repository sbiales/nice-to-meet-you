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
          50: '#f2f5f0',
          100: '#e1e8dc',
          200: '#c5d4bc',
          300: '#a3b897',
          400: '#839a76',
          500: '#6e8761',
          600: '#576c4d',
          700: '#455540',
          800: '#3a4636',
          900: '#313b2e',
          950: '#181f17',
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
        handwriting: ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
} satisfies Config
