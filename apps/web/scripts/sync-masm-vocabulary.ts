// Regenerates lib/masm/vocabulary.json (the editor's MASM keywords, types and
// instructions) from the Miden assembler's sources, at the miden-vm tag of
// `MIDEN_ASSEMBLY_VERSION`. Run it after bumping the SDK or api-compile's
// assembler (docs/claude/upgrading-miden.md).
//
//   node scripts/sync-masm-vocabulary.ts                 # rewrites the file
//   node scripts/sync-masm-vocabulary.ts --check         # exits with 1 on drift
//   node scripts/sync-masm-vocabulary.ts --ref v0.37.0   # another miden-vm ref
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
  checkVocabulary,
  extractVocabulary,
  MIDEN_VM_REPO,
  MIDEN_VM_SOURCES,
} from "../lib/masm/vocabulary.ts";

// The `miden-assembly` that assembles the scripts: api-compile's
// `miden-assemble` tool pins it (`crates/miden-assemble/Cargo.toml` in the
// verifier repo). Bump it with the SDK.
const MIDEN_ASSEMBLY_VERSION = "0.36.5";

const VOCABULARY = join(import.meta.dirname, "../lib/masm/vocabulary.json");

const { values } = parseArgs({
  options: { check: { type: "boolean" }, ref: { type: "string" } },
});

const ref = values.ref ?? `v${MIDEN_ASSEMBLY_VERSION}`;

const fetchSource = async (path: string) => {
  const url = `https://raw.githubusercontent.com/${MIDEN_VM_REPO}/${ref}/${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} answered ${response.status}`);
  }
  return response.text();
};

const sources = Object.fromEntries(
  await Promise.all(
    Object.entries(MIDEN_VM_SOURCES).map(
      async ([key, path]) => [key, await fetchSource(path)] as const,
    ),
  ),
) as { [key in keyof typeof MIDEN_VM_SOURCES]: string };

const vocabulary = extractVocabulary(sources);
checkVocabulary(vocabulary);

const content = `${JSON.stringify(
  {
    source: `https://github.com/${MIDEN_VM_REPO}/tree/${ref}`,
    generatedBy: "pnpm masm:sync (scripts/sync-masm-vocabulary.ts)",
    ...vocabulary,
  },
  null,
  2,
)}\n`;

if (values.check) {
  const current = await readFile(VOCABULARY, "utf-8").catch(() => "");
  if (current !== content) {
    console.error(
      `lib/masm/vocabulary.json is out of date with ${MIDEN_VM_REPO} ${ref}: run \`pnpm masm:sync\` in apps/web.`,
    );
    process.exit(1);
  }
  console.log(`lib/masm/vocabulary.json matches ${MIDEN_VM_REPO} ${ref}.`);
} else {
  await writeFile(VOCABULARY, content);
  console.log(
    `Wrote lib/masm/vocabulary.json from ${MIDEN_VM_REPO} ${ref}: ${vocabulary.keywords.length} keywords, ${vocabulary.types.length} types, ${vocabulary.instructions.length} instructions.`,
  );
}
