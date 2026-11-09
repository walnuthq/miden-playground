// The code edits that tutorials ask for, applied by their "add to my script"
// buttons: on a phone, where the editor is read-only, they're the way to
// complete those steps, and on desktop an alternative to typing. Each edit
// finds its place with an anchor that tolerates whitespace, and reports
// whether the source already has it, typed or added.

export type CodeEdit = {
  applied: (source: string) => boolean;
  // The source with the edit, or null when its anchor isn't there.
  apply: (source: string) => string | null;
};

// Inserts `lines` after the (first) line matching `anchor`, indented like it.
// Lines keep their own indentation on top of it; empty ones stay empty.
const insertAfterLine = (
  source: string,
  anchor: RegExp,
  lines: string[],
): string | null => {
  const match = anchor.exec(source);
  if (!match) {
    return null;
  }
  const lineStart = source.lastIndexOf("\n", match.index) + 1;
  const lineEnd = source.indexOf("\n", match.index + match[0].length);
  const end = lineEnd === -1 ? source.length : lineEnd;
  const indent = /^[ \t]*/.exec(source.slice(lineStart))?.[0] ?? "";
  const inserted = lines
    .map((line) => (line === "" ? "" : `${indent}${line}`))
    .join("\n");
  return `${source.slice(0, end)}\n${inserted}${source.slice(end)}`;
};

// Applies `edits[0..upTo]` that the source doesn't have yet, in order: a
// button for a later edit adds the earlier ones it builds on. Null when one
// of them can't find its place.
export const applyCodeEdits = (
  source: string,
  edits: CodeEdit[],
  upTo = edits.length - 1,
): string | null => {
  let next = source;
  for (const edit of edits.slice(0, upTo + 1)) {
    if (edit.applied(next)) {
      continue;
    }
    const applied = edit.apply(next);
    if (applied === null) {
      return null;
    }
    next = applied;
  }
  return next;
};

// Tutorial 7: the counter's increment value, the last `felt!(n)` of the
// script (the key's `felt!(1)` comes before it).
export const incrementValue = (source: string) =>
  Number(Array.from(source.matchAll(/felt!\((\d*)\)/g)).at(-1)?.[1]);

export const INCREMENT = 5;

export const increaseIncrementEdits: CodeEdit[] = [
  {
    applied: (source) => incrementValue(source) > 1,
    apply: (source) => {
      const anchor = /(current_value\s*\+\s*felt!\()1(\))/;
      return anchor.test(source)
        ? source.replace(anchor, `$1${INCREMENT}$2`)
        : null;
    },
  },
];

// Tutorial 8: the timelock in the P2ID note script, each edit after the ones
// it needs to compile: the imports (0) and the note's new input (1), the
// constructor's parameter (2) and struct literal (3), the block number (4)
// and its check (5) in the script. The regexes of `applied` are the step's
// own completion check.

// The names imported by the script's `use miden::{…};`.
const MIDEN_IMPORTS = /use\s+miden::\{([^}]*)\}\s*;/;

const midenImports = (source: string) =>
  (MIDEN_IMPORTS.exec(source)?.[1] ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name !== "");

// Adds `name` after `after`, where the template's order puts it.
const withImport = (names: string[], name: string, after: string) => {
  if (names.includes(name)) {
    return names;
  }
  const index = names.indexOf(after);
  return index === -1 ? [...names, name] : names.toSpliced(index + 1, 0, name);
};

