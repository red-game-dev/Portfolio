/** @type {import('next').NextConfig} */

const { join } = require('path')

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  sassOptions: {
    includePaths: [join(__dirname, 'src/styles')],
  },
  eslint: {
    dirs: ['src', '__tests__/src']
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  compiler: {
    removeConsole: {
      exclude: ['error'],
    },
  },
  images: {
    domains: [
      'launcher.goz.fun',
    ],
  },
}
