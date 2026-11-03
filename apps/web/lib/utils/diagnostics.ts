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

// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escapes.
export const ANSI_ESCAPE = /\u001b\[[0-9;]*m/g;
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

// The severity of a diagnostic's header line (`error[E0425]: …`,
// `warning: …`), to color it in the console. Undefined for any other line.
export const outputLineSeverity = (
  line: string,
): DiagnosticSeverity | undefined =>
  HEADER.exec(line.replace(ANSI_ESCAPE, ""))?.[1] as
    | DiagnosticSeverity
    | undefined;

// How many errors and warnings an output reports, from its located
// diagnostics (summaries such as `could not compile …` aren't counted).
export const countDiagnostics = (output: string) => {
  const diagnostics = parseDiagnostics(output);
  return {
    errors: diagnostics.filter(({ severity }) => severity === "error").length,
    warnings: diagnostics.filter(({ severity }) => severity === "warning")
      .length,
  };
};

export type OutputPart =
  | { text: string }
  | { text: string; line: number; column: number }
  | { text: string; href: string };

// A location in the script's file, not preceded by a path (`../dep/src/lib.rs`
// is another package's file), or a web link (e.g. an error code's docs).
const LINK =
  /(?<![\w./-])src\/lib\.rs:(\d+):(\d+)|https:\/\/[^\s`'"<>]+[^\s`'"<>.,;:)]/g;

// Splits compiler output around the locations in the script's file and web
// links, so they can be rendered as links to the editor or the web.
export const splitLocations = (text: string): OutputPart[] => {
  const parts: OutputPart[] = [];
  let index = 0;
  for (const match of text.matchAll(LINK)) {
    if (match.index > index) {
      parts.push({ text: text.slice(index, match.index) });
    }
    parts.push(
      match[1]
        ? { text: match[0], line: Number(match[1]), column: Number(match[2]) }
        : { text: match[0], href: match[0] },
    );
    index = match.index + match[0].length;
  }
  if (index < text.length) {
    parts.push({ text: text.slice(index) });
  }
  return parts;
};
