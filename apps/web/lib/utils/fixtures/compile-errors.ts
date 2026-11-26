// Real answers of the local api-compile, through the API's `PATCH
// /scripts/:id`: the counter-account template broken a different way each, and
// counter-script compiled without its dependency. Trimmed to what the
// diagnostics read. Re-capture them when miden-assembly or api-compile change
// the diagnostics or their rendering (docs/claude/script-editor.md).
import { readFileSync } from "node:fs";
import type { Diagnostic, ScriptStatus } from "../../types/script.ts";

export type CompileErrorFixture = {
  name: string;
  source: string;
  status: ScriptStatus;
  diagnostics: Diagnostic[];
  stderr: string;
};

export const FIXTURES = [
  "bad-instruction",
  "missing-dependency",
  "no-position",
  "syntax",
  "undefined-procedure",
  "warning",
] as const;

export const fixture = (name: (typeof FIXTURES)[number]): CompileErrorFixture =>
  JSON.parse(
    readFileSync(
      new URL(`./compile-errors/${name}.json`, import.meta.url),
      "utf-8",
    ),
  );
