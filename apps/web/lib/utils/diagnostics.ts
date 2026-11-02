// Compile errors as api-compile returns them: the message of the failed
// `cargo miden build`, which ends with rustc's rendered diagnostics. midenc
// runs cargo with `--message-format json-render-diagnostics` but keeps only the
// artifacts from the JSON, so this text is all there is to parse:
//
//   error[E0425]: cannot find value `missing_key` in this scope
//     --> src/lib.rs:44:32
//      |
//   44 |         self.count_map.get(missing_key)
//      |                            ^^^^^^^^^^^ not found in this scope
//      |
//      = help: …

export type DiagnosticSeverity = "error" | "warning";

export type Diagnostic = {
  severity: DiagnosticSeverity;
  // The header's message, followed by its `help:` and `note:` lines.
  message: string;
  // rustc's error code, e.g. E0425.
  code?: string;
  // Relative to the package's directory, e.g. src/lib.rs.
  file: string;
  // 1-based, like Monaco. `endColumn` is exclusive, and undefined when the
  // span's width isn't known (e.g. a span over several lines).
  line: number;
  column: number;
  endColumn?: number;
};

// The file a script's code is compiled from.
export const SCRIPT_FILE = "src/lib.rs";

// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escapes.
const ANSI_ESCAPE = /\u001b\[[0-9;]*m/g;
const HEADER = /^(error|warning)(?:\[(E\d+)\])?: (.+)$/;
const LOCATION = /^\s*--> (.+):(\d+):(\d+)$/;
// An annotation line: the gutter without a line number, e.g. `   |    ^^^ …`.
const ANNOTATION = /^\s*\|/;
// The primary span is underlined with carets (secondary ones with dashes). On
// a span over several lines, they end a `|___^` connector instead.
const CARETS = /(_?)(\^+)/;
const HELP = /^\s*(?:= )?((?:help|note): .+)$/;

export const parseDiagnostics = (output: string): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];
  let current: Omit<Diagnostic, "file" | "line" | "column"> | undefined;
  let located: Diagnostic | undefined;
  // Past a `help:` or `note:` line, annotations belong to its suggestion.
  let spanDone = false;
  for (const line of output.replace(ANSI_ESCAPE, "").split("\n")) {
    const header = HEADER.exec(line);
    if (header) {
      const [, severity, code, message = ""] = header;
      current = {
        severity: severity as DiagnosticSeverity,
        message,
        ...(code && { code }),
      };
      located = undefined;
      spanDone = false;
      continue;
    }
    if (!current) {
      continue;
    }
    if (!located) {
      // Only the first location is the diagnostic's own. Headers without one
      // (e.g. `error: could not compile …`) are summaries: never added.
      const location = LOCATION.exec(line);
      if (location) {
        const [, file = "", lineNumber, column] = location;
        located = {
          ...current,
          file,
          line: Number(lineNumber),
          column: Number(column),
        };
        diagnostics.push(located);
      }
      continue;
    }
    const help = HELP.exec(line);
    if (help) {
      located.message += `\n${help[1]}`;
      spanDone = true;
      continue;
    }
    if (!spanDone && ANNOTATION.test(line)) {
      const carets = CARETS.exec(line);
      if (carets) {
        // A connector's caret only marks where a multi-line span ends.
        if (!carets[1]) {
          located.endColumn = located.column + (carets[2]?.length ?? 1);
        }
        spanDone = true;
      }
    }
  }
  return diagnostics;
};

export type OutputPart =
  | { text: string }
  | { text: string; line: number; column: number };

// Not preceded by a path: `../dep/src/lib.rs` is another package's file.
const SCRIPT_LOCATION = /(?<![\w./-])src\/lib\.rs:(\d+):(\d+)/g;

// Splits compiler output around the locations in the script's file, so they
// can be rendered as links to the editor.
export const splitLocations = (text: string): OutputPart[] => {
  const parts: OutputPart[] = [];
  let index = 0;
  for (const match of text.matchAll(SCRIPT_LOCATION)) {
    if (match.index > index) {
      parts.push({ text: text.slice(index, match.index) });
    }
    parts.push({
      text: match[0],
      line: Number(match[1]),
      column: Number(match[2]),
    });
    index = match.index + match[0].length;
  }
  if (index < text.length) {
    parts.push({ text: text.slice(index) });
  }
  return parts;
};
