import { type NextRequest, NextResponse } from "next/server";
import type {
  Package,
  Dependency,
  PackageType,
  ScriptExample,
} from "@/lib/types";
import { basicWalletDependency } from "@/lib/default-dependencies";
import { templates } from "@/lib/templates";
import { createPackage } from "@/lib/utils";

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
  "p2id-note": [basicWalletDependency],
  "counter-account": [],
  "counter-note": [],
  "counter-script": [],
} as const;

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, type, example } = body as CreateScriptRequestBody;
    const rust = templates[example === "none" ? type : example];
    const packageId = await createPackage({
      name,
      type,
      rust,
      dependencies: scriptsDependencies[example],
    });
    return NextResponse.json<CreateScriptResponse>({
      package: {
        id: packageId,
        name,
        type,
        rust,
        dependencies: scriptsDependencies[example],
      },
    });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
