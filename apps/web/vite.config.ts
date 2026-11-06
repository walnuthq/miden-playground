import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  brotliCompress as brotliCompressCallback,
  constants as zlibConstants,
} from "node:zlib";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const brotliCompress = promisify(brotliCompressCallback);

// The Miden and Para Vite plugins (@miden-sdk/vite-plugin, paraVitePlugin from
// @miden-sdk/para-react/vite) are replicated here instead of registered: the
// Miden one forces resolve.preserveSymlinks (breaks pnpm), and Para's stubs
// only 12 of the packages below. docs/claude/vite-build.md says when to switch
// to them.

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

// Cloudflare Web Analytics' beacon, when its site token is set (.env.production
// only, so no other build reports). Inserted as text: transformIndexHtml's tag
// attributes would escape the JSON's quotes with backslashes, which HTML doesn't
// understand. It stays on Cloudflare's domain: spec/analytics-trial.md says why.
const cloudflareBeacon = (): Plugin => {
  let token: string | undefined;
  return {
    name: "cloudflare-beacon",
    apply: "build",
    configResolved: (config) => {
      token = config.env.VITE_CF_BEACON_TOKEN;
    },
    transformIndexHtml: (html) =>
      token
        ? html.replace(
            "</body>",
            `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${token}"}'></script></body>`,
          )
        : html,
  };
};

// The app shell paints before the SDK's chunks: the entry (main.tsx), the
// routes and the shell import nothing from the SDK or Para, whose eager entry
// awaits the WASM at module load, so a static import graph that reached it
// would wait for the WASM too. The SDK comes in with the lazy root layout.
// Fails the build if the entry chunk's static imports reach either package:
// the deploy workflow builds, so a slip (a view importing a client hook, say)
// can't ship a slower first visit. docs/claude/phone-layout.md has the rules.
const shellIsSdkFree = {
  name: "shell-is-sdk-free",
  apply: "build",
  generateBundle: (_options, bundle) => {
    const chunks = Object.values(bundle).filter(
      (output) => output.type === "chunk",
    );
    // The HTML page is the entry's facade: find it by the module it bundles.
    const entry = chunks.find(
      (chunk) =>
        chunk.isEntry && chunk.moduleIds.some((id) => id.endsWith("/main.tsx")),
    );
    if (!entry) {
      throw new Error("shell-is-sdk-free: no entry chunk for main.tsx");
    }
    const byFileName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
    // Which chunk first imported each one, to print the path to the culprit.
    const importedBy = new Map<string, string | null>([[entry.fileName, null]]);
    const queue = [entry.fileName];
    for (let fileName = queue.shift(); fileName; fileName = queue.shift()) {
      const chunk = byFileName.get(fileName);
      if (!chunk) {
        continue;
      }
      // Their stylesheets are fine (main.tsx imports two, for the cascade
      // order): only their code awaits the WASM.
      const culprit = chunk.moduleIds.find(
        (id) =>
          /node_modules\/@(miden-sdk|getpara)\//.test(id) &&
          !id.endsWith(".css"),
      );
      if (culprit) {
        const path: string[] = [];
        for (
          let f: string | null = fileName;
          f;
          f = importedBy.get(f) ?? null
        ) {
          path.unshift(f);
        }
        throw new Error(
          `shell-is-sdk-free: the entry's static imports reach ${culprit.replace(/.*node_modules\//, "")} via ${path.join(" > ")}. The app shell's graph must stay SDK-free (docs/claude/phone-layout.md).`,
        );
      }
      for (const imported of chunk.imports) {
        if (!importedBy.has(imported)) {
          importedBy.set(imported, fileName);
          queue.push(imported);
        }
      }
    }
  },
} satisfies Plugin;

