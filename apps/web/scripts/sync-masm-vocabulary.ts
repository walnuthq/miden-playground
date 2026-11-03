// Regenerates lib/masm/vocabulary.json (the MASM tab's keywords, types and
// instructions) from the Miden assembler's sources, at the miden-vm tag of the
// `miden-assembly-syntax` the compiler builds with (the API's project
// template lockfile; the web SDK, which assembles the built-in scripts, uses
// the same one). Run it after bumping the SDK or the compiler.
//
//   node scripts/sync-masm-vocabulary.ts                 # rewrites the file
//   node scripts/sync-masm-vocabulary.ts --check         # exits with 1 on drift
//   node scripts/sync-masm-vocabulary.ts --ref v0.36.0   # another miden-vm ref
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
  checkVocabulary,
  extractVocabulary,
  MIDEN_VM_REPO,
  MIDEN_VM_SOURCES,
} from "../lib/masm/vocabulary.ts";

const TEMPLATE_LOCK = join(
  import.meta.dirname,
  "../../api/templates/project-template/Cargo.lock",
);
const VOCABULARY = join(import.meta.dirname, "../lib/masm/vocabulary.json");

const { values } = parseArgs({
  options: { check: { type: "boolean" }, ref: { type: "string" } },
});

const assemblyVersion = async () => {
  const version = (await readFile(TEMPLATE_LOCK, "utf-8")).match(
    /^name = "miden-assembly-syntax"\nversion = "([^"]+)"/m,
  )?.[1];
  if (!version) {
    throw new Error(`No miden-assembly-syntax in ${TEMPLATE_LOCK}`);
  }
  return version;
};

const ref = values.ref ?? `v${await assemblyVersion()}`;

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
