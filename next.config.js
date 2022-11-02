/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    dirs: ['styles', 'pages', 'src', 'tests']
  },
  compiler: {
    removeConsole: {
      exclude: ['error'],
    },
    styledComponents: true,
  },
}

module.exports = nextConfig
