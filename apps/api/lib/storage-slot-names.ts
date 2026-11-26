// The storage slot names a MASM source declares: the strings of its
// `const NAME = word("…")` constants, which is how a component names a slot
// (`push.NAME[0..2]` is then the slot's id). What the stale rule of a
// template's storage schema compares (lib/package-metadata.ts).
//
// The source is read with the assembler's lexical rules (miden-assembly-syntax-
// cst's lexer): a `#` starts a comment to the end of the line, outside a
// string; a string is `"…"` on one line, where `\` escapes the next character.
// Anything this reader can't be sure of answers null, "can't tell", and the
// schema is dropped: a `word(…)` anywhere but alone on the right of a `const`,
// a string with an escape (its value would need the assembler's unescaping),
// an unclosed string. No imports: the unit tests and plain-node scripts read
// it.

type Token =
  | { kind: "ident"; text: string }
  | { kind: "string"; text: string; escaped: boolean }
  | { kind: "punct"; text: string }
  | { kind: "other" };

const IDENT_START = /[A-Za-z_$]/;
const IDENT_PART = /[A-Za-z0-9_]/;

// The source's tokens, comments and whitespace left out. Null for a string
// that isn't closed on its line, which the assembler rejects too.
const tokenize = (masm: string): Token[] | null => {
  const tokens: Token[] = [];
  let index = 0;
  while (index < masm.length) {
    const char = masm[index] ?? "";
    if (char === "#") {
      while (
        index < masm.length &&
        masm[index] !== "\n" &&
        masm[index] !== "\r"
      ) {
        index++;
      }
    } else if (/\s/.test(char)) {
      index++;
    } else if (char === '"') {
      let text = "";
      let escaped = false;
      let closed = false;
      index++;
      while (index < masm.length) {
        const next = masm[index] ?? "";
        if (next === "\n" || next === "\r") {
          break;
        }
        index++;
        if (next === "\\") {
          escaped = true;
          text += next + (masm[index] ?? "");
          index++;
        } else if (next === '"') {
          closed = true;
          break;
        } else {
          text += next;
        }
      }
      if (!closed) {
        return null;
      }
      tokens.push({ kind: "string", text, escaped });
    } else if (IDENT_START.test(char)) {
      let text = char;
      index++;
      while (index < masm.length && IDENT_PART.test(masm[index] ?? "")) {
        text += masm[index];
        index++;
      }
      tokens.push({ kind: "ident", text });
    } else if ("()=".includes(char)) {
      tokens.push({ kind: "punct", text: char });
      index++;
    } else {
      // Numbers, paths' `::`, brackets, operators, `.`: none is part of the
      // pattern, and each one ends it.
      tokens.push({ kind: "other" });
      index++;
    }
  }
  return tokens;
};

const isIdent = (token: Token | undefined, text?: string) =>
  token?.kind === "ident" && (text === undefined || token.text === text);

const isPunct = (token: Token | undefined, text: string) =>
  token?.kind === "punct" && token.text === text;

// The names, sorted and without duplicates, or null when the source can't be
// read with certainty (see above).
export const declaredSlotNames = (masm: string): string[] | null => {
  const tokens = tokenize(masm);
  if (!tokens) {
    return null;
  }
  const names = new Set<string>();
  for (const [index, token] of tokens.entries()) {
    // `word` as a type (`proc f(root: word)`) isn't a hash.
    if (!isIdent(token, "word") || !isPunct(tokens[index + 1], "(")) {
      continue;
    }
    // const NAME = word ( "…" ): nothing can follow in the same constant,
    // since the assembler takes no arithmetic on a word.
    const name = tokens[index + 2];
    const declared =
      isIdent(tokens[index - 3], "const") &&
      isIdent(tokens[index - 2]) &&
      isPunct(tokens[index - 1], "=") &&
      name?.kind === "string" &&
      !name.escaped &&
      isPunct(tokens[index + 3], ")");
    if (!declared) {
      return null;
    }
    names.add(name.text);
  }
  return [...names].sort();
};
