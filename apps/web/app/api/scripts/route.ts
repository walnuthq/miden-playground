import { type NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import counterMapContract from "@/lib/types/default-scripts/counter-map-contract";
import timelockP2id from "@/lib/types/default-scripts/timelock-p2id";
import counterNote from "@/lib/types/default-scripts/counter-note";
import { sleep } from "@/lib/utils";
import type {
  ScriptType,
  ScriptExample,
  Dependency,
  Script,
} from "@/lib/types/script";
import { defaultScript } from "@/lib/utils/script";

type CreateScriptRequestBody = {
  name: string;
  type: ScriptType;
  example: ScriptExample | "none";
};

type CreateScriptResponse = {
  package: Pick<Script, "id" | "name" | "type" | "rust"> & {
    dependencies: Dependency[];
  };
};

const scriptsRust: Record<ScriptExample | "none", string> = {
  none: defaultScript().rust,
  "counter-account": counterMapContract.rust,
  "p2id-note": timelockP2id.rust,
  "counter-note": counterNote.rust,
} as const;

const scriptsDependencies: Record<ScriptExample | "none", Dependency[]> = {
  none: defaultScript().dependencies,
  "counter-account": counterMapContract.dependencies,
  "p2id-note": timelockP2id.dependencies,
  "counter-note": counterNote.dependencies,
} as const;

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, type, example } = body as CreateScriptRequestBody;
    const id = `${example}_${randomUUID()}`;
    const rust = scriptsRust[example];
    const dependencies = scriptsDependencies[example];
    await sleep(400);
    return NextResponse.json<CreateScriptResponse>({
      package: { id, name, type, rust, dependencies },
    });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
