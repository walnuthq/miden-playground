import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  webpack: (config) => {
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };
    // Add WASM to asset rules
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });
    return config;
  },
  allowedDevOrigins: ["playground.miden.local"],
  rewrites: () => [
    {
      source: "/proxy.js",
      destination:
        "https://simpleanalyticsexternal.com/proxy.js?hostname=playground.miden.xyz&path=/simple",
    },
    {
      source: "/proxy.dev.js",
      destination:
        "https://simpleanalyticsexternal.com/proxy.js?hostname=playground.miden.local&path=/simple",
    },
    {
      source: "/simple/:path*",
      destination: "https://queue.simpleanalyticscdn.com/:path*",
    },
  ],
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

export default withMDX(nextConfig);

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
