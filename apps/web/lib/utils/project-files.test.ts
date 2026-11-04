import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { findPackages } from "./project-files.ts";

describe("findPackages", () => {
  test("finds a single package", () => {
    assert.deepEqual(
      findPackages([
        "counter/Cargo.toml",
        "counter/miden-project.toml",
        "counter/src/lib.rs",
      ]),
      [
        {
          directory: "counter",
          manifestPath: "counter/miden-project.toml",
          sourcePath: "counter/src/lib.rs",
        },
      ],
    );
  });

  test("finds every package of a multi-package folder, skipping build outputs", () => {
    const packages = findPackages([
      "miden-bank/.DS_Store",
      "miden-bank/deposit-note/miden-project.toml",
      "miden-bank/deposit-note/src/lib.rs",
      "miden-bank/deposit-note/build.rs",
      "miden-bank/deposit-note/target/debug/build/crunchy/2154f3d33ec2eec5/out/lib.rs",
      "miden-bank/bank-account/miden-project.toml",
      "miden-bank/bank-account/src/lib.rs",
      "miden-bank/bank-account/target/release/build/crunchy/aacb488faf6a908d/out/lib.rs",
      "miden-bank/bank-account/target/x/miden-project.toml",
      "miden-bank/bank-account/target/x/src/lib.rs",
      "miden-bank/.git/miden-project.toml",
      "miden-bank/.git/src/lib.rs",
    ]);
    assert.deepEqual(
      packages.map(({ directory }) => directory),
      ["miden-bank/bank-account", "miden-bank/deposit-note"],
    );
  });

  test("leaves out a package without src/lib.rs, and a stray lib.rs", () => {
    assert.deepEqual(
      findPackages([
        "project/a/miden-project.toml",
        "project/a/lib.rs",
        "project/b/src/lib.rs",
      ]),
      [],
    );
  });
});
