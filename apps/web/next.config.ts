import type { NextConfig } from "next";
import CopyPlugin from "copy-webpack-plugin";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  /* webpack(config, { isServer, dev }) {
    // Use the client static directory in the server bundle and prod mode
    // Fixes `Error occurred prerendering page "/"`
    config.output.webassemblyModuleFilename =
      isServer && !dev
        ? "../static/wasm/[modulehash].wasm"
        : "static/wasm/[modulehash].wasm";

    // Since Webpack 5 doesn't enable WebAssembly by default, we should do it manually
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    return config;
  }, */
  webpack: (config, { isServer, dev }) => {
    config.experiments = {
      ...config.experiments,
      layers: true,
      asyncWebAssembly: true,
    };

    if (!dev && isServer) {
      // webassemblyModuleFilename = "./../server/chunks/[modulehash].wasm";

      const patterns = [];

      const destinations = [
        "../static/wasm/[name][ext]", // -> .next/static/wasm
        "./static/wasm/[name][ext]", // -> .next/server/static/wasm
        ".", // -> .next/server/chunks (for some reason this is necessary)
      ];
      for (const dest of destinations) {
        patterns.push({
          context: ".next/server/chunks",
          from: ".",
          to: dest,
          filter: (resourcePath: string) => resourcePath.endsWith(".wasm"),
          noErrorOnMissing: true,
        });
      }

      config.plugins.push(new CopyPlugin({ patterns }));
    }

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
