// import { dirname } from "path";
// import { fileURLToPath } from "url";
import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const paraStubPackages = [
  "@getpara/solana-wallet-connectors",
  "@getpara/cosmos-wallet-connectors",
  "@getpara/aa-alchemy",
  "@getpara/aa-biconomy",
  "@getpara/aa-cdp",
  "@getpara/aa-gelato",
  "@getpara/aa-pimlico",
  "@getpara/aa-porto",
  "@getpara/aa-rhinestone",
  "@getpara/aa-safe",
  "@getpara/aa-thirdweb",
  "@getpara/aa-zerodev",
  // Optional connectors of @getpara/web-sdk, @getpara/evm-wallet-connectors
  // and wagmi, imported behind try/catch.
  "@farcaster/miniapp-sdk",
  "@farcaster/miniapp-wagmi-connector",
  "@base-org/account",
  "@metamask/connect-evm",
  "@safe-global/safe-apps-provider",
  "@safe-global/safe-apps-sdk",
  "accounts$",
  // Loaded behind try/catch by Para's telemetry. It pulls in zone.js, which
  // replaces the global Promise and makes the Miden store's Dexie transactions
  // fail (PrematureCommitError), e.g. when importing a sandbox store.
  "@opentelemetry/context-zone",
];

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  webpack: (config /*, { dev, webpack }*/) => {
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };
    // Dependencies (wallet adapter, multisig client) import the eager
    // "@miden-sdk/miden-sdk" entry, whose top-level await blocks SSR.
    // Redirect bare specifiers to the lazy single-threaded variant.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@miden-sdk/miden-sdk$": "@miden-sdk/miden-sdk/lazy",
      "@miden-sdk/react$": "@miden-sdk/react/lazy",
      // Para lazily imports optional connectors that aren't installed; stub
      // them like @miden-sdk/para-react's paraVitePlugin does for Vite.
      ...Object.fromEntries(paraStubPackages.map((pkg) => [pkg, false])),
    };
    // Add WASM to asset rules
    // config.module.rules.push({
    //   test: /\.wasm$/,
    //   type: "asset/resource",
    // });
    // if (!dev) {
    //   config.plugins.push(
    //     new webpack.NormalModuleReplacementPlugin(
    //       /\.wasm$/,
    //       `${dirname(fileURLToPath(import.meta.url))}/public/wasm/0.13.1/miden_client_web.wasm`,
    //     ),
    //   );
    // }
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
