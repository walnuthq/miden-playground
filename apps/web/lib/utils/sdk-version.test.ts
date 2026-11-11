import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

// The SDK version is written by hand in three places (see
// docs/claude/upgrading-miden.md): a bump that misses one breaks store
// imports at runtime, not at build time.
const web = join(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(join(web, path), "utf-8");

const { dependencies } = JSON.parse(read("package.json")) as {
  dependencies: Record<string, string>;
};
const sdkVersion = dependencies["@miden-sdk/miden-sdk"];

test("the @miden-sdk packages of the web app share one version", () => {
  for (const name of [
    "@miden-sdk/miden-wallet-adapter",
    "@miden-sdk/para",
    "@miden-sdk/para-react",
    "@miden-sdk/react",
  ]) {
    assert.equal(dependencies[name], sdkVersion, name);
  }
});

test("the workspace overrides pin the same version", () => {
  const workspace = read("../../pnpm-workspace.yaml");
  for (const name of ["@miden-sdk/miden-sdk", "@miden-sdk/react"]) {
    const version = workspace.match(
      new RegExp(`^  "${name}": "([^"]+)"$`, "m"),
    )?.[1];
    assert.equal(version, sdkVersion, name);
  }
});

test("CLIENT_VERSION stamps stores with the same version", () => {
  const version = read("lib/utils/store.ts").match(
    /^const CLIENT_VERSION = "([^"]+)";$/m,
  )?.[1];
  assert.equal(version, sdkVersion);
});
