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
  // The text files for language models are written from the content by API routes. Pages named like files would
  // need server rendering, which the single locale above turns into a build the Vercel adapter cannot finish.
  async rewrites() {
    return [
      { source: '/llms.txt', destination: '/api/llms', locale: false },
      { source: '/llms-full.txt', destination: '/api/llms-full', locale: false },
    ]
  },
})
