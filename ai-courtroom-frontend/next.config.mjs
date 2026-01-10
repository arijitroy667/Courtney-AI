/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  serverExternalPackages: [
    'pino',
    'thread-stream',
    'tap',
    'tape',
    'desm',
    'fastbench',
    'pino-elasticsearch',
    'rimraf',
    'why-is-node-running',
  ],
}

export default nextConfig