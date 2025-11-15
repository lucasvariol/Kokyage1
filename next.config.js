/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_CRON_SECRET: process.env.CRON_SECRET
  }
}
module.exports = nextConfig
