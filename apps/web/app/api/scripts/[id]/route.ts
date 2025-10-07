import { type NextRequest, NextResponse } from "next/server";
// import { counterMapContractMasm } from "@/lib/types/default-scripts/counter-map-contract";
// import { p2idMasm } from "@/lib/types/default-scripts/p2id";
import counterMapContractMasm from "@/app/api/scripts/[id]/counter-masm";
import p2idMasm from "@/app/api/scripts/[id]/p2id-masm";
import { sleep } from "@/lib/utils";

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const masm = id.startsWith("counter-contract")
    ? counterMapContractMasm
    : p2idMasm;
  await sleep(1000);
  return NextResponse.json({ ok: true, error: "", masm });
};

export const DELETE = async (
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await sleep(1000);
  return NextResponse.json({ id });
};
