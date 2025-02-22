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
    domains: ['localhost']
  }
}

module.exports = nextConfig 