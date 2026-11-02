// Regenerates examples/<dir>/compiled.json, the initial compile output of each
// example, which the API inserts as-is when an example is launched.
//
// It compiles through a running API (`pnpm dev`, which reaches whatever
// API_COMPILE_URL it's configured with), so the packages are built from
// exactly the files the API generates for them. Run it after editing an
// example's sources, and after bumping the Miden SDK, the api-compile image or
// templates/project-template.
//
//   node scripts/compile-examples.ts [example-dir...]
//
// API_URL defaults to the local API (http://localhost:3001).
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { type ExampleSources, sourcesHash } from "../examples/hash.ts";

type CompiledPackage = {
  name: string;
  type: string;
  status: "draft" | "compiled" | "error";
  error: string;
  masp: string;
  commitment: string;
  exports: unknown[];
  dependencies: { name: string; commitment: string }[];
};

const API_URL = process.env.API_URL ?? "http://localhost:3001";
const examplesDir = path.join(import.meta.dirname, "..", "examples");

const subdirectories = (dir: string) =>
  readdirSync(dir, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory(),
  );

const readSources = (exampleDir: string): ExampleSources =>
  Object.fromEntries(
    subdirectories(exampleDir)
      .filter(({ name }) =>
        existsSync(path.join(exampleDir, name, "miden-project.toml")),
      )
      .map(({ name }) => [
        name,
        {
          midenProjectToml: readFileSync(
            path.join(exampleDir, name, "miden-project.toml"),
            "utf8",
          ),
          rust: readFileSync(path.join(exampleDir, name, "src/lib.rs"), "utf8"),
        },
      ]),
  );

const compileExample = async (dir: string) => {
  const exampleDir = path.join(examplesDir, dir);
  const sources = readSources(exampleDir);
  console.info(`${dir}: compiling ${Object.keys(sources).join(", ")}`);
  const response = await fetch(`${API_URL}/scripts/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageSources: sources }),
  });
  if (!response.ok) {
    throw new Error(`${dir}: ${response.status} ${await response.text()}`);
  }
  const { packages } = (await response.json()) as {
    packages: CompiledPackage[];
  };
  const failedPackage = packages.find(({ status }) => status !== "compiled");
  if (failedPackage) {
    throw new Error(`${dir}/${failedPackage.name}: ${failedPackage.error}`);
  }
  const compiled = {
    sourcesHash: await sourcesHash(sources),
    packages: Object.fromEntries(
      packages.map(
        ({ name, type, masp, commitment, exports, dependencies }) => [
          name,
          {
            type,
            masp,
            commitment,
            exports,
            dependencies: dependencies.map(({ name, commitment }) => ({
              name,
              commitment,
            })),
          },
        ],
      ),
    ),
  };
  return { exampleDir, compiled };
};

const dirs = process.argv.slice(2);
const results = [];
for (const dir of dirs.length > 0
  ? dirs
  : subdirectories(examplesDir).map(({ name }) => name)) {
  results.push(await compileExample(dir));
}
// Write once everything compiled: `wrangler dev` reloads the Worker when a
// compiled.json it bundles changes, which would abort a compile in flight.
for (const { exampleDir, compiled } of results) {
  const compiledPath = path.join(exampleDir, "compiled.json");
  writeFileSync(compiledPath, `${JSON.stringify(compiled, null, 2)}\n`);
  console.info(`wrote ${path.relative(process.cwd(), compiledPath)}`);
}
