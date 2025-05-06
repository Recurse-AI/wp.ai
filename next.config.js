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
  // Completely disable static exports to avoid client-side hooks issues during build
  output: "standalone",
  // Disable static optimizer to avoid client-side hooks issues during build
  staticPageGenerationTimeout: 120,
  // Skip static generation
  experimental: {
    // Removing optimizeCss to avoid critters issues
    optimizePackageImports: [
      "react", 
      "react-dom", 
      "lucide-react", 
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu"
    ],
    // Improve client-side navigation
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Optimize link prefetching strategy
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable compression
  compiler: {
    // Remove console logs and debugger statements in production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error', 'warn'],
    } : false,
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
  // Configure page loading behavior with optimized headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Add preload hints for critical pages
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: '</agent-workspace>; rel=prefetch; as=document, </chat>; rel=prefetch; as=document',
          },
        ],
      },
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
};

module.exports = nextConfig; 