/** @type {import('tailwindcss').Config} */

let plugin = require('tailwindcss/plugin')
let defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/layouts/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Preflight emits `body { font-family: inherit }`, which wins over the
      // body rule in globals.css because twin injects it later. Roboto has to
      // be the Tailwind sans stack or it never applies. next/font is not an
      // option here: it requires SWC, and twin.macro forces Babel.
      fontFamily: {
        sans: ['Roboto', ...defaultTheme.fontFamily.sans],
      },
      height: {
        'endless-width': '1000%',
      },
      backgroundPosition: {
        'fittable-mobile': `53% 100%`
      },
      backgroundImage: {
        'wave':  'linear-gradient(45deg, #1E6944, #4bffa5)'
      }
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant('child', '& > *');
      addVariant('child-hover', '& > *:hover');
    }),
  ],
}
