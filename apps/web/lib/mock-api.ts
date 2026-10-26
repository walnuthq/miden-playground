import authNoAuth from "@/lib/types/default-scripts/auth-no-auth";
import countReader from "@/lib/types/default-scripts/count-reader";
import counterMapContract from "@/lib/types/default-scripts/counter-map-contract";
import counterNote from "@/lib/types/default-scripts/counter-note";
import counterScript from "@/lib/types/default-scripts/counter-script";
import p2id from "@/lib/types/default-scripts/p2id";
import timelockP2id from "@/lib/types/default-scripts/timelock-p2id";
import type {
  CompiledPackage,
  Dependency,
  Export,
  Script,
  ScriptExample,
  ScriptType,
} from "@/lib/types/script";
import { sleep } from "@/lib/utils";
import { defaultScript } from "@/lib/utils/script";

// Stand-ins for apps/api in the tutorials that don't compile real scripts (see
// lib/api.ts). Script ids are `<example>_<uuid>`.

const scriptsRust: Record<ScriptExample | "none", string> = {
  none: defaultScript().rust,
  "p2id-note": p2id.rust,
  "auth-no-auth": authNoAuth.rust,
  "counter-account": counterMapContract.rust,
  "counter-note": counterNote.rust,
  "counter-script": counterScript.rust,
  "count-reader": countReader.rust,
} as const;

const scriptsDependencies: Record<ScriptExample | "none", Dependency[]> = {
  none: defaultScript().dependencies,
  "p2id-note": p2id.dependencies,
  "auth-no-auth": authNoAuth.dependencies,
  "counter-account": counterMapContract.dependencies,
  "counter-note": counterNote.dependencies,
  "counter-script": counterScript.dependencies,
  "count-reader": countReader.dependencies,
} as const;

const scripts: Record<ScriptExample | "none", Script> = {
  none: defaultScript(),
  "p2id-note": timelockP2id,
  "auth-no-auth": authNoAuth,
  "counter-account": counterMapContract,
  "counter-note": counterNote,
  "counter-script": counterScript,
  "count-reader": countReader,
} as const;

const scriptsExports: Record<ScriptExample | "none", Export[]> = {
  none: defaultScript().procedureExports.map((procedureExport) => ({
    Procedure: procedureExport,
  })),
  "p2id-note": timelockP2id.procedureExports.map((procedureExport) => ({
    Procedure: procedureExport,
  })),
  "auth-no-auth": authNoAuth.procedureExports.map((procedureExport) => ({
    Procedure: procedureExport,
  })),
  "counter-account": counterMapContract.procedureExports.map(
    (procedureExport) => ({
      Procedure: procedureExport,
    }),
  ),
  "counter-note": counterNote.procedureExports.map((procedureExport) => ({
    Procedure: procedureExport,
  })),
  "counter-script": counterScript.procedureExports.map((procedureExport) => ({
    Procedure: procedureExport,
  })),
  "count-reader": countReader.procedureExports.map((procedureExport) => ({
    Procedure: procedureExport,
  })),
} as const;

// Results end up in the app state: return copies, not the tables' objects.
export const mockCreateScript = async ({
  name,
  type,
  example,
}: {
  name: string;
  type: ScriptType;
  example: ScriptExample | "none";
}): Promise<Pick<Script, "id" | "name" | "type" | "rust" | "dependencies">> => {
  await sleep(1000);
  return {
    id: `${example}_${crypto.randomUUID()}`,
    name,
    type,
    rust: scriptsRust[example],
    dependencies: structuredClone(scriptsDependencies[example]),
  };
};

export const mockCompileScript = async ({
  id,
  name,
  rust,
}: Pick<Script, "id" | "name" | "rust">): Promise<CompiledPackage> => {
  await sleep(1000);
  const [rawExample] = id.split("_");
  const example = rawExample as ScriptExample;
  const script = scripts[example];
  let masm = script.masm;
  if (example === "counter-account") {
    const matches = rust.matchAll(/felt!\((\d*)\)/g);
    const lastMatch = Array.from(matches ?? []).at(-1);
    const incrementValue = Number(lastMatch?.at(1));
    masm = masm.replace("add.1", `add.${incrementValue}`);
  }
  return {
    id,
    name,
    type: script.type,
    status: "compiled",
    masm,
    rust,
    commitment: script.commitment,
    masp: "",
    exports: structuredClone(scriptsExports[example]),
    error: "",
    dependencies: structuredClone(script.dependencies),
  };
};

export const mockDeleteScript = async (id: string) => {
  await sleep(1000);
  return { id };
};
