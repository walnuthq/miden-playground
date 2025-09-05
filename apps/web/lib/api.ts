import { type Script } from "@/lib/types";

export const compileScript = async (script: Script) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/scripts/${script.id}`,
    {
      method: "POST",
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
  return { error, masm };
};
