import { type NextRequest, NextResponse } from "next/server";
import counterMapContract from "@/lib/types/default-scripts/counter-map-contract";
import timelockP2id from "@/lib/types/default-scripts/timelock-p2id";
import counterNote from "@/lib/types/default-scripts/counter-note";
import { sleep } from "@/lib/utils";
import {
  type ScriptExample,
  type Export,
  defaultScript,
  type Script,
  type CompiledPackage,
} from "@/lib/types/script";

type CompileScriptRequestBody = {
  name: string;
  rust: string;
  dependencies: string[];
};

type CompileScriptResponse = { package: CompiledPackage };

const scripts: Record<ScriptExample | "none", Script> = {
  none: defaultScript(),
  "counter-account": counterMapContract,
  "p2id-note": timelockP2id,
  "counter-note": counterNote,
} as const;

const scriptsExports: Record<ScriptExample | "none", Export[]> = {
  none: defaultScript().procedureExports.map((procedureExport) => ({
    Procedure: procedureExport,
  })),
  "counter-account": counterMapContract.procedureExports.map(
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

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, rust } = body as CompileScriptRequestBody;
    const [rawExample] = id.split("_");
    const example = rawExample as ScriptExample;
    let masm = scripts[example].masm;
    if (example === "counter-account") {
      const matches = rust.matchAll(/felt!\((\d*)\)/g);
      const lastMatch = Array.from(matches ?? []).at(-1);
      const incrementValue = Number(lastMatch?.at(1));
      masm = masm.replace("add.1", `add.${incrementValue}`);
    }
    await sleep(1000);
    return NextResponse.json<CompileScriptResponse>({
      package: {
        id,
        name,
        type: scripts[example].type,
        error: "",
        masm,
        rust,
        digest: scripts[example].digest,
        masp: "",
        exports: scriptsExports[example],
        dependencies: scripts[example].dependencies,
      },
    });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};

export const DELETE = async (
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    await sleep(1000);
    return NextResponse.json<{ package: { id: string } }>({ package: { id } });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
