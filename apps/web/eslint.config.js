import { nextJsConfig } from "@workspace/eslint-config/next-js";

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    // Playwright fixtures call `use()`, which isn't React's.
    files: ["e2e/**"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
];
