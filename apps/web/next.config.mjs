import CopyPlugin from "copy-webpack-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
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
          filter: (resourcePath) => resourcePath.endsWith(".wasm"),
          noErrorOnMissing: true,
        });
      }

      config.plugins.push(new CopyPlugin({ patterns }));
    }

    return config;
  },
};

export default nextConfig;
