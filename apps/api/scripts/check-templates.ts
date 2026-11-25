// Checks that every script the web app's "Create script" dialog can create
// compiles: each type with no example, and each example. Examples that call
// another script compile once the user adds it as a dependency (tutorial 11
// teaches it for the counter note): the check does the same. The code the
// tutorials have users add to a template (their "Add to my script" buttons,
// lib/utils/tutorial-code.ts in the web app) is compiled too, so an SDK bump
// that breaks a snippet fails here: none for now, the tutorials' snippets
// are Rust until they're rewritten in MASM (plan 07 of spec/remove-rust).
//
// It goes through a running API (`pnpm dev`, which reaches whatever
// API_COMPILE_URL it's configured with), exactly like the dialog then the
// Compile button: POST /scripts, PATCH /scripts/:id with the script's code and
// dependencies, then DELETE /scripts/:id. Run it after editing a template, and
// after bumping the Miden SDK or the api-compile image.
//
//   node scripts/check-templates.ts
//
// API_URL defaults to the local API (http://localhost:3001). Exits with 1 when
// a template doesn't compile, printing the assembler's diagnostics.
import {
  type ScriptExample,
  type ScriptType,
  scriptExamples,
  scriptTypes,
} from "../../web/lib/types/script.ts";
import {
  applyCodeEdits,
  type CodeEdit,
} from "../../web/lib/utils/tutorial-code.ts";
import { sourceFilePath } from "../lib/source-file.ts";

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

// The tutorials' edits, applied to the template their script is created from.
const tutorialEdits: {
  label: string;
  example: ScriptExample;
  edits: CodeEdit[];
}[] = [];

type CreatedPackage = {
  id: string;
  name: string;
  files: Record<string, string>;
  dependencies: { id: string }[];
};

type CompiledPackage = {
  status: "draft" | "compiled" | "error";
  // The assembler's rendering of the build's diagnostics.
  stderr: string;
};

// This run's owner token: the API lets only a script's owner compile and
// delete it (lib/owner.ts).
const OWNER_TOKEN = crypto.randomUUID() + crypto.randomUUID();

const request = async <T>(path: string, init: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OWNER_TOKEN}`,
    },
  });
  if (!response.ok) {
    throw new Error(
      `${init.method} ${path}: ${response.status} ${await response.text()}`,
    );
  }
  return response.json() as Promise<T>;
};

const createScript = async (
  type: ScriptType,
  example: ScriptExample | "none",
  name = `check-${example === "none" ? type : example}`,
) => {
  const { package: created } = await request<{ package: CreatedPackage }>(
    "/scripts",
    { method: "POST", body: JSON.stringify({ name, type, example }) },
  );
  return { ...created, name };
};

const source = ({ name, files }: CreatedPackage) =>
  files[sourceFilePath(name)] ?? "";

const compileScript = async (
  script: CreatedPackage,
  dependencies: string[],
  code = source(script),
) => {
  const { package: compiled } = await request<{ package: CompiledPackage }>(
    `/scripts/${script.id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        files: { [sourceFilePath(script.name)]: code },
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
      const { status, stderr } = await compileScript(
        dependency,
        dependency.dependencies.map(({ id }) => id),
      );
      if (status !== "compiled") {
        throw new Error(`dependency ${dependencyExample}: ${stderr}`);
      }
      dependencies.push(dependency.id);
    }
    const script = await createScript(type, example);
    created.push(script);
    const { status, stderr } = await compileScript(script, [
      ...script.dependencies.map(({ id }) => id),
      ...dependencies,
    ]);
    if (status === "compiled") {
      console.info(`ok    ${label}`);
    } else {
      failures.push(label);
      console.error(`FAIL  ${label}\n${stderr}\n`);
    }
  } finally {
    // The script first: a dependency can't be deleted while it's used.
    for (const { id } of created.reverse()) {
      await request(`/scripts/${id}`, { method: "DELETE" });
    }
  }
}

for (const { label, example, edits } of tutorialEdits) {
  const script = await createScript(scriptExamples[example].type, example);
  try {
    const edited = applyCodeEdits(source(script), edits);
    if (edited === null) {
      failures.push(label);
      console.error(
        `FAIL  ${label}: the edits don't apply to the ${example} template\n`,
      );
      continue;
    }
    const { status, stderr } = await compileScript(
      script,
      script.dependencies.map(({ id }) => id),
      edited,
    );
    if (status === "compiled") {
      console.info(`ok    ${label}`);
    } else {
      failures.push(label);
      console.error(`FAIL  ${label}\n${stderr}\n`);
    }
  } finally {
    await request(`/scripts/${script.id}`, { method: "DELETE" });
  }
}

const total = scripts.length + tutorialEdits.length;
if (failures.length > 0) {
  console.error(`${failures.length}/${total} templates don't compile.`);
  process.exit(1);
}
console.info(`All ${total} templates compile.`);
