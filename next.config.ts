import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@track-my-worth/domain",
    "@track-my-worth/api-client",
    "@track-my-worth/config",
  ],
};

export default nextConfig;
