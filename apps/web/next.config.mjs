/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_SERVER_ORIGIN_URL: process.env.NEXT_PUBLIC_SERVER_ORIGIN_URL,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
  },
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
