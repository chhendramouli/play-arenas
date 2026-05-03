import type { NextConfig } from "next";

// Static export — produces an `out/` directory of plain HTML/JS/CSS that we host
// on AWS Amplify (platform=WEB). All data fetching happens client-side against
// the backend API on EC2 (NEXT_PUBLIC_API_URL). No SSR needed.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
