import { type NextRequest, NextResponse } from "next/server";
import { v4 } from "uuid";
import { counterMapContractRust } from "@/lib/types/default-scripts/counter-map-contract";
import { p2idRust } from "@/lib/types/default-scripts/p2id";
import { sleep } from "@/lib/utils";

type CreateScriptRequestBody = { packageName: string; example?: string };

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const { example } = body as CreateScriptRequestBody;
  const id = `${example}-${v4()}`;
  const rust =
    example === "counter-contract" ? counterMapContractRust : p2idRust;
  await sleep(1000);
  return NextResponse.json({ id, rust });
};
