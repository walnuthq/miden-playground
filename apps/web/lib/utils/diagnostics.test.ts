import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { parseDiagnostics, splitLocations } from "./diagnostics.ts";

// Real outputs of the local api-compile for the counter contract example's
// account component, each broken a different way.
const fixture = (name: string) =>
  readFileSync(
    new URL(`./fixtures/compile-errors/${name}.txt`, import.meta.url),
    "utf-8",
  );

describe("parseDiagnostics", () => {
  test("syntax error, with secondary labels and a help suggestion", () => {
    assert.deepEqual(parseDiagnostics(fixture("syntax")), [
      {
        severity: "error",
        message:
          "expected one of `!` or `::`, found doc comment `/// Increments the counter value stored in the contract's storage map by one.`\nhelp: add a space before the last `/` to write a regular comment",
        file: "src/lib.rs",
        line: 26,
        column: 5,
        endColumn: 82,
      },
      {
        severity: "error",
        message:
          "The `component` macro only supports a component trait or a trait implementation block.\nnote: this error originates in the attribute macro `component` (in Nightly builds, run with -Z macro-backtrace for more info)",
        file: "src/lib.rs",
        line: 21,
        column: 1,
        endColumn: 13,
      },
    ]);
  });

  test("error code", () => {
    assert.deepEqual(parseDiagnostics(fixture("e0425")), [
      {
        severity: "error",
        message: "cannot find value `missing_key` in this scope",
        code: "E0425",
        file: "src/lib.rs",
        line: 37,
        column: 28,
        endColumn: 39,
      },
    ]);
  });

  test("help block with its own snippet", () => {
    const [diagnostic] = parseDiagnostics(fixture("mismatch"));
    assert.equal(diagnostic?.code, "E0308");
    assert.equal(diagnostic?.line, 37);
    assert.equal(diagnostic?.column, 9);
    assert.equal(diagnostic?.endColumn, 13);
    assert.match(diagnostic?.message ?? "", /\nhelp: call `Into::into`/);
  });

  test("primary carets after secondary dashes on the same line", () => {
    const [diagnostic] = parseDiagnostics(fixture("multiline"));
    assert.equal(diagnostic?.line, 33);
    assert.equal(diagnostic?.column, 28);
    assert.equal(diagnostic?.endColumn, 32);
  });

  test("error and warning", () => {
    const diagnostics = parseDiagnostics(fixture("warning-and-error"));
    assert.deepEqual(
      diagnostics.map(({ severity, code, line, column, endColumn }) => ({
        severity,
        code,
        line,
        column,
        endColumn,
      })),
      [
        {
          severity: "error",
          code: "E0596",
          line: 37,
          column: 9,
          endColumn: 23,
        },
        {
          severity: "warning",
          code: undefined,
          line: 48,
          column: 13,
          endColumn: 19,
        },
      ],
    );
    assert.equal(
      diagnostics[1]?.message,
      "unused variable: `unused`\nnote: `#[warn(unused_variables)]` (part of `#[warn(unused)]`) on by default",
    );
  });

  test("summaries and the target feature warning are skipped", () => {
    assert.deepEqual(
      parseDiagnostics(
        [
          "Command failed: cargo miden build --release --offline",
          "   Compiling counter-account v0.1.0 (/tmp/miden-project-B46omH/counter-account)",
          "warning: unstable feature specified for `-Ctarget-feature`: `wide-arithmetic`",
          "  |",
          "  = note: this feature is not stably supported; its behavior can change in the future",
          "",
          "warning: `counter-account` (lib) generated 1 warning",
          "error: could not compile `counter-account` (lib) due to 1 previous error; 1 warning emitted",
        ].join("\n"),
      ),
      [],
    );
  });

  test("span over several lines", () => {
    const [diagnostic] = parseDiagnostics(
      [
        "error[E0308]: mismatched types",
        "  --> src/lib.rs:12:5",
        "   |",
        "12 | /     if a {",
        "13 | |         b",
        "14 | |     }",
        "   | |_____^ expected `Felt`, found `()`",
      ].join("\n"),
    );
    assert.equal(diagnostic?.line, 12);
    assert.equal(diagnostic?.column, 5);
    assert.equal(diagnostic?.endColumn, undefined);
  });

  test("ANSI colors and other files", () => {
    assert.deepEqual(
      parseDiagnostics(
        "\u001b[1m\u001b[31merror\u001b[0m: boom\n  --> ../dep/src/lib.rs:3:1\n   |\n 3 | x\n   | ^",
      ),
      [
        {
          severity: "error",
          message: "boom",
          file: "../dep/src/lib.rs",
          line: 3,
          column: 1,
          endColumn: 2,
        },
      ],
    );
  });
});

describe("splitLocations", () => {
  test("links the script's locations only", () => {
    assert.deepEqual(
      splitLocations(
        "a --> src/lib.rs:26:5\nb --> ../dep/src/lib.rs:3:1 c src/lib.rs:21:1",
      ),
      [
        { text: "a --> " },
        { text: "src/lib.rs:26:5", line: 26, column: 5 },
        { text: "\nb --> ../dep/src/lib.rs:3:1 c " },
        { text: "src/lib.rs:21:1", line: 21, column: 1 },
      ],
    );
  });

  test("text without locations", () => {
    assert.deepEqual(splitLocations("Script compiled successfully."), [
      { text: "Script compiled successfully." },
    ]);
  });
});
