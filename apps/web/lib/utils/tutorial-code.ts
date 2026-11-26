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

// Tutorial 7: the counter's increment value, the constant `add.<n>` adds to
// the count in `increment_count` (apps/api/templates/counter-account.masm),
// in decimal or hex. The edit leaves the slot names alone, so the script
// keeps its storage schema (decision 3 of spec/remove-rust.md). NaN when the
// procedure or its `add.<n>` isn't there.
const INCREMENT_COUNT = /\bproc\s+increment_count\b[\s\S]*?\n\s*end\b/;
const ADD_CONSTANT = /^(\s*add\.)(0x[0-9a-fA-F]+|\d+)\b/m;

export const incrementValue = (source: string) => {
  const body = INCREMENT_COUNT.exec(source)?.[0] ?? "";
  return Number(ADD_CONSTANT.exec(body)?.[2]);
};

export const INCREMENT = 5;

export const increaseIncrementEdits: CodeEdit[] = [
  {
    applied: (source) => incrementValue(source) > 1,
    apply: (source) => {
      const match = INCREMENT_COUNT.exec(source);
      if (!match || !ADD_CONSTANT.test(match[0])) {
        return null;
      }
      const body = match[0].replace(ADD_CONSTANT, `$1${INCREMENT}`);
      return `${source.slice(0, match.index)}${body}${source.slice(match.index + match[0].length)}`;
    },
  },
];

// Tutorial 8: the timelock in the P2ID note script
// (apps/api/templates/p2id-note.masm), each edit after the ones it needs to
// compile: the `tx` module (0), a third storage item (1) and its pointer (2),
// the error the check fails with (3), then in `main` the two values the check
// compares (4) and the check (5). The regexes of `applied` are the step's own
// completion check.

const NUM_STORAGE_ITEMS = /^([ \t]*const\s+NUM_STORAGE_ITEMS\s*=\s*)(\d+)\b/m;
const WRONG_NUMBER_MESSAGE = /(expects exactly )(\d+)( note storage items)/;

export const timelockEdits: CodeEdit[] = [
  {
    applied: (source) => /^\s*use\s+miden::protocol::tx\s*$/m.test(source),
    apply: (source) =>
      insertAfterLine(
        source,
        /^[ \t]*use\s+miden::protocol::active_note\b.*$/m,
        ["use miden::protocol::tx"],
      ),
  },
  {
    // The count the script checks, and the message it fails with.
    applied: (source) => NUM_STORAGE_ITEMS.exec(source)?.[2] === "3",
    apply: (source) =>
      NUM_STORAGE_ITEMS.test(source)
        ? source
            .replace(NUM_STORAGE_ITEMS, "$13")
            .replace(WRONG_NUMBER_MESSAGE, "$13$3")
        : null,
  },
  {
    // After the target account: the height is the third item, after the
    // prefix and the suffix, which the next step's storage items rely on.
    applied: (source) =>
      /\bconst\s+TIMELOCK_HEIGHT_PTR\s*=\s*STORAGE_PTR\s*\+\s*2\b/.test(source),
    apply: (source) =>
      insertAfterLine(
        source,
        /^[ \t]*const\s+TARGET_ACCOUNT_ID_SUFFIX_PTR\s*=.*$/m,
        ["const TIMELOCK_HEIGHT_PTR = STORAGE_PTR + 2"],
      ),
  },
  {
    applied: (source) => /\bconst\s+ERR_P2ID_TIMELOCKED\s*=/.test(source),
    apply: (source) =>
      insertAfterLine(source, /^[ \t]*const\s+ERR_P2ID_WRONG_TARGET\s*=.*$/m, [
        "",
        'const ERR_P2ID_TIMELOCKED = "P2ID note is timelocked until its timelock height"',
      ]),
  },
  {
    applied: (source) =>
      /\bmem_load\.TIMELOCK_HEIGHT_PTR\s+exec\.tx::get_reference_block_number\b/.test(
        source,
      ),
    // After the storage count's check, and the stack comment under it.
    apply: (source) =>
      insertAfterLine(
        source,
        /^[ \t]*eq\.NUM_STORAGE_ITEMS\s+assert\b.*\n[ \t]*# => \[\]/m,
        [
          "",
          "# the timelock height, then the transaction's reference block",
          "mem_load.TIMELOCK_HEIGHT_PTR exec.tx::get_reference_block_number",
          "# => [block_number, timelock_height]",
        ],
      ),
  },
  {
    applied: (source) =>
      /\blte\s+assert\.err=ERR_P2ID_TIMELOCKED\b/.test(source),
    apply: (source) =>
      insertAfterLine(
        source,
        /^[ \t]*# => \[block_number, timelock_height\]/m,
        ["", "lte assert.err=ERR_P2ID_TIMELOCKED", "# => []"],
      ),
  },
];

// Tutorial 12: a `reset_count` procedure after `increment_count`
// (apps/api/templates/counter-account.masm), which writes a zero Word under
// the count's key. Its first line pushes a number unique to the run and drops
// it: that changes nothing the procedure does, but changes its code, hence its
// MAST root and the account code's, so each run deploys code nobody verified
// before (the registry verifies by code; the script's name doesn't reach the
// code in MASM). The slot names stay, and so does the template's schema.

const RESET_COUNT =
  /^[ \t]*(?:@account_procedure\s*\n[ \t]*)?(?:pub\s+)?proc\s+reset_count\b[\s\S]*?\n\s*end\b/m;

// The run id (lowercase letters, randomLowercaseId) read in base 26: a number
// well below a felt's modulus that the step can show and the code can push.
export const runTag = (runId: string) =>
  [...runId].reduce((tag, letter) => tag * 26 + (letter.charCodeAt(0) - 97), 0);

export const resetCountProcedure = (tag: number) => [
  "#! Resets the count to zero.",
  "#!",
  "#! Inputs:  [pad(16)]",
  "#! Outputs: [pad(16)]",
  "@account_procedure",
  "pub proc reset_count()",
  "    # a number unique to your run of this tutorial: it does nothing,",
  "    # but it makes this procedure's code, and its MAST root, yours",
  `    push.${tag} drop`,
  "",
  "    # the new value, a Word of four zeros, then the key and the slot id",
  "    padw push.COUNT_KEY push.COUNT_MAP_SLOT[0..2]",
  "    # => [slot_id_suffix, slot_id_prefix, COUNT_KEY, 0, 0, 0, 0, pad(16)]",
  "",
  "    exec.native_account::set_map_item",
  "    # => [OLD_VALUE, pad(16)]",
  "",
  "    dropw",
  "    # => [pad(16)]",
  "",
  "    exec.sys::truncate_stack",
  "    # => [pad(16)]",
  "end",
];

export const resetCountEdits = (tag: number): CodeEdit[] => [
  {
    applied: (source) =>
      new RegExp(`^\\s*push\\.${tag}\\s+drop\\b`, "m").test(
        RESET_COUNT.exec(source)?.[0] ?? "",
      ),
    apply: (source) => {
      const procedure = resetCountProcedure(tag).join("\n");
      // One the user typed without this run's number: replaced, a second
      // `reset_count` wouldn't assemble.
      const typed = RESET_COUNT.exec(source);
      if (typed) {
        return `${source.slice(0, typed.index)}${procedure}${source.slice(typed.index + typed[0].length)}`;
      }
      const match = INCREMENT_COUNT.exec(source);
      if (!match) {
        return null;
      }
      const end = match.index + match[0].length;
      return `${source.slice(0, end)}\n\n${procedure}${source.slice(end)}`;
    },
  },
];
