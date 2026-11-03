// Extracts the Miden Assembly vocabulary from the assembler's own sources in
// 0xMiden/miden-vm, for the MASM tab's highlighting (`language.ts`). Run by
// `scripts/sync-masm-vocabulary.ts`, which writes `vocabulary.json`.
//
// The assembler is the source of truth: the VS Code extension's TextMate
// grammar has no instructions (VS Code colors MASM with miden-lsp's semantic
// tokens), and tree-sitter-masm, which miden-lsp is moving away from (for
// `miden-assembly-syntax-cst`), lags behind the assembly syntax.

export const MIDEN_VM_REPO = "0xMiden/miden-vm";

// Paths in miden-vm of the files the vocabulary comes from.
export const MIDEN_VM_SOURCES = {
  // The instruction tables: `spelling: "…"`, `prefix: &["…"]` (instructions
  // with an immediate, e.g. `dup.3`) and `keyword: "…"` (`push`, `exec`, …).
  instructions: "crates/assembly-syntax/src/parser/cst/instructions.rs",
  // The CST parser's `at_keyword("…")` / `expect_keyword("…")` calls: forms
  // and blocks (`proc`, `begin`, `if`, `end`, …).
  parser: "crates/assembly-syntax-cst/src/parser.rs",
  // Type keywords (`ptr`, `struct`, …) and builtin types (`builtin_type_for_name`).
  fragments: "crates/assembly-syntax/src/parser/cst/fragments.rs",
} as const;

export type MasmVocabulary = {
  keywords: string[];
  types: string[];
  instructions: string[];
};

// The test module's strings (sample programs) aren't vocabulary.
const withoutTests = (source: string) =>
  source.split(/^#\[cfg\(test\)\]/m)[0] ?? "";

const sorted = (words: Iterable<string>) => [...new Set(words)].sort();

const captures = (source: string, pattern: RegExp) =>
  [...source.matchAll(pattern)].flatMap((match) =>
    match.slice(1).filter((capture) => capture !== undefined),
  );

export const extractInstructions = (instructions: string) => {
  const source = withoutTests(instructions);
  return sorted([
    ...captures(source, /\bspelling: "([\w.]+)"/g),
    ...captures(source, /\bkeyword: "(\w+)"/g),
    // `&["adv", "push_mapvaln"]` is `adv.push_mapvaln`.
    ...captures(source, /\bprefix: &\[("[^\]]+)\]/g).map((prefix) =>
      captures(prefix, /"(\w+)"/g).join("."),
    ),
  ]);
};

export const extractKeywords = (...sources: string[]) =>
  sorted(
    sources.flatMap((source) =>
      captures(
        withoutTests(source),
        /\b(?:at_keyword|expect_keyword|peek_contextual_keyword_after_non_comment_trivia)\("(\w+)"|\bat_prefixed_keyword\("(\w+)",\s*"(\w+)"\)/g,
      ),
    ),
  );

export const extractTypes = (fragments: string) => {
  const body = withoutTests(fragments).match(
    /fn builtin_type_for_name\b[\s\S]*?\n\}/,
  )?.[0];
  return sorted(captures(body ?? "", /"(\w+)" =>/g));
};

export const extractVocabulary = (
  sources: {
    [key in keyof typeof MIDEN_VM_SOURCES]: string;
  },
): MasmVocabulary => {
  const types = extractTypes(sources.fragments);
  const instructions = extractInstructions(sources.instructions);
  const keywords = extractKeywords(sources.parser, sources.fragments).filter(
    // `word` is also a type, `adv_map` stays a keyword.
    (keyword) => !types.includes(keyword) && !instructions.includes(keyword),
  );
  return { keywords, types, instructions };
};

// Fails on an upstream refactor that the patterns above no longer match,
// rather than shipping a vocabulary with holes.
export const checkVocabulary = ({
  keywords,
  types,
  instructions,
}: MasmVocabulary) => {
  const missing = [
    ...["begin", "end", "proc", "pub", "use", "if", "while", "repeat"].filter(
      (keyword) => !keywords.includes(keyword),
    ),
    ...["felt", "u32", "word"].filter((type) => !types.includes(type)),
    ...["push", "exec", "call", "add", "dup", "swap", "mem_load"].filter(
      (instruction) => !instructions.includes(instruction),
    ),
  ];
  if (missing.length > 0 || instructions.length < 100) {
    throw new Error(
      `The MASM vocabulary looks incomplete (${instructions.length} instructions; missing ${missing.join(", ") || "nothing"}): did the miden-vm sources change shape?`,
    );
  }
};
