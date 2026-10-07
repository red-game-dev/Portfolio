/** @type {import('next').NextConfig} */

const { join } = require('path')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
})

module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  trailingSlash: true,
  sassOptions: {
    includePaths: [join(__dirname, 'src/styles')],
  },
  images: {
    // 55 is for pictures shown blurred, such as the cover, where a lighter encode costs nothing visible.
    qualities: [55, 75],
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
  env: {
    HOST: process.env.HOST,
    DEBUG: process.env.DEBUG,
  },
})
