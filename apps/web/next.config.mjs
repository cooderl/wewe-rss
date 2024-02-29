/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
