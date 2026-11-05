# MASM highlighting

The MASM tab's Monaco language (`apps/web/lib/masm/language.ts`, a Monarch tokenizer) takes its keywords, types and instructions from `lib/masm/vocabulary.json`, which `pnpm masm:sync` in `apps/web` extracts from the assembler's own sources in 0xMiden/miden-vm (`lib/masm/vocabulary.ts`), at the tag of the `miden-assembly-syntax` in `apps/api/templates/project-template/Cargo.lock`. `pnpm masm:check` fails when the file is out of date.

- Don't switch to the VS Code extension's TextMate grammar (no instructions: VS Code colors MASM with miden-lsp's semantic tokens) or tree-sitter-masm (behind the syntax, and miden-lsp is dropping it for `miden-assembly-syntax-cst`).
- The sync fails when the upstream tables change shape (`checkVocabulary`): update the patterns in `vocabulary.ts` and their unit tests.
- The tokenizer uses token types the built-in `vs-dark` and `light` themes color, so no custom theme changes the Rust editor. `e2e/script-masm.spec.ts` pins the token types.
