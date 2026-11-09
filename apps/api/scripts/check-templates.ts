// Checks that every script the web app's "Create script" dialog can create
// compiles: each type with no example, and each example. Examples that call
// another script compile once the user adds it as a dependency (tutorial 11
// teaches it for the counter note): the check does the same. The code the
// tutorials have users add to a template (their "Add to my script" buttons,
// lib/utils/tutorial-code.ts in the web app) is compiled too, so an SDK bump
// that breaks a snippet fails here. So does a package the web app embeds
// (lib/tutorials/basic-wallet.json) once the compiler builds it differently.
//
// It goes through a running API (`pnpm dev`, which reaches whatever
// API_COMPILE_URL it's configured with), exactly like the dialog then the
// Compile button: POST /scripts, PATCH /scripts/:id with the script's code and
// dependencies, then DELETE /scripts/:id. Run it after editing a template, and
// after bumping the Miden SDK, the api-compile image or
// templates/project-template.
//
//   node scripts/check-templates.ts [--write]
//
// API_URL defaults to the local API (http://localhost:3001). Exits with 1 when
// a template doesn't compile, printing the compiler's diagnostics, or when an
// embedded package is out of date: `--write` (`pnpm templates:sync`)
// regenerates it instead.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  type ScriptExample,
  type ScriptType,
  scriptExamples,
  scriptTypes,
} from "../../web/lib/types/script.ts";
import {
  applyCodeEdits,
  type CodeEdit,
  increaseIncrementEdits,
  resetCountEdits,
  timelockEdits,
} from "../../web/lib/utils/tutorial-code.ts";

const API_URL = process.env.API_URL ?? "http://localhost:3001";
const write = process.argv.includes("--write");

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
}[] = [
  {
    label: "tutorial 7 (increase the increment)",
    example: "counter-account",
    edits: increaseIncrementEdits,
  },
  {
    label: "tutorial 8 (timelock)",
    example: "p2id-note",
    edits: timelockEdits,
  },
  {
    label: "tutorial 12 (reset_count)",
    example: "counter-account",
    edits: resetCountEdits,
  },
];

// The packages the web app embeds, each compiled from a template under the
// name the snapshot's digests are for (procedure digests depend on the package
// name). A snapshot is the template's source and what the web app builds a
// script from: the package, its commitment and its exports, not its MASM.
const embeddedPackages: {
  name: string;
  type: ScriptType;
  template: string;
  snapshot: string;
}[] = [
  {
    // The Rust basic wallet the API compiles note scripts against
    // (lib/default-dependencies.ts): tutorial 8's Test Wallet carries it, so
    // it can consume the note built from the user's P2ID script.
    name: "basic-wallet",
    type: "account-component",
    template: path.join(import.meta.dirname, "../templates/basic-wallet.rs"),
    snapshot: path.join(
      import.meta.dirname,
      "../../web/lib/tutorials/basic-wallet.json",
    ),
  },
];

type Snapshot = {
  source: string;
  commitment: string;
  masp: string;
  exports: unknown[];
};

// What tells a snapshot is up to date. Not the package's bytes: the
// commitment covers its code.
const comparable = ({ source, commitment, exports }: Snapshot) =>
  JSON.stringify({ source, commitment, exports });

type CreatedPackage = {
  id: string;
  files: { "src/lib.rs": string };
  dependencies: { id: string }[];
};

type CompiledPackage = {
  status: "draft" | "compiled" | "error";
  error: string;
  commitment: string;
  masp: string;
  exports: unknown[];
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

for (const { label, example, edits } of tutorialEdits) {
  const script = await createScript(scriptExamples[example].type, example);
  try {
    const edited = applyCodeEdits(script.files["src/lib.rs"], edits);
    if (edited === null) {
      failures.push(label);
      console.error(
        `FAIL  ${label}: the edits don't apply to the ${example} template\n`,
      );
      continue;
    }
    const { status, error } = await compileScript(
      { ...script, files: { "src/lib.rs": edited } },
      script.dependencies.map(({ id }) => id),
    );
    if (status === "compiled") {
      console.info(`ok    ${label}`);
    } else {
      failures.push(label);
      console.error(`FAIL  ${label}\n${diagnostics(error)}\n`);
    }
  } finally {
    await request(`/scripts/${script.id}`, { method: "DELETE" });
  }
}

const staleSnapshots: string[] = [];
for (const { name, type, template, snapshot } of embeddedPackages) {
  const label = `embedded package ${name}`;
  const source = readFileSync(template, "utf8");
  const script = await createScript(type, "none", name);
  try {
    const { status, error, commitment, masp, exports } = await compileScript(
      { ...script, files: { "src/lib.rs": source } },
      script.dependencies.map(({ id }) => id),
    );
    if (status !== "compiled") {
      failures.push(label);
      console.error(`FAIL  ${label}\n${diagnostics(error)}\n`);
      continue;
    }
    const compiled: Snapshot = { source, commitment, masp, exports };
    const current = JSON.parse(readFileSync(snapshot, "utf8")) as Snapshot;
    if (comparable(current) === comparable(compiled)) {
      console.info(`ok    ${label}`);
    } else if (write) {
      writeFileSync(snapshot, `${JSON.stringify(compiled, null, 2)}\n`);
      console.info(`wrote ${label} (${commitment})`);
    } else {
      staleSnapshots.push(label);
      console.error(
        `FAIL  ${label}: its snapshot is out of date, run \`pnpm templates:sync\`\n`,
      );
    }
  } finally {
    await request(`/scripts/${script.id}`, { method: "DELETE" });
  }
}

const total = scripts.length + tutorialEdits.length + embeddedPackages.length;
if (failures.length > 0) {
  console.error(`${failures.length}/${total} templates don't compile.`);
}
if (failures.length > 0 || staleSnapshots.length > 0) {
  process.exit(1);
}
console.info(`All ${total} templates compile.`);
