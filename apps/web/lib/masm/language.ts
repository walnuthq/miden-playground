import type { Monaco } from "@monaco-editor/react";
import vocabulary from "@/lib/masm/vocabulary.json";

export const MASM_LANGUAGE_ID = "masm";

type MonarchLanguage = Parameters<
  Monaco["languages"]["setMonarchTokensProvider"]
>[1];

// The block forms among the assembler's keywords (`vocabulary.json`), colored
// like control flow, with the instructions that transfer control.
const CONTROL = ["if", "else", "while", "do", "repeat"];
const INVOCATIONS = [
  "exec",
  "call",
  "syscall",
  "procref",
  "dyncall",
  "dynexec",
];

// Token types the built-in `vs-dark` and `light` themes color, so the Rust
// highlighting (same themes) is left as it is.
export const masmLanguage = {
  defaultToken: "",
  keywords: vocabulary.keywords.filter((word) => !CONTROL.includes(word)),
  control: [
    ...vocabulary.keywords.filter((word) => CONTROL.includes(word)),
    ...vocabulary.instructions.filter((word) => INVOCATIONS.includes(word)),
  ],
  types: vocabulary.types,
  instructions: vocabulary.instructions.filter(
    (word) => !INVOCATIONS.includes(word),
  ),
  constants: ["true", "false"],
  brackets: [
    { open: "{", close: "}", token: "delimiter.curly" },
    { open: "[", close: "]", token: "delimiter.square" },
    { open: "(", close: ")", token: "delimiter.parenthesis" },
    { open: "<", close: ">", token: "delimiter.angle" },
  ],
  tokenizer: {
    root: [
      [/\s+/, ""],
      [/#!.*$/, "comment.doc"],
      [/#.*$/, "comment"],
      // `@account_procedure`, `@locals(4)`
      [/@[a-zA-Z_]\w*/, "annotation"],
      [/\$(?:kernel|exec)\b/, "variable.predefined"],
      [/"/, "string", "@string"],
      // `pub proc get_count`, `pub proc "get-count"` (the compiler's names)
      [/(proc)(\s+)([a-zA-Z_$][\w$]*|"[^"]*")/, ["keyword", "", "variable"]],
      // `exec.active_account::get_item`: the callee's path.
      [
        /(exec|call|syscall|procref)(\.)/,
        ["keyword.flow", { token: "delimiter", next: "@callee" }],
      ],
      [
        /adv\.\w+/,
        { cases: { "@instructions": "keyword", "@default": "identifier" } },
      ],
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            "@control": "keyword.flow",
            "@keywords": "keyword",
            "@types": "type",
            "@instructions": "keyword",
            "@constants": "constant",
            // `const COUNTER_SLOT = …`, `push.COUNTER_SLOT`
            "~[A-Z][A-Z0-9_]*": "constant",
            "@default": "identifier",
          },
        },
      ],
      [/0[xX][0-9a-fA-F]+/, "number.hex"],
      [/0[bB][01]+/, "number"],
      [/\d+/, "number"],
      [/[{}()[\]<>]/, "@brackets"],
      [/::|->|\.\.\.?|[=+\-*/]/, "operator"],
      [/[.,:;!]/, "delimiter"],
    ],
    string: [
      [/[^\\"]+/, "string"],
      [/\\./, "string.escape"],
      [/"/, "string", "@pop"],
    ],
    callee: [
      [
        /(?:::)?(?:[\w$]+|"[^"]*")(?:::(?:[\w$]+|"[^"]*"))*/,
        "variable",
        "@pop",
      ],
      [/./, { token: "@rematch", next: "@pop" }],
    ],
  },
} satisfies MonarchLanguage;

// Registers the language once per Monaco instance (`beforeMount` runs for
// every editor).
export const registerMasm = (monaco: Monaco) => {
  if (
    monaco.languages
      .getLanguages()
      .some(({ id }: { id: string }) => id === MASM_LANGUAGE_ID)
  ) {
    return;
  }
  monaco.languages.register({
    id: MASM_LANGUAGE_ID,
    extensions: [".masm"],
    aliases: ["Miden Assembly", "MASM"],
  });
  monaco.languages.setLanguageConfiguration(MASM_LANGUAGE_ID, {
    comments: { lineComment: "#" },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"', notIn: ["string", "comment"] },
    ],
  });
  monaco.languages.setMonarchTokensProvider(MASM_LANGUAGE_ID, masmLanguage);
};
