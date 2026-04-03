import { type NextRequest, NextResponse } from "next/server";
import { newPackage } from "@/lib/miden-compiler";
import type {
  Package,
  Dependency,
  PackageType,
  ScriptExample,
} from "@/lib/types";
import { basicWalletDependency } from "@/lib/default-dependencies";

type CreateScriptRequestBody = {
  name: string;
  type: PackageType;
  example: ScriptExample;
};

type CreateScriptResponse = {
  package: Pick<Package, "id" | "name" | "type" | "rust"> & {
    dependencies: Dependency[];
  };
};

const scriptsDependencies: Record<ScriptExample, Dependency[]> = {
  none: [],
  "counter-account": [],
  "p2id-note": [basicWalletDependency],
  "counter-note": [],
} as const;

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, type, example } = body as CreateScriptRequestBody;
    const dbPackage = await newPackage({
      name,
      type,
      example: example === "none" ? undefined : example,
      dependencies: scriptsDependencies[example],
    });
    return NextResponse.json<CreateScriptResponse>({ package: dbPackage });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
