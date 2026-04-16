import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Include sample HTML reference in the serverless bundle so the Claude
  // route can fs.readFileSync() it on any deployment (Railway, Vercel).
  outputFileTracingIncludes: {
    "/api/quotes/*/generate": ["./samples/**/*"],
  },
};

export default nextConfig;
