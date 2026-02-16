import { type NextRequest, NextResponse } from "next/server";
import counterMapContract from "@/lib/types/default-scripts/counter-map-contract";
import timelockP2id from "@/lib/types/default-scripts/timelock-p2id";
import counterNote from "@/lib/types/default-scripts/counter-note";
import { sleep } from "@/lib/utils";
import {
  type ScriptExample,
  type Export,
  type Dependency,
  defaultScript,
} from "@/lib/types/script";

const scriptsMasm: Record<ScriptExample | "none", string> = {
  none: defaultScript().masm,
  "counter-contract": counterMapContract.masm,
  "p2id-note": timelockP2id.masm,
  "counter-note": counterNote.masm,
} as const;

const scriptsDigest: Record<ScriptExample | "none", string> = {
  none: defaultScript().digest,
  "counter-contract": counterMapContract.digest,
  "p2id-note": timelockP2id.digest,
  "counter-note": counterNote.digest,
} as const;

const scriptsExports: Record<ScriptExample | "none", Export[]> = {
  none: defaultScript().procedureExports.map((procedureExport) => ({
    Procedure: procedureExport,
  })),
  "counter-contract": counterMapContract.procedureExports.map(
    (procedureExport) => ({
      Procedure: procedureExport,
    }),
  ),
  "p2id-note": timelockP2id.procedureExports.map((procedureExport) => ({
    Procedure: procedureExport,
  })),
  "counter-note": counterNote.procedureExports.map((procedureExport) => ({
    Procedure: procedureExport,
  })),
} as const;

const scriptsDependencies: Record<ScriptExample | "none", Dependency[]> = {
  none: defaultScript().dependencies,
  "counter-contract": counterMapContract.dependencies,
  "p2id-note": timelockP2id.dependencies,
  "counter-note": counterNote.dependencies,
} as const;

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  await sleep(1000);
  return NextResponse.json({ id });
};
