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
  const root = id.startsWith("counter-contract")
    ? "0x0"
    : "0x94377a3ed496ef4282bb98b1df09f14be986f5ffed1ac5dd2f7e23e01d9c3bce";
  await sleep(1000);
  return NextResponse.json({ ok: true, error: "", masm, root });
};

export const DELETE = async (
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await sleep(1000);
  return NextResponse.json({ id });
};
