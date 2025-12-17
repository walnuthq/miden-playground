import { type NextRequest, NextResponse } from "next/server";
import { newPackage } from "@/lib/miden-compiler";
import type { PackageType } from "@/lib/types";

type CreateScriptRequestBody = {
  name: string;
  type: PackageType;
  example: string;
};

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const { name, type, example } = body as CreateScriptRequestBody;
  const { id, rust } = await newPackage({
    name,
    type,
    example: example === "none" ? undefined : example,
  });
  return NextResponse.json({ id, rust });
};
