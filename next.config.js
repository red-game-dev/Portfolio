/** @type {import('next').NextConfig} */

const { join } = require('path')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
})

// The largest a script, style or font may be to be saved for offline on the first visit; anything larger (three.js,
// the voyage's biggest parts) is saved the first time it is used.
const PRECACHE_MOST_BYTES = 512 * 1024
const PRECACHED = /^static\/(chunks|css|media)\/.+\.(js|css|woff2?|svg|png|jpe?g|webp|avif|gif)$/

// Writes the build's list of its scripts, styles and fonts to /_next/static/offline/precache.json, which the service
// worker (src/sw/service-worker.ts) saves once the page has loaded, so every part the page may load later opens offline.
class OfflinePrecachePlugin {
  apply(compiler) {
    const { Compilation, sources } = compiler.webpack

    compiler.hooks.thisCompilation.tap('OfflinePrecache', (compilation) => {
      compilation.hooks.processAssets.tap({ name: 'OfflinePrecache', stage: Compilation.PROCESS_ASSETS_STAGE_REPORT }, (assets) => {
        const files = Object.entries(assets)
          .filter(([name, source]) => PRECACHED.test(name) && source.size() <= PRECACHE_MOST_BYTES)
          .map(([name]) => `/_next/${name}`)
          .sort()

        compilation.emitAsset('static/offline/precache.json', new sources.RawSource(JSON.stringify({ files })))
      })
    })
  }
}

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
  webpack(config, { isServer, dev }) {
    if (!isServer && !dev) {
      config.plugins.push(new OfflinePrecachePlugin())
    }

    // twin.macro compiles tailwind.config.js into every file that uses tw or GlobalStyles, which webpack's cache does
    // not know: a change to the config alone would otherwise ship those files built with the old one (the cache
    // Vercel keeps between builds once kept _app.tsx's old font stack this way).
    if (config.cache && typeof config.cache === 'object') {
      config.cache.buildDependencies = {
        ...config.cache.buildDependencies,
        twin: [join(__dirname, 'tailwind.config.js'), join(__dirname, 'babel-plugin-macros.config.js')],
      }
    }

    return config
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
