/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Optimize for smaller function size
  output: 'standalone',
  
  // Security headers configuration
  headers: async () => {
    const securityHeaders = [
      // Default security headers are set in middleware.ts
      // Add any additional headers here that can't be set in middleware
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: process.env.NODE_ENV === 'production' ? 'index, follow' : 'noindex, nofollow',
          },
        ],
      },
      // Protect API routes with additional headers
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];

    return securityHeaders;
  },

  // Security-focused webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Enable SRI for external scripts in production
    if (!dev) {
      config.output.crossOriginLoading = 'anonymous';
    }

    // Set externals as a function to handle node modules properly
    if (!isServer) {
      config.externals = [
        (context, request, callback) => {
          if (request === 'crypto') {
            return callback(null, 'crypto');
          }
          callback();
        }
      ];
    }

    return config;
  },
};

module.exports = nextConfig;