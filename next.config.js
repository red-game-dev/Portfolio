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
    DEBUG: process.env.DEBUG ?? 'false',
  },
  // The text files for language models are written from the content by API routes, which answer with plain
  // text rather than a page.
  async rewrites() {
    return [
      // trailingSlash makes every route end in a slash, API routes included. With the locale above, a rule that
      // opts out of locale handling is matched against the path with the default locale in front, so both forms.
      ...['', '/en'].flatMap((prefix) => [
        { source: `${prefix}/llms.txt`, destination: '/api/llms/', locale: false },
        { source: `${prefix}/llms-full.txt`, destination: '/api/llms-full/', locale: false },
      ]),
    ]
  },
})
