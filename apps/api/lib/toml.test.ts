import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  generateCargoToml,
  generateMidenProjectToml,
  parseMidenProjectToml,
} from "./toml.ts";

const noteToml =
  '[package]\nname = "counter-note"\nversion = "0.1.0"\n\n[lib]\nkind = "note"\nnamespace = "miden:counter-note/miden-counter-note@0.1.0"\npath = "src/lib.rs"\n\n[dependencies]\nmiden-core = "*"\nmiden-protocol = "*"\n\n';

const note = generateMidenProjectToml({
  name: "counter-note",
  type: "note",
  rust: "fn main() {}",
  dependencies: [],
});

describe("generateMidenProjectToml", () => {
  test("note without dependencies", () => {
    assert.equal(note, noteToml);
  });
  test("note with a path dependency", () => {
    const toml = generateMidenProjectToml({
      name: "counter-note",
      type: "note",
      rust: "",
      dependencies: [
        {
          id: "x",
          name: "counter-account",
          type: "account-component",
          commitment: "",
        },
      ],
    });
    assert.equal(
      toml,
      `${noteToml.slice(0, -1)}counter-account = { path = "../counter-account" }\n\n\n`,
    );
  });
  test("account component uses the trait name and metadata", () => {
    const toml = generateMidenProjectToml({
      name: "my-counter",
      type: "account-component",
      rust: "#[component]\npub trait CounterContract {}",
      dependencies: [],
    });
    assert.ok(
      toml.includes('namespace = "miden:my-counter/counter-contract@0.1.0"'),
    );
    assert.ok(
      toml.endsWith(
        '[package.metadata.miden]\nsupported-types = ["RegularAccountUpdatableCode"]\n\n',
      ),
    );
  });
  test("kebab-case names are not re-split", () => {
    const toml = generateMidenProjectToml({
      name: "p2id-note",
      type: "note",
      rust: "",
      dependencies: [],
    });
    assert.ok(
      toml.includes('namespace = "miden:p2id-note/miden-p2id-note@0.1.0"'),
    );
  });
  test("transaction script namespace", () => {
    const toml = generateMidenProjectToml({
      name: "init",
      type: "transaction-script",
      rust: "",
      dependencies: [],
    });
    assert.ok(
      toml.includes('namespace = "miden:base/transaction-script@1.0.0"'),
    );
  });
  test("library has no namespace", () => {
    const toml = generateMidenProjectToml({
      name: "my-lib",
      type: "library",
      rust: "",
      dependencies: [],
    });
    assert.ok(!toml.includes("namespace"));
  });
});

describe("generateCargoToml", () => {
  test("starts with the trim-paths feature and package", () => {
    assert.ok(
      generateCargoToml({ name: "abc" }).startsWith(
        'cargo-features = ["trim-paths"]\n\n[package]\nname = "abc"\nversion = "0.1.0"\n',
      ),
    );
  });
});

describe("parseMidenProjectToml", () => {
  test("round-trips generated output", () => {
    const manifest = parseMidenProjectToml(note);
    assert.equal(manifest.package.name, "counter-note");
    assert.equal(manifest.lib.kind, "note");
  });
});
