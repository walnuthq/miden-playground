import { type NextRequest, NextResponse } from "next/server";
import counterMapContract from "@/lib/types/default-scripts/counter-map-contract";
import p2id from "@/lib/types/default-scripts/p2id";
// import counterMapContractMasm from "@/app/api/scripts/[id]/counter-masm";
// import p2idMasm from "@/app/api/scripts/[id]/p2id-masm";
import { sleep } from "@/lib/utils";
import type { ScriptExample, Procedure } from "@/lib/types/script";

const scriptsMasm = {
  "counter-contract": counterMapContract.masm,
  "p2id-note": p2id.masm,
} as const;

const scriptsRoot = {
  "counter-contract": "0x0",
  "p2id-note":
    "0x94377a3ed496ef4282bb98b1df09f14be986f5ffed1ac5dd2f7e23e01d9c3bce",
} as const;

const scriptsPackages: Record<string, { type: "Buffer"; data: number[] }> = {
  "counter-contract": { type: "Buffer", data: [] },
  "p2id-note": { type: "Buffer", data: [] },
} as const;

const scriptsDependencies = {
  "counter-contract": [],
  "p2id-note": ["basic-wallet"],
} as const;

const scriptsProcedures: Record<string, Procedure[]> = {
  "counter-contract": counterMapContract.procedures,
  "p2id-note": [],
} as const;

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const [rawExample] = id.split("_");
  const example = rawExample as ScriptExample;
  const masm = scriptsMasm[example];
  const root = scriptsRoot[example];
  const packageBuffer = scriptsPackages[example];
  const dependencies = scriptsDependencies[example];
  const procedures = scriptsProcedures[example];
  await sleep(1000);
  return NextResponse.json({
    ok: true,
    error: "",
    masm,
    root,
    package: packageBuffer,
    dependencies,
    procedures,
  });
};

export const DELETE = async (
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await sleep(1000);
  return NextResponse.json({ id });
};
