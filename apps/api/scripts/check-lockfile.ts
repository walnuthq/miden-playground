// Checks that templates/project-template/Cargo.lock pins the registry crates
// api-compile warmed its cache with (its `GET /lockfile`). Every package the
// API creates starts from this lockfile, and api-compile builds `--offline`
// against that cache: a lockfile pinning other versions makes each build
// download and rebuild the crates that differ (minutes, on a container that
// loses them when it sleeps). The API sends `warmLockfile: true`, so such a
// build still re-resolves offline, but a template in step skips that step.
//
// Run it after api-compile's examples' lockfiles change (a `cargo update`
// there), and after bumping the SDK or the api-compile image.
//
//   node scripts/check-lockfile.ts           # exits with 1 on drift
//   node scripts/check-lockfile.ts --write   # rewrites the template's lockfile
//
// API_COMPILE_URL defaults to the local api-compile (http://localhost:8080).
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const API_COMPILE_URL = process.env.API_COMPILE_URL ?? "http://localhost:8080";
const TEMPLATE_LOCK = join(
  import.meta.dirname,
  "../templates/project-template/Cargo.lock",
);

type LockPackage = { name: string; version: string; source?: string };

const lockPackages = (cargoLock: string): LockPackage[] =>
  cargoLock
    .split("[[package]]")
    .slice(1)
    .map((block) => {
      const field = (key: string) =>
        block.match(new RegExp(`^${key} = "([^"]+)"`, "m"))?.[1];
      return {
        name: field("name") ?? "",
        version: field("version") ?? "",
        source: field("source"),
      };
    });

// `name@version` of the crates.io crates: what the cache holds. The project's
// own package (no source) differs by name only.
const registryCrates = (cargoLock: string) =>
  new Set(
    lockPackages(cargoLock)
      .filter(({ source }) => source?.startsWith("registry+"))
      .map(({ name, version }) => `${name}@${version}`),
  );

const response = await fetch(`${API_COMPILE_URL}/lockfile`);
if (!response.ok) {
  console.error(
    `GET ${API_COMPILE_URL}/lockfile answered ${response.status}: is api-compile running, and recent enough to serve it?`,
  );
  process.exit(1);
}
const warmLock = await response.text();
const templateLock = await readFile(TEMPLATE_LOCK, "utf-8");

const warm = registryCrates(warmLock);
const template = registryCrates(templateLock);
const missing = [...template].filter((crate) => !warm.has(crate)).sort();
const extra = [...warm].filter((crate) => !template.has(crate)).sort();

if (missing.length === 0 && extra.length === 0) {
  console.log(
    `The template's lockfile pins api-compile's ${warm.size} crates.`,
  );
  process.exit(0);
}

if (process.argv.includes("--write")) {
  // The warm lockfile, with its project package renamed to the template's.
  const [warmRoot] = lockPackages(warmLock).filter(({ source }) => !source);
  const [templateRoot] = lockPackages(templateLock).filter(
    ({ source }) => !source,
  );
  if (!warmRoot || !templateRoot) {
    console.error("Can't find the project package in one of the lockfiles.");
    process.exit(1);
  }
  await writeFile(
    TEMPLATE_LOCK,
    warmLock.replace(
      `name = "${warmRoot.name}"\nversion = "${warmRoot.version}"`,
      `name = "${templateRoot.name}"\nversion = "${templateRoot.version}"`,
    ),
  );
  console.log(
    `Rewrote templates/project-template/Cargo.lock: ${missing.length} crates replaced, ${extra.length} added.`,
  );
  process.exit(0);
}

console.error(
  "templates/project-template/Cargo.lock doesn't match api-compile's warm lockfile:",
);
for (const crate of missing) {
  console.error(`  - ${crate} (not in the cache)`);
}
for (const crate of extra) {
  console.error(`  + ${crate}`);
}
console.error("Run `pnpm lockfile:sync` in apps/api to update it.");
process.exit(1);
