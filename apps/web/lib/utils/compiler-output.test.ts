import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { cleanCompilerOutput } from "./compiler-output.ts";
import { outputLineSeverity, splitLocations } from "./diagnostics.ts";
import { FIXTURES, fixture } from "./fixtures/compile-errors.ts";

describe("cleanCompilerOutput", () => {
  test("drops the rollup before a successful build's warnings", () => {
    assert.equal(
      cleanCompilerOutput(fixture("warning").stderr),
      [
        "  ! unused import",
        "   ,-[counter-account/counter_account.masm:7:18]",
        " 6 | use miden::core::sys",
        " 7 | use miden::core::mem",
        "   :                  ^^^",
        " 8 | ",
        "   `----",
        "  help: this import is never used and can be safely removed",
      ].join("\n"),
    );
  });

  test("keeps a failed build's report as the assembler renders it", () => {
    for (const name of FIXTURES) {
      if (name === "warning") {
        continue;
      }
      const { stderr } = fixture(name);
      assert.equal(cleanCompilerOutput(stderr), stderr.trimEnd(), name);
    }
  });

  test("keeps a syntax error that isn't a rollup", () => {
    assert.match(
      cleanCompilerOutput(fixture("syntax").stderr),
      /^ {2}x syntax error$/m,
    );
  });

  test("drops the rollup of a failed build's related errors", () => {
    const output = [
      "  x syntax error",
      "  help: see emitted diagnostics for details",
      "",
      "Error:   x invalid syntax",
      "   ,-[a/a.masm:2:5]",
      "   `----",
      "Error:   x unknown instruction",
      "   ,-[a/a.masm:3:5]",
      "   `----",
      "",
    ].join("\n");
    assert.equal(
      cleanCompilerOutput(output),
      [
        "  x invalid syntax",
        "   ,-[a/a.masm:2:5]",
        "   `----",
        "  x unknown instruction",
        "   ,-[a/a.masm:3:5]",
        "   `----",
      ].join("\n"),
    );
  });

  test("keeps every report's header and location", () => {
    for (const name of FIXTURES) {
      const { name: script, stderr, diagnostics } = fixture(name);
      const clean = cleanCompilerOutput(stderr);
      assert.equal(
        clean.split("\n").filter((line) => outputLineSeverity(line)).length,
        diagnostics.length,
        name,
      );
      const located = diagnostics.filter(({ line }) => line).length;
      const links = clean
        .split("\n")
        .flatMap((line) => splitLocations(line, { name: script }))
        .filter((part) => "line" in part);
      assert.equal(links.length, located, name);
    }
  });

  test("is idempotent", () => {
    for (const name of FIXTURES) {
      const clean = cleanCompilerOutput(fixture(name).stderr);
      assert.equal(cleanCompilerOutput(clean), clean, name);
    }
  });
});
