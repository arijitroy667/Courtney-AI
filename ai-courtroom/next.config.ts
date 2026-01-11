import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: [
    "pino",
    "pino-pretty",
    "thread-stream",
  ],
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     // Don't resolve these modules on the client
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //       net: false,
  //       tls: false,
  //       child_process: false,
  //       worker_threads: false,
  //     };
  //   }
    
  //   // Ignore test files and LICENSE files in node_modules
  //   config.module.rules.push({
  //     test: /node_modules[\\/]thread-stream[\\/](test|bench|LICENSE)/,
  //     use: "ignore-loader",
  //   });

  //   return config;
  // },
};

export default nextConfig;