// The root layout and the app's layout are lazy routes (routes.tsx), so the
// entry's graph stays SDK-free; left to the router, their chunks would only
// be requested once the entry has run, a round trip or more after index.html
// lists the entry's, and the usable app would come later than before the
// split. So index.html modulepreloads them too, after the entry's own chunks
// and at low priority: fetched and compiled alongside the shell, run when the
// router imports them. Vite's preload helper skips chunks already linked.
const preloadLazyLayouts = {
  name: "preload-lazy-layouts",
  apply: "build",
  transformIndexHtml: {
    order: "post",
    handler: (_html, { bundle }) => {
      const chunks = Object.values(bundle ?? {}).filter(
        (output) => output.type === "chunk",
      );
      const byFileName = new Map(
        chunks.map((chunk) => [chunk.fileName, chunk]),
      );
      // A chunk and everything it imports statically.
      const closure = (fileNames: string[]) => {
        const seen = new Set<string>();
        const queue = [...fileNames];
        for (let fileName = queue.shift(); fileName; fileName = queue.shift()) {
          if (!seen.has(fileName)) {
            seen.add(fileName);
            queue.push(...(byFileName.get(fileName)?.imports ?? []));
          }
        }
        return seen;
      };
      const entry = chunks.find(
        (chunk) =>
          chunk.isEntry &&
          chunk.moduleIds.some((id) => id.endsWith("/main.tsx")),
      );
      const layouts = chunks.filter((chunk) =>
        /\/components\/lib\/(root-layout|sidebar-layout)\.tsx$/.test(
          chunk.facadeModuleId ?? "",
        ),
      );
      if (!entry || layouts.length !== 2) {
        throw new Error(
          `preload-lazy-layouts: expected the entry chunk and the two layout chunks, found ${entry ? 1 : 0} and ${layouts.length}`,
        );
      }
      const alreadyPreloaded = closure([entry.fileName]);
      return [...closure(layouts.map((chunk) => chunk.fileName))]
        .filter((fileName) => !alreadyPreloaded.has(fileName))
        .map((fileName) => ({
          tag: "link",
          attrs: {
            rel: "modulepreload",
            crossorigin: true,
            fetchpriority: "low",
            href: `/${fileName}`,
          },
          injectTo: "head",
        }));
    },
  },
} satisfies Plugin;

// Cloudflare compresses the client WASM on the fly, to 5.8 MB of brotli. Level
// 11 gets it to 4.0 MB, the largest gain on a phone's first visit, so the build
// writes it next to the WASM (~35 s) and the Worker serves it (worker/index.ts).
// Fails the build if there's no WASM to compress, so that an SDK change can't
// silently bring the slower download back.
const precompressWasm = {
  name: "precompress-wasm",
  apply: "build",
  writeBundle: async ({ dir = "dist" }) => {
    const assets = join(dir, "assets");
    const wasmFiles = (await readdir(assets)).filter((file) =>
      file.endsWith(".wasm"),
    );
    if (wasmFiles.length === 0) {
      throw new Error(`precompress-wasm: no .wasm file in ${assets}`);
    }
    await Promise.all(
      wasmFiles.map(async (file) => {
        const wasm = await readFile(join(assets, file));
        const compressed = await brotliCompress(wasm, {
          params: {
            [zlibConstants.BROTLI_PARAM_QUALITY]:
              zlibConstants.BROTLI_MAX_QUALITY,
            // The largest window browsers decode (the default is 22).
            [zlibConstants.BROTLI_PARAM_LGWIN]: 24,
            [zlibConstants.BROTLI_PARAM_SIZE_HINT]: wasm.length,
          },
        });
        await writeFile(join(assets, `${file}.br`), compressed);
      }),
    );
  },
} satisfies Plugin;

export default defineConfig({
  plugins: [
    stubs,
    react(),
    tailwindcss(),
    // Para needs these Node builtins (what paraVitePlugin adds).
    nodePolyfills({ include: ["buffer", "crypto", "stream", "util"] }),
    simpleAnalytics,
    cloudflareBeacon(),
    shellIsSdkFree,
    preloadLazyLayouts,
    precompressWasm,
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
