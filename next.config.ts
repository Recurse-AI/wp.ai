/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/wp-api/:userId/:path*',
        destination: 'http://localhost:8000/user_:userId/wp-json/:path*'
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
};

module.exports = nextConfig;
