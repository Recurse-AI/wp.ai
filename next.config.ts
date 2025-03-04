/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
    unoptimized: true, // ⚠️ Disables image optimization (Allows any external image)
  },
};

module.exports = nextConfig;
