import { type NextRequest, NextResponse } from "next/server";
import { newPackage } from "@/lib/miden-compiler";
import type { Dependency, PackageType } from "@/lib/types";
import { basicWalletDependency } from "@/lib/default-dependencies";

type CreateScriptRequestBody = {
  name: string;
  type: PackageType;
  example: string;
};

const scriptsDependencies: Record<string, Dependency[]> = {
  none: [],
  "counter-contract": [],
  "p2id-note": [
    {
      id: basicWalletDependency.id,
      name: basicWalletDependency.name,
      digest: basicWalletDependency.digest,
    },
  ],
  "counter-note": [],
} as const;

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const { name, type, example } = body as CreateScriptRequestBody;
  const { id, rust, dependencies } = await newPackage({
    name,
    type,
    example: example === "none" ? undefined : example,
    dependencies: scriptsDependencies[example],
  });
  return NextResponse.json({ id, rust, dependencies });
};
