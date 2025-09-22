/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    // On client production builds, avoid bundling the pdf.js ESM worker which breaks minifiers on Vercel
    if (!dev && !isServer) {
      const path = require('path');
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias['pdfjs-dist/build/pdf.worker.mjs'] = path.resolve(__dirname, 'utils/empty-module.js');
    }
    return config;
  },
};

module.exports = nextConfig;
