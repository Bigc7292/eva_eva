/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react', 'date-fns', 'recharts'],
  },
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
  // Enable standalone output for Docker
  output: 'standalone',
  // Disable type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig