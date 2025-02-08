/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google Profile Pictures
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com", // WordPress Profile Pictures
      },
    ],
  },
};

module.exports = nextConfig;