export const timelockEdits: CodeEdit[] = [
  {
    applied: (source) => {
      const names = midenImports(source);
      return (
        (names.includes("tx") && names.includes("Felt")) ||
        /use\s+miden::\*\s*;/.test(source)
      );
    },
    apply: (source) => {
      if (!MIDEN_IMPORTS.test(source)) {
        return null;
      }
      const names = withImport(
        withImport(midenImports(source), "tx", "note"),
        "Felt",
        "AccountId",
      );
      return source.replace(MIDEN_IMPORTS, `use miden::{${names.join(", ")}};`);
    },
  },
  {
    // After the target account: the note's inputs follow the fields' order,
    // which the next step's storage items rely on.
    applied: (source) =>
      /struct\s+P2idNote\s*\{[^}]*\btarget_account_id\s*:\s*AccountId\b[^}]*\btimelock_height\s*:\s*Felt\b/.test(
        source,
      ),
    apply: (source) =>
      insertAfterLine(source, /target_account_id\s*:\s*AccountId\s*,/, [
        "timelock_height: Felt,",
      ]),
  },
  {
    applied: (source) =>
      /fn\s+build_recipient\s*\([^)]*\btimelock_height\s*:\s*Felt\b/.test(
        source,
      ),
    // One parameter per line, as rustfmt lays out a signature that no longer
    // fits on one.
    apply: (source) => {
      const match = /^([ \t]*)(.*\bfn\s+build_recipient\s*)\(([^)]*)\)/m.exec(
        source,
      );
      if (!match) {
        return null;
      }
      const [signature, indent = "", head = "", parameters = ""] = match;
      const lines = [...parameters.split(","), "timelock_height: Felt"]
        .map((parameter) => parameter.trim())
        .filter((parameter) => parameter !== "")
        .map((parameter) => `${indent}    ${parameter},`);
      return source.replace(
        signature,
        `${indent}${head}(\n${lines.join("\n")}\n${indent})`,
      );
    },
  },
  {
    // The struct literal, not the struct's or the impl's own block.
    applied: (source) =>
      /(?<!\b(?:struct|impl)\s+)\bP2idNote\s*\{[^}]*\btimelock_height\b/.test(
        source,
      ),
    apply: (source) =>
      insertAfterLine(source, /target_account_id\s*:\s*target\s*,/, [
        "timelock_height,",
      ]),
  },
  {
    applied: (source) =>
      /let\s+block_number\s*=\s*tx::get_reference_block_number\(\)\s*;/.test(
        source,
      ),
    apply: (source) =>
      insertAfterLine(source, /fn\s+script\s*\([^)]*\)\s*\{/, [
        "    let block_number = tx::get_reference_block_number();",
      ]),
  },
  {
    applied: (source) =>
      /assert!\s*\(\s*block_number\.as_felt\(\)\s*>=\s*self\.timelock_height\s*\)\s*;/.test(
        source,
      ),
    // A blank line after it sets the timelock apart from the target check.
    apply: (source) =>
      insertAfterLine(
        source,
        /let\s+block_number\s*=\s*tx::get_reference_block_number\(\)\s*;/,
        ["assert!(block_number.as_felt() >= self.timelock_height);", ""],
      ),
  },
];

// The index after a block's closing brace, from the index of its opening one.
const closingBrace = (source: string, open: number) => {
  let depth = 0;
  for (let index = open; index < source.length; index++) {
    if (source[index] === "{") {
      depth++;
    } else if (source[index] === "}") {
      depth--;
      if (depth === 0) {
        return index + 1;
      }
    }
  }
  return -1;
};

// Tutorial 12: a `reset_count` procedure, declared in the component's trait
// and implemented after `increment_count`.
export const resetCountEdits: CodeEdit[] = [
  {
    applied: (source) =>
      /fn\s+reset_count\s*\(\s*&mut\s+self\s*\)\s*;/.test(source),
    apply: (source) =>
      insertAfterLine(
        source,
        /fn\s+increment_count\s*\(\s*&mut\s+self\s*\)\s*->\s*Felt\s*;/,
        ["#[account_procedure]", "fn reset_count(&mut self);"],
      ),
  },
  {
    applied: (source) =>
      /fn\s+reset_count\s*\(\s*&mut\s+self\s*\)\s*\{/.test(source),
    apply: (source) => {
      const match =
        /fn\s+increment_count\s*\(\s*&mut\s+self\s*\)\s*->\s*Felt\s*\{/.exec(
          source,
        );
      if (!match) {
        return null;
      }
      const end = closingBrace(source, match.index + match[0].length - 1);
      if (end === -1) {
        return null;
      }
      const lineStart = source.lastIndexOf("\n", match.index) + 1;
      const indent = /^[ \t]*/.exec(source.slice(lineStart))?.[0] ?? "";
      const method = [
        "",
        "/// Resets the counter value to zero",
        "fn reset_count(&mut self) {",
        "    let key = Word::new([felt!(1), felt!(0), felt!(0), felt!(0)]);",
        "    self.count_map.set(key, felt!(0));",
        "}",
      ]
        .map((line) => (line === "" ? "" : `${indent}${line}`))
        .join("\n");
      return `${source.slice(0, end)}\n${method}${source.slice(end)}`;
    },
  },
];
