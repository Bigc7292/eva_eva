/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@eva-col/ui"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'transformed-academy-and-salon-ceo.s3.eu-north-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig