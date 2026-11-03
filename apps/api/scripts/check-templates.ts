// Checks that every script the web app's "Create script" dialog can create
// compiles: each type with no example, and each example. Examples that call
// another script compile once the user adds it as a dependency (tutorial 11
// teaches it for the counter note): the check does the same.
//
// It goes through a running API (`pnpm dev`, which reaches whatever
// API_COMPILE_URL it's configured with), exactly like the dialog then the
// Compile button: POST /scripts, PATCH /scripts/:id with the script's code and
// dependencies, then DELETE /scripts/:id. Run it after editing a template, and
// after bumping the Miden SDK, the api-compile image or
// templates/project-template.
//
//   node scripts/check-templates.ts
//
// API_URL defaults to the local API (http://localhost:3001). Exits with 1 when
// a template doesn't compile, printing the compiler's diagnostics.
import {
  type ScriptExample,
  type ScriptType,
  scriptExamples,
  scriptTypes,
} from "../../web/lib/types/script.ts";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

// The types the dialog offers (see components/scripts/create-script-dialog.tsx
// in the web app).
const HIDDEN_TYPES = ["kernel", "library", "authentication-component"];

const scripts: { type: ScriptType; example: ScriptExample | "none" }[] = [
  ...(Object.keys(scriptTypes) as ScriptType[])
    .filter((type) => !HIDDEN_TYPES.includes(type))
    .map((type) => ({ type, example: "none" as const })),
  ...Object.entries(scriptExamples).map(([example, { type }]) => ({
    type,
    example: example as ScriptExample,
  })),
];

// The examples that need one of the user's scripts as a dependency, and the
// example that script is created from.
const userDependencies: Partial<Record<ScriptExample, ScriptExample>> = {
  "counter-note": "counter-account",
  "counter-script": "counter-account",
};

type CreatedPackage = {
  id: string;
  files: { "src/lib.rs": string };
  dependencies: { id: string }[];
};

type CompiledPackage = {
  status: "draft" | "compiled" | "error";
  error: string;
};

const request = async <T>(path: string, init: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(
      `${init.method} ${path}: ${response.status} ${await response.text()}`,
    );
  }
  return response.json() as Promise<T>;
};

// The diagnostics of a failed compile, without cargo's progress lines.
const diagnostics = (error: string) =>
  error
    .split("\n")
    .filter((line) => /^(error|warning)\b|^\s+-->/.test(line))
    .filter((line) => !line.includes("wide-arithmetic"))
    .join("\n");

const createScript = async (
  type: ScriptType,
  example: ScriptExample | "none",
  name = `check-${example === "none" ? type : example}`,
) => {
  const { package: created } = await request<{ package: CreatedPackage }>(
    "/scripts",
    { method: "POST", body: JSON.stringify({ name, type, example }) },
  );
  return created;
};

const compileScript = async (
  { id, files }: CreatedPackage,
  dependencies: string[],
) => {
  const { package: compiled } = await request<{ package: CompiledPackage }>(
    `/scripts/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        files: { "src/lib.rs": files["src/lib.rs"] },
        dependencies,
      }),
    },
  );
  return compiled;
};

const failures: string[] = [];
for (const { type, example } of scripts) {
  const label = `${type} (example: ${example})`;
  const created: CreatedPackage[] = [];
  try {
    const dependencies: string[] = [];
    const dependencyExample =
      example === "none" ? undefined : userDependencies[example];
    if (dependencyExample) {
      // Named like the example: the code imports it by that name (tutorial 11
      // has users name it so).
      const dependency = await createScript(
        scriptExamples[dependencyExample].type,
        dependencyExample,
        dependencyExample,
      );
      created.push(dependency);
      const { status, error } = await compileScript(
        dependency,
        dependency.dependencies.map(({ id }) => id),
      );
      if (status !== "compiled") {
        throw new Error(`dependency ${dependencyExample}: ${error}`);
      }
      dependencies.push(dependency.id);
    }
    const script = await createScript(type, example);
    created.push(script);
    const { status, error } = await compileScript(script, [
      ...script.dependencies.map(({ id }) => id),
      ...dependencies,
    ]);
    if (status === "compiled") {
      console.info(`ok    ${label}`);
    } else {
      failures.push(label);
      console.error(`FAIL  ${label}\n${diagnostics(error)}\n`);
    }
  } finally {
    // The script first: a dependency can't be deleted while it's used.
    for (const { id } of created.reverse()) {
      await request(`/scripts/${id}`, { method: "DELETE" });
    }
  }
}

if (failures.length > 0) {
  console.error(
    `${failures.length}/${scripts.length} templates don't compile.`,
  );
  process.exit(1);
}
console.info(`All ${scripts.length} templates compile.`);
