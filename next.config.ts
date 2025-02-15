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
      {
        protocol: "https",
        hostname: "ec3b-59-152-111-154.ngrok-free.app", // WordPress Profile Pictures
      },
      {
        protocol: "https",
        hostname: "media.istockphoto.com", // WordPress Profile Pictures
      },
    ],
  },
};

module.exports = nextConfig;
