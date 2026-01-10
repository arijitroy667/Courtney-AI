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
  experimental: {
    optimizePackageImports: ['thirdweb', '@walletconnect/universal-provider'],
  },
  // Exclude test files from being processed
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'pino': 'commonjs pino',
        'thread-stream': 'commonjs thread-stream',
      });
    }
    return config;
  },
}

export default nextConfig