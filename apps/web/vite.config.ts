import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// The Miden and Para Vite plugins (@miden-sdk/vite-plugin, paraVitePlugin from
// @miden-sdk/para-react/vite) are replicated here instead of registered: the
// Miden one forces resolve.preserveSymlinks (breaks pnpm), and Para's stubs
// only 12 of the packages below. CLAUDE.md says when to switch to them.

const stubPackages = [
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
  "accounts",
  // Loaded behind try/catch by Para's telemetry. It pulls in zone.js, which
  // replaces the global Promise and makes the Miden store's Dexie transactions
  // fail (PrematureCommitError), e.g. when importing a sandbox store.
  "@opentelemetry/context-zone",
];

const stubPrefix = "\0stub:";

// Para lazily imports optional connectors that aren't installed: resolve them
// (exact specifiers only) to an empty module, in the build and in dev
// pre-bundling alike.
const stubs = {
  name: "stub-optional-packages",
  enforce: "pre",
  resolveId: (source: string) =>
    stubPackages.includes(source) ? `${stubPrefix}${source}` : undefined,
  load: (id: string) =>
    id.startsWith(stubPrefix) ? "export default {};" : undefined,
} satisfies Plugin;

// Keeps @miden-sdk/react out of the pre-bundled signer packages
// (@miden-sdk/miden-wallet-adapter, @miden-sdk/para-react), so their providers
// share the app's React contexts (MidenProvider, MultiSignerProvider).
const externalizeMidenReact = {
  name: "externalize-miden-react",
  resolveId: (source: string) =>
    /^@miden-sdk\/react(\/lazy)?$/.test(source)
      ? { id: source, external: true }
      : undefined,
};

// Simple Analytics, proxied through our domain by the Worker (worker/index.ts).
// Production builds only: nothing serves /proxy.js under `vite`.
const simpleAnalytics = {
  name: "simple-analytics",
  apply: "build",
  transformIndexHtml: () => [
    {
      tag: "script",
      attrs: { async: true, src: "/proxy.js" },
      injectTo: "body",
    },
  ],
} satisfies Plugin;

export default defineConfig({
  plugins: [
    stubs,
    react(),
    tailwindcss(),
    // Para needs these Node builtins (what paraVitePlugin adds).
    nodePolyfills({ include: ["buffer", "crypto", "stream", "util"] }),
    simpleAnalytics,
  ],
  resolve: {
    alias: [{ find: "@", replacement: import.meta.dirname }],
    dedupe: [
      "@miden-sdk/miden-sdk",
      "@miden-sdk/react",
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@getpara/web-sdk",
      "@getpara/react-sdk-lite",
    ],
  },
  optimizeDeps: {
    // Pre-bundling corrupts the WASM.
    exclude: ["@miden-sdk/miden-sdk"],
    rolldownOptions: {
      plugins: [stubs, externalizeMidenReact],
    },
  },
  // The SDK initializes its WASM with top-level await and runs module workers.
  build: { target: "esnext" },
  worker: { format: "es" },
  server: {
    port: 3000,
    strictPort: true,
    allowedHosts: ["playground.miden.local"],
  },
  preview: { port: 3000, strictPort: true },
});
