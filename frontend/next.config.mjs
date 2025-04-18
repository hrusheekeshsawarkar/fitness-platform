/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5005',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '34.44.230.187',
        port: '5005',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig; 