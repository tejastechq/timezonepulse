/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  safelist: [
    'backdrop-blur-sm',
    'backdrop-blur',
    'backdrop-blur-md',
    'backdrop-blur-lg',
    'backdrop-blur-xl',
    'backdrop-blur-2xl',
    'backdrop-blur-3xl',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        background: {
          DEFAULT: '#f8f8f8',
          dark: '#121212',
        },
        foreground: {
          DEFAULT: '#333333',
           dark: '#f8f8f8',
         },
         // Added for mobile gradient
         'navy-start': '#0a192f',
         'black-end': '#000000',
       },
       backgroundColor: {
         background: 'var(--background)',
      },
      textColor: {
        foreground: 'var(--foreground)',
      },
      backdropFilter: {
        'none': 'none',
        'sm': 'blur(4px)',
        'DEFAULT': 'blur(8px)',
        'md': 'blur(12px)',
        'lg': 'blur(16px)',
        'xl': 'blur(24px)',
        '2xl': 'blur(40px)',
         '3xl': 'blur(64px)',
       },
       fontFamily: { // Added fontFamily extension
          sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
          mono: ['var(--font-roboto-mono)', 'monospace'],
          poppins: ['var(--font-poppins)', 'sans-serif'],
          montserrat: ['var(--font-montserrat)', 'sans-serif'],
          oswald: ['var(--font-oswald)', 'sans-serif'], // Added Oswald
        },
        animation: {
          'clock-second': 'clockhand 60s linear infinite',
          'clock-minute': 'clockhand 3600s linear infinite',
          'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        keyframes: {
          clockhand: {
            '0%': { transform: 'translate(-50%, 0) rotate(0deg)' },
            '100%': { transform: 'translate(-50%, 0) rotate(360deg)' },
          },
        },
      },
   },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.backdrop-blur-fix': {
          'backdrop-filter': 'blur(8px)',
          '-webkit-backdrop-filter': 'blur(8px)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
