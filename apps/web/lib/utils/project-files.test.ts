import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  findCargoOnlyDirectories,
  findPackages,
  manifestSourcePath,
} from "./project-files.ts";

describe("findPackages", () => {
  test("finds a single package", () => {
    assert.deepEqual(
      findPackages(["counter/miden-project.toml", "counter/counter.masm"]),
      [
        {
          directory: "counter",
          manifestPath: "counter/miden-project.toml",
          rust: false,
        },
      ],
    );
  });

  test("tells a Rust project by its Cargo.toml", () => {
    assert.deepEqual(
      findPackages([
        "counter/Cargo.toml",
        "counter/miden-project.toml",
        "counter/src/lib.rs",
      ]).map(({ rust }) => rust),
      [true],
    );
  });

  test("finds every package of a multi-package folder, skipping build outputs", () => {
    const packages = findPackages([
      "bank/.DS_Store",
      "bank/deposit-note/miden-project.toml",
      "bank/deposit-note/deposit_note.masm",
      "bank/bank-account/miden-project.toml",
      "bank/bank-account/bank_account.masm",
      "bank/bank-account/target/x/miden-project.toml",
      "bank/node_modules/y/miden-project.toml",
      "bank/.git/miden-project.toml",
    ]);
    assert.deepEqual(
      packages.map(({ directory }) => directory),
      ["bank/bank-account", "bank/deposit-note"],
    );
  });
});

describe("findCargoOnlyDirectories", () => {
  test("lists the Rust projects without a Miden manifest", () => {
    assert.deepEqual(
      findCargoOnlyDirectories([
        "rust/Cargo.toml",
        "rust/src/lib.rs",
        "rust/target/x/Cargo.toml",
        "both/Cargo.toml",
        "both/miden-project.toml",
      ]),
      ["rust"],
    );
  });
});

describe("manifestSourcePath", () => {
  test("is the [lib] path, from the package's directory", () => {
    const manifest = `[package]
name = "counter-account"
version = "0.1.0"

[lib]
kind = "account-component"
namespace = "counter_account"
path = "counter_account.masm"

[dependencies]
miden-core = "*"
`;
    assert.equal(
      manifestSourcePath("project/counter-account", manifest),
      "project/counter-account/counter_account.masm",
    );
    assert.equal(manifestSourcePath("", manifest), "counter_account.masm");
  });

  test("refuses a path that isn't a .masm file inside the package", () => {
    for (const path of ["src/lib.rs", "../other/a.masm", "/a.masm"]) {
      assert.equal(
        manifestSourcePath("p", `[lib]\npath = "${path}"\n`),
        undefined,
      );
    }
  });

  test("refuses a manifest without [lib] path, or that doesn't parse", () => {
    assert.equal(manifestSourcePath("p", '[lib]\nkind = "note"\n'), undefined);
    assert.equal(manifestSourcePath("p", "[lib\npath ="), undefined);
  });
});
