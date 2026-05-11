import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
};

export default nextConfig;
