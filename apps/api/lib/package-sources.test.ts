import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { resolvePackageSources } from "./package-sources.ts";

const manifest = ({
  name,
  kind = "note",
  dependencies = [],
}: {
  name?: string;
  kind?: string;
  dependencies?: string[];
}) =>
  [
    name === undefined ? "[package]" : `[package]\nname = "${name}"`,
    `[lib]\nkind = "${kind}"`,
    `[dependencies]\nmiden-core = "*"\nmiden-protocol = "*"`,
    ...dependencies.map(
      (dependency) => `${dependency} = { path = "../${dependency}" }`,
    ),
  ].join("\n");

const source = (midenProjectToml: string, rust = "fn main() {}") => ({
  midenProjectToml,
  rust,
});

describe("resolvePackageSources", () => {
  test("orders dependencies first and resolves their names", () => {
    const result = resolvePackageSources({
      "note-a": source(
        manifest({ name: "note-a", dependencies: ["account-b"] }),
      ),
      "account-b": source(manifest({ name: "account-b", kind: "account" })),
    });
    assert.deepEqual(
      result.map(({ name }) => name),
      ["account-b", "note-a"],
    );
    assert.deepEqual(result[1]?.dependencies, ["account-b"]);
    assert.equal(result[0]?.type, "account-component");
  });
  test("ignores miden-core and miden-protocol", () => {
    const [pkg] = resolvePackageSources({
      "note-a": source(manifest({ name: "note-a" })),
    });
    assert.deepEqual(pkg?.dependencies, []);
  });
  test("tx-script resolves to transaction-script", () => {
    const [pkg] = resolvePackageSources({
      s: source(manifest({ name: "s", kind: "tx-script" })),
    });
    assert.equal(pkg?.type, "transaction-script");
  });
  test("invalid TOML throws", () => {
    assert.throws(
      () => resolvePackageSources({ a: source("= not toml [") }),
      /invalid miden-project.toml/,
    );
  });
  test("missing name throws", () => {
    assert.throws(
      () => resolvePackageSources({ a: source(manifest({})) }),
      /has no \[package\] name/,
    );
  });
  test("unknown kind throws", () => {
    assert.throws(
      () =>
        resolvePackageSources({
          a: source(manifest({ name: "a", kind: "nope" })),
        }),
      /has no valid \[lib\] kind/,
    );
  });
  test("empty rust throws", () => {
    assert.throws(
      () => resolvePackageSources({ a: source(manifest({ name: "a" }), "") }),
      /src\/lib.rs is missing or empty/,
    );
  });
  test("duplicate names throw", () => {
    assert.throws(
      () =>
        resolvePackageSources({
          a: source(manifest({ name: "same" })),
          b: source(manifest({ name: "same" })),
        }),
      /are both named/,
    );
  });
  test("missing path dependency throws", () => {
    assert.throws(
      () =>
        resolvePackageSources({
          a: source(manifest({ name: "a", dependencies: ["ghost"] })),
        }),
      /isn't in the imported folder/,
    );
  });
  test("a cycle returns both packages", () => {
    const result = resolvePackageSources({
      a: source(manifest({ name: "a", dependencies: ["b"] })),
      b: source(manifest({ name: "b", dependencies: ["a"] })),
    });
    assert.deepEqual(result.map(({ name }) => name).sort(), ["a", "b"]);
  });
});
