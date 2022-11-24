/** @type {import('next').NextConfig} */

const { join } = require('path')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
})

module.exports = withBundleAnalyzer({
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
  env: {
    HOST: process.env.HOST,
    DEBUG: process.env.DEBUG,
  },
})
