// The editor console's default view of api-compile's `stderr`: the
// assembler's reports without the wrapper around them. Display only: the
// stored output is the raw text, which the console's "Show full output" toggle
// shows as is, and the markers and counts read the diagnostics list. Keep the
// rules in sync with the fixtures in `fixtures/compile-errors/` when
// miden-assembly or api-compile change.

// miden-assembly's `SyntaxError` rolls up the reports of one phase, and is
// rendered as a report of its own before them, with a fixed help line:
//
//     x syntax error
//     help: see emitted diagnostics for details
//
//   Warning:   ! unused import
//
// api-compile gets a successful build's warnings by building again with
// warnings as errors, so a build with warnings shows it too.
const ROLLUP_HELP = /^\s+help: see emitted diagnostics for details$/;
const ROLLUP_HEADER = /^\s{2}x syntax error$/;
// What miette writes before a related report's header, where the header's
// own indentation already says it's a report.
const RELATED_PREFIX = /^(?:Error|Warning|Advice): (?=\s{2}[x!i] )/;

export const cleanCompilerOutput = (output: string) => {
  const lines: string[] = [];
  for (const line of output.split("\n")) {
    if (ROLLUP_HELP.test(line) && ROLLUP_HEADER.test(lines.at(-1) ?? "")) {
      lines.pop();
      continue;
    }
    const blank = line.trim() === "";
    // One blank line at most between reports, none at either end.
    if (blank && (lines.length === 0 || lines.at(-1) === "")) {
      continue;
    }
    lines.push(blank ? "" : line.replace(RELATED_PREFIX, ""));
  }
  while (lines.at(-1) === "") {
    lines.pop();
  }
  return lines.join("\n");
};
