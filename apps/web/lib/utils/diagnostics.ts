// A compile's diagnostics, as api-compile answers them for a MASM project (the
// MASM wire format, in the verifier repo's spec/remove-rust/README.md): a list
// of `{ severity, message, file?, line?, column?, length?, label?, help? }`,
// which the editor's markers and the console's counts read, and `stderr`, the
// same diagnostics as the assembler renders them (miette's ASCII theme),
// which the console shows:
//
//     x invalid syntax: invalid instruction `addd` or malformed operands
//      ,-[counter-account/counter_account.masm:49:5]
//   48 |
//   49 |     addd.1
//      :     ^^^|^^
//      :        `-- invalid instruction `addd` or malformed operands
//      `----
//
// The assembler stops at the first failing phase, so a failed build usually
// has one error.
import type { Diagnostic, Script } from "../types/script.ts";
import { sourceFilePath } from "./script-files.ts";

export type DiagnosticSeverity = Diagnostic["severity"];

// A diagnostic placed in the script's source, for an editor marker.
export type LocatedDiagnostic = {
  severity: DiagnosticSeverity;
  // The message, its label when it says more, and its help.
  message: string;
  // 1-based, like Monaco. `endColumn` is exclusive, and undefined when the
  // span's length isn't known.
  line: number;
  column: number;
  endColumn?: number;
};

// The source's path as the build names it: api-compile builds each package in
// its own directory, named after the package.
export const diagnosticSourcePath = ({ name }: Pick<Script, "name">) =>
  `${name}/${sourceFilePath(name)}`;

export const diagnosticMessage = ({ message, label, help }: Diagnostic) =>
  [
    message,
    // `invalid syntax: invalid instruction …` is labelled `invalid
    // instruction …`.
    label && !message.includes(label) ? label : undefined,
    help && `help: ${help}`,
  ]
    .filter(Boolean)
    .join("\n");

// The diagnostics in the script's own source, where the editor marks them.
// One in another file (a dependency's) or without a position shows in the
// console only.
export const sourceDiagnostics = (
  diagnostics: Diagnostic[],
  script: Pick<Script, "name">,
): LocatedDiagnostic[] => {
  const path = diagnosticSourcePath(script);
  return diagnostics.flatMap((diagnostic) => {
    const { severity, file, line, column, length } = diagnostic;
    if (file !== path || !line || !column) {
      return [];
    }
    return [
      {
        severity,
        message: diagnosticMessage(diagnostic),
        line,
        column,
        ...(length && { endColumn: column + length }),
      },
    ];
  });
};

// How many errors and warnings a compile reports, positioned or not.
export const countDiagnostics = (diagnostics: Diagnostic[] = []) => ({
  errors: diagnostics.filter(({ severity }) => severity === "error").length,
  warnings: diagnostics.filter(({ severity }) => severity === "warning").length,
});

// A report's header line in miette's ASCII theme: `  x …` for an error,
// `  ! …` for a warning, `  i …` for advice (a warning on the wire), with
// `Error: `, `Warning: ` or `Advice: ` before it for a related report.
const HEADER = /^(?:(?:Error|Warning|Advice): )?\s{2}([x!i]) \S/;

// The severity of a report's header line, to color it in the console.
// Undefined for any other line.
export const outputLineSeverity = (
  line: string,
): DiagnosticSeverity | undefined => {
  const mark = HEADER.exec(line)?.[1];
  return mark === undefined ? undefined : mark === "x" ? "error" : "warning";
};

export type OutputPart =
  | { text: string }
  | { text: string; line: number; column: number }
  | { text: string; href: string };

const escapeRegExp = (text: string) =>
  text.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");

const WEB_LINK = /https:\/\/[^\s`'"<>]+[^\s`'"<>.,;:)\]]/.source;

// Splits compiler output around the locations in the script's source
// (`counter-account/counter_account.masm:49:5`, not preceded by a path: a
// dependency's directory is another package's) and web links, so they can be
// rendered as links to the editor or the web.
export const splitLocations = (
  text: string,
  script: Pick<Script, "name">,
): OutputPart[] => {
  const link = new RegExp(
    `(?<![\\w./-])${escapeRegExp(diagnosticSourcePath(script))}:(\\d+):(\\d+)|${WEB_LINK}`,
    "g",
  );
  const parts: OutputPart[] = [];
  let index = 0;
  for (const match of text.matchAll(link)) {
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
