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

// Tutorial 8: the timelock in the P2ID note script. The regexes of `applied`
// are the step's own completion check.
export const timelockEdits: CodeEdit[] = [
  {
    applied: (source) =>
      /assert_eq\(storage\.len\(\)\.into\(\),\s*felt!\(3\)\);/.test(source),
    apply: (source) => {
      const anchor =
        /(assert_eq\(storage\.len\(\)\.into\(\),\s*felt!\()2(\)\);)/;
      return anchor.test(source)
        ? source
            .replace(anchor, "$13$2")
            .replace(
              "make sure the storage length is 2",
              "make sure the storage length is 3",
            )
        : null;
    },
  },
  {
    applied: (source) =>
      /let\s+timelock_height\s*=\s*storage\[2\];/.test(source),
    apply: (source) =>
      insertAfterLine(
        source,
        /let\s+target_account_id_prefix\s*=\s*storage\[1\];/,
        ["let timelock_height = storage[2];"],
      ),
  },
  {
    applied: (source) =>
      /let\s+block_number\s*=\s*tx::get_block_number\(\);/.test(source),
    apply: (source) =>
      insertAfterLine(source, /let\s+timelock_height\s*=\s*storage\[2\];/, [
        "let block_number = tx::get_block_number();",
      ]),
  },
  {
    applied: (source) =>
      /assert!\s*\(\s*block_number\s*>=\s*timelock_height\s*\);/.test(source),
    apply: (source) =>
      insertAfterLine(
        source,
        /let\s+block_number\s*=\s*tx::get_block_number\(\);/,
        ["assert!(block_number >= timelock_height);"],
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
