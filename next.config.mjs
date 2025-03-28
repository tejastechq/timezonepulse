/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure ESM compatibility
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during builds
  },
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during builds
  },
  // Disable edge runtime for middleware to avoid compatibility issues
  experimental: {
    serverComponentsExternalPackages: ["iron-session"],
  },
  // Set output to export for more reliable static site generation
  output: 'standalone',
  // Ensure all packages have access to the same React instance
  transpilePackages: [
    '@radix-ui',
    '@nextui-org'
  ]
};

export default nextConfig; 