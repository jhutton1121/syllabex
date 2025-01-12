/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*', // Matches the /api/ path in your fetch requests
        destination: 'http://syllabex-backend:8000/api/:path*', // Forwards requests to the backend
      },
    ];
  },
};

module.exports = nextConfig;
