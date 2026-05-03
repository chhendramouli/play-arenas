import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for AWS Amplify Hosting on the WEB_COMPUTE platform: produces a
  // self-contained server bundle in .next/standalone that Amplify wraps into
  // its deploy-manifest.json automatically.
  output: "standalone",
};

export default nextConfig;
