import { type Script, type ScriptExample } from "@/lib/types/script";

// const apiUrl =
//   process.env.NEXT_PUBLIC_API_URL ?? "https://playground-api.walnut.dev";

const apiUrl = "/api";

export const createScript = async (
  packageName: string,
  example?: ScriptExample
) => {
  const response = await fetch(`${apiUrl}/scripts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageName, example }),
  });
  const result = await response.json();
  const { id, rust } = result as { id: string; rust: string };
  return { id, rust };
};

export const compileScript = async (script: Script) => {
  const response = await fetch(`${apiUrl}/scripts/${script.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rust: script.rust }),
  });
  const result = await response.json();
  const { ok, error, masm } = result as {
    ok: boolean;
    error: string;
    masm: string;
  };
  return { ok, error, masm };
};

export const deleteScript = async (scriptId: string) => {
  const response = await fetch(`${apiUrl}/scripts/${scriptId}`, {
    method: "DELETE",
  });
  const result = await response.json();
  const { id } = result as { id: string };
  return id;
};
