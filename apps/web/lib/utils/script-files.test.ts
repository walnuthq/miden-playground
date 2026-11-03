import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildFileTree } from "./file-tree.ts";
import {
  addTomlDependency,
  filesWithDependency,
  removeTomlDependency,
} from "./script-files.ts";

// As the API generates them (apps/api/lib/toml.ts), without and with a
// dependency.
const WITHOUT = `[package]
name = "counter-note"
version = "0.1.0"

[lib]
kind = "note"
namespace = "miden:counter-note/miden-counter-note@0.1.0"
path = "src/lib.rs"

[dependencies]
miden-core = "*"
miden-protocol = "*"

`;

const WITH = `[package]
name = "counter-note"
version = "0.1.0"

[lib]
kind = "note"
namespace = "miden:counter-note/miden-counter-note@0.1.0"
path = "src/lib.rs"

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
    const files = { "src/lib.rs": "fn main() {}" };
    assert.equal(filesWithDependency(files, "a", "add"), files);
  });
});

describe("buildFileTree", () => {
  test("folders first, then files, alphabetically", () => {
    assert.deepEqual(
      buildFileTree(["miden-project.toml", "src/lib.rs", "Cargo.toml"]),
      [
        {
          name: "src",
          path: "src",
          children: [{ name: "lib.rs", path: "src/lib.rs" }],
        },
        { name: "Cargo.toml", path: "Cargo.toml" },
        { name: "miden-project.toml", path: "miden-project.toml" },
      ],
    );
  });
});
