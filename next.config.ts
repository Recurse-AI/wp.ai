/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript type checking during build
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      // WordPress API rewrites
      {
        source: '/wp-api/:userId/:path*',
        destination: 'http://localhost:8000/user_:userId/wp-json/:path*'
      },
      // WebSocket API proxy - Using HTTP for proxy config as Next.js doesn't support direct WebSocket rewrites
      {
        source: '/api/ws/:path*',
        destination: 'http://localhost:8000/ws/:path*'
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allows all HTTPS image hostnames
      },
      {
        protocol: "http",
        hostname: "**", // Allows all HTTP image hostnames (Not recommended for security)
      },
      {
        protocol: "http",
        hostname: "localhost", // WordPress Profile Pictures
      },
      {
        protocol: "https",
        hostname: "localhost", // WordPress Profile Pictures
      },
    ],
    unoptimized: true, // ⚠️ Disables image optimization (Allows any external image)
  },
  // Configure React settings
  reactStrictMode: false, // Temporarily disable strict mode to check if it resolves bootstrap issues
  serverExternalPackages: [],
  experimental: {
    // Additional experimental features to fix bootstrap issues
    optimizePackageImports: ["react", "react-dom"],
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // These settings should help with bootstrap script issues
    ppr: false, 
    taint: false
  },
  // This helps with browser extensions like Grammarly that might modify the DOM
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
};

module.exports = nextConfig;
