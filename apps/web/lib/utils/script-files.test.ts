import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildFileTree } from "./file-tree.ts";
import {
  addTomlDependency,
  filesWithDependency,
  filesWithSource,
  removeTomlDependency,
  scriptFilePaths,
  scriptSource,
  sourceFiles,
} from "./script-files.ts";

// As the API generates them (apps/api/lib/toml.ts), without and with a
// dependency.
const WITHOUT = `[package]
name = "counter-note"
version = "0.1.0"

[lib]
kind = "note"
namespace = "counter_note"
path = "counter_note.masm"

[dependencies]
miden-core = "*"
miden-protocol = "*"

`;

const WITH = `[package]
name = "counter-note"
version = "0.1.0"

[lib]
kind = "note"
namespace = "counter_note"
path = "counter_note.masm"

[dependencies]
miden-core = "*"
miden-protocol = "*"
counter-account = { path = "../counter-account" }

`;

const ACCOUNT = `[dependencies]
miden-core = "*"
miden-protocol = "*"

[package.metadata.miden]
supported-types = ["RegularAccountUpdatableCode"]
`;

describe("miden-project.toml dependencies", () => {
  test("adds a dependency at the end of [dependencies]", () => {
    assert.equal(addTomlDependency(WITHOUT, "counter-account"), WITH);
  });

  test("adds before the next section", () => {
    assert.equal(
      addTomlDependency(ACCOUNT, "basic-wallet"),
      ACCOUNT.replace(
        'miden-protocol = "*"\n',
        'miden-protocol = "*"\nbasic-wallet = { path = "../basic-wallet" }\n',
      ),
    );
  });

  test("adding twice keeps one line", () => {
    assert.equal(addTomlDependency(WITH, "counter-account"), WITH);
  });

  test("removes a dependency", () => {
    assert.equal(removeTomlDependency(WITH, "counter-account"), WITHOUT);
  });

  test("no [dependencies]: unchanged", () => {
    assert.equal(addTomlDependency("[package]\n", "a"), "[package]\n");
  });

  test("a script without manifest keeps its files", () => {
    const files = { "a.masm": "begin end" };
    assert.equal(filesWithDependency(files, "a", "add"), files);
  });
});

describe("buildFileTree", () => {
  test("folders first, then files, alphabetically", () => {
    assert.deepEqual(
      buildFileTree(["miden-project.toml", "src/a.masm", "counter.masm"]),
      [
        {
          name: "src",
          path: "src",
          children: [{ name: "a.masm", path: "src/a.masm" }],
        },
        { name: "counter.masm", path: "counter.masm" },
        { name: "miden-project.toml", path: "miden-project.toml" },
      ],
    );
  });
});

describe("a script's source", () => {
  test("is the MASM file named after the script, next to its manifest", () => {
    assert.deepEqual(scriptFilePaths({ name: "counter-account" }), [
      "counter_account.masm",
      "miden-project.toml",
    ]);
    const script = {
      name: "counter-account",
      files: { "counter_account.masm": "begin end", "miden-project.toml": "" },
    };
    assert.equal(scriptSource(script), "begin end");
    assert.deepEqual(filesWithSource(script, "x"), {
      "counter_account.masm": "x",
      "miden-project.toml": "",
    });
  });

  test("a built-in has its MASM as its source, a library no file", () => {
    assert.deepEqual(sourceFiles("basic-wallet", "pub proc a end"), {
      "basic_wallet.masm": "pub proc a end",
    });
    assert.deepEqual(sourceFiles("miden-core", ""), {});
    assert.equal(scriptSource({ name: "miden-core", files: {} }), "");
  });
});
