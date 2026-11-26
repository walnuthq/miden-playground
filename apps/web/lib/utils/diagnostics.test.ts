import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Diagnostic } from "../types/script.ts";
import {
  countDiagnostics,
  diagnosticMessage,
  outputLineSeverity,
  sourceDiagnostics,
  splitLocations,
} from "./diagnostics.ts";
import { FIXTURES, fixture } from "./fixtures/compile-errors.ts";

// The text a located diagnostic marks in its source.
const marked = (
  source: string,
  {
    line,
    column,
    endColumn,
  }: { line: number; column: number; endColumn?: number },
) =>
  source.split("\n")[line - 1]?.slice(column - 1, endColumn && endColumn - 1);

describe("sourceDiagnostics", () => {
  test("places an error on its span: 1-based, length in characters", () => {
    const { name, source, diagnostics } = fixture("bad-instruction");
    const [located] = sourceDiagnostics(diagnostics, { name });
    assert.deepEqual(located, {
      severity: "error",
      message:
        "invalid syntax: invalid instruction `addd` or malformed operands",
      line: 49,
      column: 5,
      endColumn: 11,
    });
    assert.equal(marked(source, located), "addd.1");
  });

  test("an undefined procedure, with its help", () => {
    const { name, source, diagnostics } = fixture("undefined-procedure");
    const [located] = sourceDiagnostics(diagnostics, { name });
    assert.ok(located);
    assert.equal(
      located.message,
      "undefined item 'set_map_itemx'\nhelp: you might be missing an import, or the containing library has not been linked",
    );
    assert.equal(marked(source, located), "native_account::set_map_itemx");
  });

  test("a syntax error, with its label", () => {
    const { name, source, diagnostics } = fixture("syntax");
    const [located] = sourceDiagnostics(diagnostics, { name });
    assert.ok(located);
    assert.equal(
      located.message,
      "syntax error\nexpected `end` to close procedure before top-level item",
    );
    assert.equal(
      marked(source, located),
      "#! Increments the count by one and returns the new count.",
    );
  });

  test("a missing dependency, in a script that uses it", () => {
    const { name, source, diagnostics } = fixture("missing-dependency");
    const [located] = sourceDiagnostics(diagnostics, { name });
    assert.ok(located);
    assert.equal(marked(source, located), "counter_account");
  });

  test("a successful compile's warning", () => {
    const { name, source, status, diagnostics } = fixture("warning");
    assert.equal(status, "compiled");
    const [located] = sourceDiagnostics(diagnostics, { name });
    assert.equal(located?.severity, "warning");
    assert.ok(located);
    assert.equal(marked(source, located), "mem");
  });

  test("a diagnostic without a position isn't placed", () => {
    const { name, diagnostics } = fixture("no-position");
    assert.equal(diagnostics.length, 1);
    assert.deepEqual(sourceDiagnostics(diagnostics, { name }), []);
  });

  test("a diagnostic in another package's file isn't placed", () => {
    const { diagnostics } = fixture("bad-instruction");
    // The counter's error, read for a script that depends on it.
    assert.deepEqual(
      sourceDiagnostics(diagnostics, { name: "counter-note" }),
      [],
    );
    // A package whose name ends with the script's.
    assert.deepEqual(
      sourceDiagnostics(
        diagnostics.map((diagnostic) => ({
          ...diagnostic,
          file: `my-${diagnostic.file}`,
        })),
        { name: "counter-account" },
      ),
      [],
    );
  });

  test("a span without a length has no end column", () => {
    const [located] = sourceDiagnostics(
      [
        {
          severity: "error",
          message: "m",
          file: "a/a.masm",
          line: 2,
          column: 3,
        },
      ],
      { name: "a" },
    );
    assert.deepEqual(located, {
      severity: "error",
      message: "m",
      line: 2,
      column: 3,
    });
  });
});

describe("diagnosticMessage", () => {
  test("leaves out a label the message already says", () => {
    assert.equal(
      diagnosticMessage({ severity: "error", message: "m", label: "m" }),
      "m",
    );
    assert.equal(
      diagnosticMessage(
        fixture("bad-instruction").diagnostics[0] as Diagnostic,
      ),
      "invalid syntax: invalid instruction `addd` or malformed operands",
    );
  });
});

describe("countDiagnostics", () => {
  test("counts every diagnostic, positioned or not", () => {
    assert.deepEqual(countDiagnostics(fixture("no-position").diagnostics), {
      errors: 1,
      warnings: 0,
    });
    assert.deepEqual(countDiagnostics(fixture("warning").diagnostics), {
      errors: 0,
      warnings: 1,
    });
  });

  test("a script compiled before diagnostics existed has none", () => {
    assert.deepEqual(countDiagnostics(undefined), { errors: 0, warnings: 0 });
  });
});

describe("outputLineSeverity", () => {
  test("colors the reports' header lines only", () => {
    const severities = (name: (typeof FIXTURES)[number]) =>
      fixture(name).stderr.split("\n").map(outputLineSeverity).filter(Boolean);
    assert.deepEqual(severities("bad-instruction"), ["error"]);
    assert.deepEqual(severities("no-position"), ["error"]);
    // The rollup's header, then the related warning.
    assert.deepEqual(severities("warning"), ["error", "warning"]);
  });

  test("not a source line that starts like a header", () => {
    assert.equal(outputLineSeverity(" 49 |     x bogus"), undefined);
    assert.equal(outputLineSeverity("    x"), undefined);
  });
});

describe("splitLocations", () => {
  test("links the script's own source location", () => {
    const { name, stderr } = fixture("bad-instruction");
    const line = stderr.split("\n")[1] ?? "";
    assert.deepEqual(splitLocations(line, { name }), [
      { text: "    ,-[" },
      {
        text: "counter-account/counter_account.masm:49:5",
        line: 49,
        column: 5,
      },
      { text: "]" },
    ]);
  });

  test("not another package's file, nor one under another directory", () => {
    for (const text of [
      "counter-note/counter_note.masm:3:4",
      "my-counter-account/counter_account.masm:3:4",
      "../counter-account/counter_account.masm:3:4",
    ]) {
      assert.deepEqual(splitLocations(text, { name: "counter-account" }), [
        { text },
      ]);
    }
  });

  test("links web addresses, without trailing punctuation", () => {
    assert.deepEqual(
      splitLocations("see https://docs.miden.xyz/x.", { name: "a" }),
      [
        { text: "see " },
        { text: "https://docs.miden.xyz/x", href: "https://docs.miden.xyz/x" },
        { text: "." },
      ],
    );
  });
});
