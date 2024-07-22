/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // typescript: { ignoreBuildErrors: true },
  // assetPrefix: process.env.NODE_ENV === "production" ? "/about/" : undefined,
  images: {
    domains: ["localhost"],
  },
}

export default nextConfig
