import { type NextRequest, NextResponse } from "next/server";
import { v4 } from "uuid";
import { counterMapContractRust } from "@/lib/types/default-scripts/counter-map-contract";
import { p2idRust } from "@/lib/types/default-scripts/p2id";
import { sleep } from "@/lib/utils";
import type { ScriptExample } from "@/lib/types/script";

type CreateScriptRequestBody = { packageName: string; example: ScriptExample };

const scriptsRust = {
  "counter-contract": counterMapContractRust,
  "p2id-note": p2idRust,
} as const;

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const { example } = body as CreateScriptRequestBody;
  const id = `${example}_${v4()}`;
  const rust = scriptsRust[example];
  await sleep(1000);
  return NextResponse.json({ id, rust });
};
