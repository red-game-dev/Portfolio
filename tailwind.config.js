/** @type {import('tailwindcss').Config} */

let plugin = require('tailwindcss/plugin')

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/layouts/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
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
