
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [],
  },
  experimental: {
    // allowedDevOrigins has been moved to top-level
  },
  allowedDevOrigins: ["*.cloudworkstations.dev"],
};

export default nextConfig;
