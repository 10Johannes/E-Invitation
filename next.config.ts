import type { NextConfig } from "next";

// Standalone output is for the self-hosted Docker image only. On Vercel it
// breaks build-output tracing (missing next-server.js.nft.json).
const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
