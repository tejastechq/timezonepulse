const million = require('million/compiler');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Remove X-Powered-By header for security
  images: {
    formats: ['image/avif', 'image/webp'], // Use modern image formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048], // Responsive image sizes
    minimumCacheTTL: 60, // Cache images for at least 1 minute
  },
  compress: true, // Enable gzip compression
  // Enable source maps in production for better debugging (will address the source map warning)
  productionBrowserSourceMaps: true,
  experimental: {
    // Only keep features that are supported in your Next.js version
    scrollRestoration: true, // Restore scroll position when navigating
    optimizePackageImports: [
      'luxon',
      'framer-motion',
    ],
    // Turbopack-specific settings removed to avoid conflicts
  },
  // Enable tree-shaking for better dead code elimination
  webpack: (config, { dev, isServer }) => {
    // Set to 'cheap-module-source-map' for development (better performance while still providing source maps)
    // Set to 'source-map' for production (more accurate but slower)
    config.devtool = dev ? 'cheap-module-source-map' : 'source-map';
    
    // Ensure source maps are properly generated for all file types
    if (dev) {
      // Explicitly enable source maps for all JavaScript/TypeScript files in development
      config.module.rules.forEach((rule) => {
        if (rule.oneOf) {
          rule.oneOf.forEach((oneOfRule) => {
            if (
              oneOfRule.use &&
              Array.isArray(oneOfRule.use) &&
              oneOfRule.use.some(u => typeof u === 'object' && (u.loader === 'next-swc-loader' || u.loader?.includes('babel-loader')))
            ) {
              // Ensure source maps are enabled for SWC and Babel loaders
              oneOfRule.use.forEach(loader => {
                if (typeof loader === 'object') {
                  if (!loader.options) loader.options = {};
                  // Set sourceMap true for loaders
                  loader.options.sourceMap = true;
                }
              });
            }
          });
        }
      });
    }
    
    if (!dev && !isServer) {
      // Optimize client-side bundles in production
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 90000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            // Fix the getName function to avoid null reference errors with Million.js
            name: (module) => {
              // Safe guard against modules without context
              if (!module || !module.context) {
                return 'npm.unknown';
              }
              
              try {
                const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                if (!match || !match[1]) {
                  return 'npm.unknown';
                }
                
                const packageName = match[1];
                return `npm.${packageName.replace('@', '')}`;
              } catch (error) {
                console.warn('Error in chunk naming:', error);
                return 'npm.unknown';
              }
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name: 'shared',
            minChunks: 2,
            priority: 10,
          },
        },
      };
    }
    return config;
  },
  headers: async () => {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // Improve cache policy for static assets
        source: '/:path*.(js|css|svg|jpg|jpeg|png|webp|avif|ico|woff2|woff)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
    ];
  },
};

// Simplified Million.js configuration - focusing only on components we know work properly
const millionConfig = {
  // Use a simplified approach focusing only on known-safe components
  auto: false, // Disable auto mode completely to have full control
  
  // Include only the simplest UI components that don't have hook issues
  include: [
    // Only include the most basic UI components
    'NotificationButton',
    'DashboardToggle', 
    'ViewSwitcher',
    // Remove AnalogClock as it's causing TypeError
    // 'AnalogClock',
    // Basic UI components
    '**/ui/Button*',
  ],
  
  // Enable source maps
  sourcemap: true,
  
  // Conservative optimization settings
  optimize: {
    // Use a more conservative threshold
    threshold: 0.3,
    
    // Ensure we use compatibility mode
    mode: 'compatibility',
  },
};

// Export the configuration with simplified Million.js optimization
module.exports = million.next(nextConfig, millionConfig); 