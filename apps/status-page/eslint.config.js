import { config as reactInternalConfig } from "@workspace/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config} */
export default [
  ...reactInternalConfig,
  {
    // `import.meta.env.BASE_URL` is Vite's built-in base path, not an
    // environment variable, so there is nothing to declare in turbo.json.
    files: ["src/**/*.tsx"],
    rules: {
      "turbo/no-undeclared-env-vars": "off",
    },
  },
  {
    // The shared React config only declares browser globals, but the probe and
    // the Vite config are Node scripts.
    files: ["scripts/**/*.ts", "vite.config.ts"],
    languageOptions: {
      globals: {
        console: "readonly",
        performance: "readonly",
        process: "readonly",
      },
    },
  },
];
