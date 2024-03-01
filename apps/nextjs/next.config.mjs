/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: process.env.BASE_PATH || '',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/feeds',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
