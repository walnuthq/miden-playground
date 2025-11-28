import {
  type Script,
  type ScriptExample,
  type Export,
  type Dependency,
  type ScriptType,
} from "@/lib/types/script";

// const apiUrl = process.env.NEXT_PUBLIC_API_URL;
// const apiUrl = "/api";

export const createScript = async ({
  packageName,
  type,
  example,
}: {
  packageName: string;
  type: ScriptType;
  example: ScriptExample | "none";
}) => {
  const apiUrl = example === "none" ? process.env.NEXT_PUBLIC_API_URL : "/api";
  const response = await fetch(`${apiUrl}/scripts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageName, type, example }),
  });
  const result = await response.json();
  const { id, rust } = result as { id: string; rust: string };
  return { id, rust };
};

export const compileScript = async (script: Script) => {
  const isExample =
    script.id.startsWith("counter-contract") ||
    script.id.startsWith("p2id-note");
  const apiUrl = isExample ? "/api" : process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/scripts/${script.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rust: script.rust }),
  });
  const result = await response.json();
  const {
    ok,
    error,
    masm,
    root,
    package: packageBuffer,
    exports,
    dependencies,
  } = result as {
    ok: boolean;
    error: string;
    masm: string;
    root: string;
    package: { type: "Buffer"; data: number[] };
    exports: Export[];
    dependencies: Dependency[];
  };
  return {
    ok,
    error,
    masm,
    root,
    packageBytes: packageBuffer.data,
    exports,
    dependencies,
  };
};

export const deleteScript = async (scriptId: string) => {
  const isExample =
    scriptId.startsWith("counter-contract") || scriptId.startsWith("p2id-note");
  const apiUrl = isExample ? "/api" : process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/scripts/${scriptId}`, {
    method: "DELETE",
  });
  const result = await response.json();
  const { id } = result as { id: string };
  return id;
};
