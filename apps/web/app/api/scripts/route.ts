import { type NextRequest, NextResponse } from "next/server";
import { v4 } from "uuid";
import counterMapContract from "@/lib/types/default-scripts/counter-map-contract";
import timelockP2id from "@/lib/types/default-scripts/timelock-p2id";
import counterNote from "@/lib/types/default-scripts/counter-note";
import { sleep } from "@/lib/utils";
import {
  type ScriptType,
  type ScriptExample,
  type Dependency,
  defaultScript,
} from "@/lib/types/script";

type CreateScriptRequestBody = {
  name: string;
  type: ScriptType;
  example: ScriptExample | "none";
};

const scriptsRust: Record<ScriptExample | "none", string> = {
  none: defaultScript().rust,
  "counter-contract": counterMapContract.rust,
  "p2id-note": timelockP2id.rust,
  "counter-note": counterNote.rust,
} as const;

const scriptsDependencies: Record<ScriptExample | "none", Dependency[]> = {
  none: defaultScript().dependencies,
  "counter-contract": counterMapContract.dependencies,
  "p2id-note": timelockP2id.dependencies,
  "counter-note": counterNote.dependencies,
} as const;

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const { example } = body as CreateScriptRequestBody;
  const id = `${example}_${v4()}`;
  const rust = scriptsRust[example];
  const dependencies = scriptsDependencies[example];
  await sleep(1000);
  return NextResponse.json({ id, rust, dependencies });
};
