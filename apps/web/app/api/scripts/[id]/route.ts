import { type NextRequest, NextResponse } from "next/server";
import counterMapContract from "@/lib/types/default-scripts/counter-map-contract";
import p2id from "@/lib/types/default-scripts/p2id";
import { sleep } from "@/lib/utils";
import {
  type ScriptExample,
  type Export,
  type Dependency,
} from "@/lib/types/script";

const scriptsMasm: Record<ScriptExample, string> = {
  "counter-contract": counterMapContract.masm,
  "p2id-note": p2id.masm,
} as const;

const scriptsDigest: Record<ScriptExample, string> = {
  "counter-contract": "0x0",
  "p2id-note":
    "0x94377a3ed496ef4282bb98b1df09f14be986f5ffed1ac5dd2f7e23e01d9c3bce",
} as const;

const scriptsExports: Record<ScriptExample, Export[]> = {
  "counter-contract": counterMapContract.exports,
  "p2id-note": [],
} as const;

const scriptsDependencies: Record<ScriptExample, Dependency[]> = {
  "counter-contract": [],
  "p2id-note": [{ id: "basic-wallet", name: "basic-wallet", digest: "" }],
} as const;

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();
  const { rust } = body as { rust: string };
  const [rawExample] = id.split("_");
  const example = rawExample as ScriptExample;
  let masm = scriptsMasm[example];
  if (example === "counter-contract") {
    const matches = rust.matchAll(/felt!\((\d*)\)/g);
    const lastMatch = Array.from(matches ?? []).at(-1);
    const incrementValue = Number(lastMatch?.at(1));
    masm = masm.replace("add.1", `add.${incrementValue}`);
  }
  const digest = scriptsDigest[example];
  const exports = scriptsExports[example];
  const dependencies = scriptsDependencies[example];
  await sleep(1000);
  return NextResponse.json({
    ok: true,
    error: "",
    masm,
    digest,
    masp: "",
    exports,
    dependencies,
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
