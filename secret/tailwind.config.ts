import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        primary: {
          DEFAULT: '#ec4899',
          50: '#fdf2f8',
          500: '#ec4899',
          600: '#db2777',
        },
      },
    },
  },
  plugins: [],
}
export default config
