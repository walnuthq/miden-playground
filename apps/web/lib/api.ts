import { type Script } from "@/lib/types";

export const createScript = async (packageName: string) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scripts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageName }),
  });
  const result = await response.json();
  const { id, rust } = result as { id: string; rust: string };
  return { id, rust };
};

export const compileScript = async (script: Script) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/scripts/${script.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rust: script.rust }),
    }
  );
  const result = await response.json();
  const { ok, error, masm } = result as {
    ok: boolean;
    error: string;
    masm: string;
  };
  return { ok, error, masm };
};

export const deleteScript = async (scriptId: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/scripts/${scriptId}`,
    {
      method: "DELETE",
    }
  );
  const result = await response.json();
  const { id } = result as { id: string };
  return id;
};
