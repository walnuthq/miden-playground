import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { cleanCompilerOutput } from "./compiler-output.ts";
import { parseDiagnostics } from "./diagnostics.ts";

const fixture = (name: string) =>
  readFileSync(
    new URL(`./fixtures/compile-errors/${name}.txt`, import.meta.url),
    "utf-8",
  );

const FIXTURES = [
  "e0425",
  "mismatch",
  "multiline",
  "success-warnings",
  "syntax",
  "warning-and-error",
];

describe("cleanCompilerOutput", () => {
  test("keeps the diagnostics only, with the error code's docs", () => {
    assert.equal(
      cleanCompilerOutput(fixture("e0425")),
      [
        "error[E0425]: cannot find value `missing_key` in this scope",
        "  --> src/lib.rs:37:28",
        "   |",
        "37 |         self.count_map.get(missing_key)",
        "   |                            ^^^^^^^^^^^ not found in this scope",
        "",
        "For more information about this error, see https://doc.rust-lang.org/error_codes/E0425.html",
      ].join("\n"),
    );
  });

  test("successful compile: the user's warnings only", () => {
    assert.equal(
      cleanCompilerOutput(fixture("success-warnings")),
      [
        "warning: unused variable: `unused`",
        "  --> src/lib.rs:34:13",
        "   |",
        "34 |         let unused = 1;",
        "   |             ^^^^^^ help: if this is intentional, prefix it with an underscore: `_unused`",
        "   |",
        "   = note: `#[warn(unused_variables)]` (part of `#[warn(unused)]`) on by default",
      ].join("\n"),
    );
  });

  test("build noise alone cleans to nothing", () => {
    assert.equal(
      cleanCompilerOutput(
        [
          "   Compiling counter-account v0.1.0 (/tmp/miden-project-eCGR2d/counter-account)",
          "warning: unstable feature specified for `-Ctarget-feature`: `wide-arithmetic`",
          "  |",
          "  = note: this feature is not stably supported; its behavior can change in the future",
          "",
          "warning: `counter-account` (lib) generated 1 warning",
          "    Finished `release` profile [optimized] target(s) in 1.19s",
          "",
        ].join("\n"),
      ),
      "",
    );
  });

  test("drops the build directory, keeps the package's", () => {
    assert.equal(
      cleanCompilerOutput(
        "error: failed to read `/tmp/miden-project-AbC123/counter-account/src/lib.rs`",
      ),
      "error: failed to read `counter-account/src/lib.rs`",
    );
  });

  for (const name of FIXTURES) {
    test(`${name}: no diagnostic lost, no noise left, idempotent`, () => {
      const output = fixture(name);
      const clean = cleanCompilerOutput(output);
      assert.deepEqual(parseDiagnostics(clean), parseDiagnostics(output));
      for (const noise of [
        "Command failed",
        "/tmp/",
        "wide-arithmetic",
        "Compiling",
        "Finished",
        "could not compile",
        "rustc --explain",
        "\n\n\n",
      ]) {
        assert.ok(!clean.includes(noise), `${noise} left in ${name}`);
      }
      assert.equal(clean, clean.trim());
      assert.equal(cleanCompilerOutput(clean), clean);
    });
  }
});
